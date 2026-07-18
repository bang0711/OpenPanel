import { encryptSecret } from "@/lib/crypto";
import { runCommand, type SshServer, testConnection } from "@/lib/ssh/client";
import { parseSudoMode, SUDO_MODE_PROBE } from "@/lib/ssh/privilege";
import { prisma } from "@/db/prisma";
import type { AuthUser } from "@/server/access";

import {
  DEFAULT_SSH_PORT,
  OS_RELEASE_CMD,
  parseOsRelease,
  planServerUpdate,
} from "./servers.constant";
import type { CreateServerBody, UpdateServerBody } from "./servers.schema";

type ServerRow = {
  id: string;
  ownerId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: string;
  sudoMode: string | null;
  hostFingerprint: string | null;
  osId: string | null;
  osName: string | null;
  tags: string[];
  createdAt: Date;
};

export class ServersService {
  /** Strip secret columns before returning a server to the client. */
  sanitize(s: ServerRow) {
    return {
      id: s.id,
      ownerId: s.ownerId,
      name: s.name,
      host: s.host,
      port: s.port,
      username: s.username,
      authType: s.authType,
      // How the user reaches root (detected on test). Not a secret; the sudo
      // password itself (sudoPasswordEnc) is never returned.
      sudoMode: s.sudoMode,
      hostFingerprint: s.hostFingerprint,
      osId: s.osId,
      osName: s.osName,
      tags: s.tags,
      createdAt: s.createdAt,
    };
  }

  /**
   * Classify how this host's SSH user reaches root (root / passwordless sudo /
   * sudo password), stored so every privileged command picks the right form.
   * Best-effort: an unreachable host or an odd shell just leaves sudoMode null,
   * and escalation falls back to a safe runtime check.
   */
  async detectSudoMode(server: SshServer & { id: string }) {
    try {
      const { stdout } = await runCommand(server, SUDO_MODE_PROBE);
      const sudoMode = parseSudoMode(stdout);
      await prisma.server.update({
        where: { id: server.id },
        data: { sudoMode },
      });
      return sudoMode;
    } catch {
      return null;
    }
  }

  /**
   * Best-effort distro detection for the server icon. Never throws: a host
   * without /etc/os-release (or an unreachable one) just keeps a null osId.
   */
  async detectOs(server: SshServer & { id: string }) {
    try {
      const { stdout } = await runCommand(server, OS_RELEASE_CMD);
      const { osId, osName } = parseOsRelease(stdout);
      if (!osId && !osName) return null;
      await prisma.server.update({
        where: { id: server.id },
        data: { osId, osName },
      });
      return { osId, osName };
    } catch {
      return null;
    }
  }

  async list(user: AuthUser) {
    const servers = await prisma.server.findMany({
      where: user.role === "admin" ? {} : { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return servers.map((s) => this.sanitize(s));
  }

  async create(user: AuthUser, body: CreateServerBody) {
    const server = await prisma.server.create({
      data: {
        ownerId: user.id,
        name: body.name,
        host: body.host,
        port: body.port ?? DEFAULT_SSH_PORT,
        username: body.username,
        authType: body.authType,
        secretEnc: encryptSecret(body.secret),
        passphraseEnc: body.passphrase ? encryptSecret(body.passphrase) : null,
        sudoPasswordEnc: body.sudoPassword
          ? encryptSecret(body.sudoPassword)
          : null,
        tags: body.tags ?? [],
      },
    });
    return this.sanitize(server);
  }

  /**
   * Edit a server. `current` is the row already loaded by the auth gate; it is
   * used to decide whether the host key must be re-pinned and to validate an
   * auth-type switch. Returns a plain error string for a bad request (the
   * controller turns it into a 400) rather than throwing.
   */
  async update(
    id: string,
    body: UpdateServerBody,
    current: { host: string; port: number; authType: string },
  ) {
    const plan = planServerUpdate(body, current);
    if (plan.error) return { error: plan.error };

    const data: Record<string, unknown> = { ...plan.fields };
    if (plan.resetPin) {
      data.hostFingerprint = null;
      data.osId = null;
      data.osName = null;
      // Host/port moved — the sudo classification belonged to the old endpoint;
      // re-probe on the next Test.
      data.sudoMode = null;
    }
    if (plan.setSecret) data.secretEnc = encryptSecret(body.secret as string);
    if (plan.setPassphrase === "set")
      data.passphraseEnc = encryptSecret(body.passphrase as string);
    else if (plan.setPassphrase === "clear") data.passphraseEnc = null;
    // Sudo password: absent = keep, empty string = clear, value = set.
    if (body.sudoPassword !== undefined)
      data.sudoPasswordEnc = body.sudoPassword
        ? encryptSecret(body.sudoPassword)
        : null;
    if (body.tags !== undefined) data.tags = body.tags;

    const server = await prisma.server.update({ where: { id }, data });
    return this.sanitize(server);
  }

  async setTags(id: string, tags: string[]) {
    const server = await prisma.server.update({
      where: { id },
      data: { tags },
    });
    return this.sanitize(server);
  }

  async remove(id: string) {
    await prisma.server.delete({ where: { id } });
    return { ok: true };
  }

  /** Test connectivity and pin the host-key fingerprint on first success (TOFU). */
  async testAndPin(
    server: SshServer & { id: string; hostFingerprint: string | null },
  ) {
    const { ok, fingerprint } = await testConnection(server);
    const shouldPin = !server.hostFingerprint && !!fingerprint;
    if (shouldPin) {
      await prisma.server.update({
        where: { id: server.id },
        data: { hostFingerprint: fingerprint },
      });
    }
    // Detect with the fresh pin applied, so this connection is verified
    // against the key we just captured rather than trusting blindly again.
    if (ok) {
      const verified = {
        ...server,
        hostFingerprint: fingerprint || server.hostFingerprint,
      };
      await this.detectOs(verified);
      // Classify sudo now, so the first privileged action already knows how to
      // reach root instead of falling back to a runtime probe.
      await this.detectSudoMode(verified);
    }
    return { ok, fingerprint, pinned: shouldPin };
  }
}

export const serversService = new ServersService();
