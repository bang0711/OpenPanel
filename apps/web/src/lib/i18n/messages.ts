import { catalog } from "./dictionaries/catalog";
import { common } from "./dictionaries/common";
import { cron } from "./dictionaries/cron";
import { docker } from "./dictionaries/docker";
import { fail2ban } from "./dictionaries/fail2ban";
import { files } from "./dictionaries/files";
import { firewall } from "./dictionaries/firewall";
import { logs } from "./dictionaries/logs";
import { metrics } from "./dictionaries/metrics";
import { packages } from "./dictionaries/packages";
import { ports } from "./dictionaries/ports";
import { power } from "./dictionaries/power";
import { servers } from "./dictionaries/servers";
import { services } from "./dictionaries/services";
import { sshKeys } from "./dictionaries/ssh-keys";
import { ssl } from "./dictionaries/ssl";
import { terminal } from "./dictionaries/terminal";
import { users } from "./dictionaries/users";
import { vhost } from "./dictionaries/vhost";
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
  ports,
  fail2ban,
  sshKeys,
  logs,
  power,
  users,
  ssl,
  docker,
  vhost,
);
