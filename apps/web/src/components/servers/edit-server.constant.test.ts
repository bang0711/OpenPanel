import { describe, expect, it } from "bun:test";

import { buildServerUpdate } from "./edit-server.constant";

const base = {
  name: "web-1",
  host: "10.0.0.1",
  port: 22,
  username: "root",
  tags: "prod, web",
  authType: "password" as const,
  password: "",
  keyText: "",
  passphrase: "",
};

describe("buildServerUpdate", () => {
  it("omits secret when the password is blank (keep current)", () => {
    const out = buildServerUpdate(base);
    expect(out.secret).toBeUndefined();
    expect(out.name).toBe("web-1");
    expect(out.authType).toBe("password");
  });

  it("includes the password as secret when provided", () => {
    expect(buildServerUpdate({ ...base, password: "hunter2" }).secret).toBe(
      "hunter2",
    );
  });

  it("uses the key text as secret in key mode", () => {
    const out = buildServerUpdate({
      ...base,
      authType: "key",
      keyText: "KEYDATA",
    });
    expect(out.secret).toBe("KEYDATA");
  });

  it("omits the key secret when the textarea is blank", () => {
    const out = buildServerUpdate({ ...base, authType: "key" });
    expect(out.secret).toBeUndefined();
  });

  it("sends passphrase only in key mode and only when non-empty", () => {
    expect(buildServerUpdate({ ...base, passphrase: "pp" }).passphrase).toBeUndefined();
    expect(
      buildServerUpdate({ ...base, authType: "key", keyText: "k", passphrase: "pp" })
        .passphrase,
    ).toBe("pp");
  });

  it("trims tags and drops blanks", () => {
    expect(buildServerUpdate({ ...base, tags: " a , ,b, " }).tags).toEqual([
      "a",
      "b",
    ]);
    expect(buildServerUpdate({ ...base, tags: "" }).tags).toEqual([]);
  });
});
