import { createHmac, timingSafeEqual } from "node:crypto";

// Short-lived, HMAC-signed ticket authorizing one terminal session.
// Minted by the authenticated Next route, verified by the standalone ws server
// (both share BETTER_AUTH_SECRET). Format: base64url(payload).base64url(sig)

export type TicketPayload = {
  userId: string;
  serverId: string;
  exp: number; // epoch ms
};

const TTL_MS = 60_000;

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET is not set");
  return s;
}

export function signTicket(userId: string, serverId: string): string {
  const payload: TicketPayload = { userId, serverId, exp: Date.now() + TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyTicket(token: string): TicketPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as TicketPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
