"use client";

import { createContext, useContext, useEffect, useState } from "react";

import {
  DEFAULT_LOCALE,
  type Locale,
  LOCALES,
  messages,
} from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && LOCALES.includes(saved)) setLocaleState(saved);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("locale", next);
  };

  const t = (key: string) =>
    messages[locale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
