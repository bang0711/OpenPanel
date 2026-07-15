export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

export type Dict = Record<string, string>;
export type LocaleDict = Record<Locale, Dict>;

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

export const DEFAULT_LOCALE: Locale = "en";
