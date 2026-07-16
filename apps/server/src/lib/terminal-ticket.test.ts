import { beforeAll, describe, expect, it } from "bun:test";
import { createHmac } from "node:crypto";

import { signTicket, type TicketPayload, verifyTicket } from "./terminal-ticket";

const SECRET = "test-secret-not-a-real-key";

beforeAll(() => {
  process.env.BETTER_AUTH_SECRET = SECRET;
});

/** Mint a ticket with an arbitrary payload, signed with `secret`. */
function forge(payload: Partial<TicketPayload>, secret = SECRET): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

// The ticket is the only thing standing between a websocket connection and a
// root shell on someone else's server.
describe("verifyTicket", () => {
  it("accepts a freshly signed ticket", () => {
    const payload = verifyTicket(signTicket("user-1", "server-1"));
    expect(payload?.userId).toBe("user-1");
    expect(payload?.serverId).toBe("server-1");
    expect(payload?.exp).toBeGreaterThan(Date.now());
  });

  it("rejects a forged signature", () => {
    const [body] = signTicket("user-1", "server-1").split(".");
    expect(verifyTicket(`${body}.deadbeef`)).toBeNull();
  });

  // The attack that matters: swap in another server's id and re-sign with a
  // guessed secret.
  it("rejects a ticket signed with the wrong secret", () => {
    const token = forge(
      { userId: "attacker", serverId: "victim-server", exp: Date.now() + 60_000 },
      "wrong-secret",
    );
    expect(verifyTicket(token)).toBeNull();
  });

  it("rejects a tampered payload that keeps the old signature", () => {
    const [, sig] = signTicket("user-1", "server-1").split(".");
    const body = Buffer.from(
      JSON.stringify({ userId: "user-1", serverId: "other", exp: Date.now() + 60_000 }),
    ).toString("base64url");
    expect(verifyTicket(`${body}.${sig}`)).toBeNull();
  });

  it("rejects an expired ticket", () => {
    expect(
      verifyTicket(forge({ userId: "u", serverId: "s", exp: Date.now() - 1 })),
    ).toBeNull();
  });

  it("rejects a ticket with a non-numeric exp", () => {
    expect(
      verifyTicket(forge({ userId: "u", serverId: "s", exp: "later" as unknown as number })),
    ).toBeNull();
  });

  it("rejects a ticket with no exp", () => {
    expect(verifyTicket(forge({ userId: "u", serverId: "s" }))).toBeNull();
  });

  it("rejects malformed tokens", () => {
    for (const bad of ["", ".", "nodot", "a.", ".b", "a.b.c"]) {
      expect(verifyTicket(bad)).toBeNull();
    }
  });

  // timingSafeEqual throws on length mismatch, so the guard must run first —
  // otherwise a short signature is a 500 instead of a rejection.
  it("rejects a signature of the wrong length without throwing", () => {
    const [body] = signTicket("user-1", "server-1").split(".");
    expect(() => verifyTicket(`${body}.aa`)).not.toThrow();
    expect(verifyTicket(`${body}.aa`)).toBeNull();
  });

  it("rejects a body that is not JSON", () => {
    const body = Buffer.from("not json").toString("base64url");
    const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
    expect(verifyTicket(`${body}.${sig}`)).toBeNull();
  });
});
