// Each dot-separated label must be alphanumeric/hyphen; full string re-checked.
export const DOMAIN_RE = /^[a-zA-Z0-9.-]+$/;

// Allowlist, not "anything that looks like an email". The address is passed to
// certbot as a shell argument, so a permissive class like [^\s@]+ would admit
// `;`, `|`, backticks and `$(...)` — i.e. command execution as the SSH user.
// RFC 5321 permits far more than this in a local-part; we would rather reject a
// legal-but-exotic address than interpolate a shell metacharacter.
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253 || !DOMAIN_RE.test(domain)) return false;
  return domain.split(".").every((label) => label.length >= 1);
}

export function isValidEmail(email: string): boolean {
  return !!email && email.length <= 254 && EMAIL_RE.test(email);
}
