// Privilege escalation for commands that need root on a managed host.
//
// The panel connects as the registered SSH user, which may be root, may have
// passwordless sudo, or may need a sudo password. This module builds the right
// invocation for each case so every feature works "however the user connected"
// — the password, when needed, is fed over STDIN (never the command line), the
// same anti-injection rule the rest of the app follows.
//
// The command always runs inside `sh -c '<cmd>'`. Running as root through a
// shell means env prefixes (e.g. `DEBIAN_FRONTEND=noninteractive apt-get`) just
// work — no `sudo env` dance, since sudo runs the shell and the shell sets the
// env for the child.

export type SudoMode = "none" | "nopasswd" | "password" | "unknown";

export const SUDO_MODES: readonly SudoMode[] = [
  "none",
  "nopasswd",
  "password",
  "unknown",
];

/** Single-quote a string for safe embedding in `sh -c '...'`. */
export function shSingleQuote(s: string): string {
  // Close the quote, emit an escaped ', reopen: 'it'\''s me'
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

export type Escalation = {
  /** The command to exec on the host. */
  command: string;
  /** When true, the caller must prepend `<sudoPassword>\n` to the command's
   *  stdin — `sudo -S` reads that first line, the wrapped command inherits the
   *  rest (so commands that also need stdin still work). */
  needsPassword: boolean;
};

/**
 * Wrap `cmd` (a plain command that needs root, with NO `sudo` of its own) for
 * the host's detected sudo mode.
 */
export function escalate(cmd: string, mode: SudoMode): Escalation {
  const q = shSingleQuote(cmd);
  switch (mode) {
    case "none":
      // Already root — run bare.
      return { command: `sh -c ${q}`, needsPassword: false };
    case "nopasswd":
      return { command: `sudo -n -- sh -c ${q}`, needsPassword: false };
    case "password":
      // `-S` reads the password from stdin, `-p ''` suppresses the prompt text.
      return { command: `sudo -S -p '' -- sh -c ${q}`, needsPassword: true };
    case "unknown":
    default:
      // Not probed yet. Decide on the host: root runs bare, otherwise try
      // passwordless sudo. A password-only host must be tested first to reach
      // "password" mode; here it would fail cleanly rather than hang.
      return {
        command: `if [ "$(id -u)" = 0 ]; then sh -c ${q}; else sudo -n -- sh -c ${q}; fi`,
        needsPassword: false,
      };
  }
}

// One-shot probe run at connection test to classify the host. Prints exactly one
// of: none | nopasswd | password.
export const SUDO_MODE_PROBE =
  'if [ "$(id -u)" = 0 ]; then echo none; ' +
  "elif sudo -n true 2>/dev/null; then echo nopasswd; " +
  "else echo password; fi";

export function parseSudoMode(stdout: string): SudoMode {
  const v = stdout.trim();
  return v === "none" || v === "nopasswd" || v === "password" ? v : "unknown";
}
