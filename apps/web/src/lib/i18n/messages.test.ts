import { describe, expect, it } from "bun:test";

import { LOCALES, messages } from "./messages";

// The i18n rule is "add every key to every locale in the same change" — that is
// mechanical, so enforce it here instead of relying on review.
describe("locale parity", () => {
  const en = Object.keys(messages.en);

  it("ships every declared locale", () => {
    for (const locale of LOCALES) {
      expect(messages[locale]).toBeDefined();
    }
  });

  it("has no keys missing from a non-en locale", () => {
    for (const locale of LOCALES.filter((l) => l !== "en")) {
      const missing = en.filter((k) => !(k in messages[locale]));
      expect({ locale, missing }).toEqual({ locale, missing: [] });
    }
  });

  it("has no keys in a non-en locale that en lacks", () => {
    for (const locale of LOCALES.filter((l) => l !== "en")) {
      const extra = Object.keys(messages[locale]).filter(
        (k) => !(k in messages.en),
      );
      expect({ locale, extra }).toEqual({ locale, extra: [] });
    }
  });

  it("has no empty strings", () => {
    for (const locale of LOCALES) {
      const empty = Object.entries(messages[locale])
        .filter(([, v]) => !v.trim())
        .map(([k]) => k);
      expect({ locale, empty }).toEqual({ locale, empty: [] });
    }
  });

  // Interpolation is manual `.replace("{x}", …)`, so a placeholder that only
  // exists in one locale silently renders as literal "{n}" to those users.
  it("uses the same placeholders in every locale", () => {
    const placeholders = (s: string) =>
      (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort().join(",");

    for (const locale of LOCALES.filter((l) => l !== "en")) {
      const mismatched = en
        .filter((k) => k in messages[locale])
        .filter(
          (k) => placeholders(messages.en[k]) !== placeholders(messages[locale][k]),
        );
      expect({ locale, mismatched }).toEqual({ locale, mismatched: [] });
    }
  });
});
