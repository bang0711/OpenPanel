import { catalog } from "./dictionaries/catalog";
import { common } from "./dictionaries/common";
import { cron } from "./dictionaries/cron";
import { files } from "./dictionaries/files";
import { firewall } from "./dictionaries/firewall";
import { metrics } from "./dictionaries/metrics";
import { packages } from "./dictionaries/packages";
import { servers } from "./dictionaries/servers";
import { services } from "./dictionaries/services";
import { terminal } from "./dictionaries/terminal";
import {
  DEFAULT_LOCALE,
  type Dict,
  type Locale,
  LOCALE_NAMES,
  type LocaleDict,
  LOCALES,
} from "./types";

export { DEFAULT_LOCALE, LOCALE_NAMES, LOCALES };
export type { Locale };

function merge(...dicts: LocaleDict[]): Record<Locale, Dict> {
  const out = { en: {}, vi: {} } as Record<Locale, Dict>;
  for (const d of dicts) {
    for (const locale of LOCALES) Object.assign(out[locale], d[locale]);
  }
  return out;
}

export const messages = merge(
  common,
  servers,
  metrics,
  services,
  files,
  packages,
  catalog,
  cron,
  firewall,
  terminal,
);
