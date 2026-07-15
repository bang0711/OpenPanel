// Each dot-separated label must be alphanumeric/hyphen; full string re-checked.
export const DOMAIN_RE = /^[a-zA-Z0-9.-]+$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253 || !DOMAIN_RE.test(domain)) return false;
  return domain.split(".").every((label) => label.length >= 1);
}

export function isValidEmail(email: string): boolean {
  return !!email && email.length <= 254 && EMAIL_RE.test(email);
}
