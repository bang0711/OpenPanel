// Standalone WebSocket ⇄ SSH shell bridge for the web terminal.
// Runs on Node (via tsx): `bun run terminal`. Verifies a short-lived ticket
// minted by the authenticated Next route, then pipes an interactive PTY.
import "dotenv/config";

import { Client, type ClientChannel } from "ssh2";
import { WebSocketServer } from "ws";

import { prisma } from "../src/db/prisma";
import { buildConfig } from "../src/lib/ssh/client";
import { verifyTicket } from "../src/lib/terminal-ticket";

const port = Number(process.env.OPENPANEL_WS_PORT ?? 3001);
const wss = new WebSocketServer({ port });
console.log(`[terminal] websocket bridge listening on :${port}`);

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const ticket = url.searchParams.get("ticket");
  const payload = ticket ? verifyTicket(ticket) : null;
  if (!payload) {
    ws.close(1008, "Unauthorized");
    return;
  }

  // Re-check ownership against the DB (ticket only proves who minted it).
  const server = await prisma.server.findUnique({
    where: { id: payload.serverId },
  });
  if (!server || server.ownerId !== payload.userId) {
    ws.close(1008, "Forbidden");
    return;
  }

  const conn = new Client();
  let stream: ClientChannel | null = null;

  const send = (data: Buffer) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  };

  conn.on("ready", () => {
    conn.shell(
      { term: "xterm-256color", cols: 80, rows: 24 },
      (err, channel) => {
        if (err) {
          if (ws.readyState === ws.OPEN) ws.send(`\r\n${err.message}\r\n`);
          ws.close();
          conn.end();
          return;
        }
        stream = channel;
        channel.on("data", send);
        channel.stderr.on("data", send);
        channel.on("close", () => {
          ws.close();
          conn.end();
        });
      },
    );
  });

  conn.on("error", (err) => {
    if (ws.readyState === ws.OPEN) ws.send(`\r\n${err.message}\r\n`);
    ws.close();
  });

  ws.on("message", (raw) => {
    if (!stream) return;
    let msg: { t: string; d?: string; cols?: number; rows?: number };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.t === "i" && typeof msg.d === "string") {
      stream.write(msg.d);
    } else if (msg.t === "r" && msg.rows && msg.cols) {
      stream.setWindow(msg.rows, msg.cols, 0, 0);
    }
  });

  ws.on("close", () => {
    try {
      stream?.end();
    } catch {
      /* ignore */
    }
    conn.end();
  });

  conn.connect(buildConfig(server));
});
