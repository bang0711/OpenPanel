import { runCommand, runPrivileged, type SshServer } from "@/lib/ssh/client";

import {
  DOCKER_ACTIONS,
  type DockerAction,
  isValidId,
} from "./docker.constant";

export type DockerContainer = {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
};

export type DockerImage = {
  id: string;
  repository: string;
  tag: string;
  size: string;
};

export type DockerStatus = {
  installed: boolean;
  containers: DockerContainer[];
  images: DockerImage[];
};

export class DockerService {
  async status(server: SshServer): Promise<DockerStatus> {
    const detect = await runCommand(
      server,
      "command -v docker >/dev/null 2>&1 && echo yes || echo no",
    );
    if (detect.stdout.trim() !== "yes") {
      return { installed: false, containers: [], images: [] };
    }
    const [containers, images] = await Promise.all([
      this.ps(server),
      this.images(server),
    ]);
    return { installed: true, containers, images };
  }

  async ps(server: SshServer): Promise<DockerContainer[]> {
    const { stdout } = await runPrivileged(
      server,
      "docker ps -a --format '{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.State}}\\t{{.Status}}'",
    );
    return stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [id, name, image, state, status] = l.split("\t");
        return {
          id: id ?? "",
          name: name ?? "",
          image: image ?? "",
          state: state ?? "",
          status: status ?? "",
        };
      });
  }

  async images(server: SshServer): Promise<DockerImage[]> {
    const { stdout } = await runPrivileged(
      server,
      "docker images --format '{{.ID}}\\t{{.Repository}}\\t{{.Tag}}\\t{{.Size}}'",
    );
    return stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [id, repository, tag, size] = l.split("\t");
        return {
          id: id ?? "",
          repository: repository ?? "",
          tag: tag ?? "",
          size: size ?? "",
        };
      });
  }

  async action(
    server: SshServer,
    id: string,
    action: DockerAction,
  ): Promise<{ ok: boolean; output: string }> {
    if (!isValidId(id)) throw new Error("Invalid container id");
    if (!DOCKER_ACTIONS.includes(action)) throw new Error("Invalid action");
    const cmd =
      action === "rm" ? `docker rm -f ${id}` : `docker ${action} ${id}`;
    const { stdout, stderr, code } = await runPrivileged(server, cmd);
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }

  async removeImage(
    server: SshServer,
    id: string,
  ): Promise<{ ok: boolean; output: string }> {
    if (!isValidId(id)) throw new Error("Invalid image id");
    const { stdout, stderr, code } = await runPrivileged(
      server,
      `docker rmi ${id}`,
    );
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }

  async logs(server: SshServer, id: string): Promise<string> {
    if (!isValidId(id)) throw new Error("Invalid container id");
    const { stdout } = await runPrivileged(
      server,
      `docker logs --tail 200 ${id} 2>&1`,
    );
    return stdout;
  }
}

export const dockerService = new DockerService();
