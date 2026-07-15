import { Elysia, t } from "elysia";
import { Client, type ClientChannel } from "ssh2";

import { prisma } from "@/db/prisma";
import { buildConfig } from "@/lib/ssh/client";
import { verifyTicket } from "@/lib/terminal-ticket";

// In-process WebSocket ⇄ SSH shell bridge, hosted on the main API server.
// Auth is a short-lived HMAC ticket (query param), re-checked against the DB.
type Session = { conn: Client; stream: ClientChannel | null };
const sessions = new WeakMap<object, Session>();

function parse(message: unknown): { t?: string; d?: string; cols?: number; rows?: number } | null {
  if (typeof message === "object" && message) return message as never;
  if (typeof message !== "string") return null;
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

export const terminalWsController = new Elysia().ws("/terminal", {
  query: t.Object({ ticket: t.Optional(t.String()) }),

  async open(ws) {
    const payload = ws.data.query.ticket ? verifyTicket(ws.data.query.ticket) : null;
    if (!payload) {
      ws.close(1008, "Unauthorized");
      return;
    }

    // Re-check ownership against the DB (ticket only proves who minted it).
    const server = await prisma.server.findUnique({ where: { id: payload.serverId } });
    if (!server || server.ownerId !== payload.userId) {
      ws.close(1008, "Forbidden");
      return;
    }

    const conn = new Client();
    const session: Session = { conn, stream: null };
    sessions.set(ws.raw, session);

    const send = (data: Buffer) => ws.raw.send(data);

    conn.on("ready", () => {
      conn.shell({ term: "xterm-256color", cols: 80, rows: 24 }, (err, channel) => {
        if (err) {
          ws.send(`\r\n${err.message}\r\n`);
          ws.close();
          conn.end();
          return;
        }
        session.stream = channel;
        channel.on("data", send);
        channel.stderr.on("data", send);
        channel.on("close", () => {
          ws.close();
          conn.end();
        });
      });
    });

    conn.on("error", (err) => {
      ws.send(`\r\n${err.message}\r\n`);
      ws.close();
    });

    conn.connect(buildConfig(server));
  },

  message(ws, message) {
    const session = sessions.get(ws.raw);
    if (!session?.stream) return;
    const msg = parse(message);
    if (!msg) return;
    if (msg.t === "i" && typeof msg.d === "string") {
      session.stream.write(msg.d);
    } else if (msg.t === "r" && msg.rows && msg.cols) {
      session.stream.setWindow(msg.rows, msg.cols, 0, 0);
    }
  },

  close(ws) {
    const session = sessions.get(ws.raw);
    if (!session) return;
    try {
      session.stream?.end();
    } catch {
      /* ignore */
    }
    session.conn.end();
    sessions.delete(ws.raw);
  },
});
