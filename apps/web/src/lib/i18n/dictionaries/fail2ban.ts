import type { LocaleDict } from "../types";

export const fail2ban: LocaleDict = {
  en: {
    "fail2ban.notInstalled": "fail2ban not installed",
    "fail2ban.notInstalledHint":
      "Install it from the Packages or Catalog tab to manage bans.",
    "fail2ban.jail": "Jail",
    "fail2ban.banned": "Banned",
    "fail2ban.noBanned": "No banned IPs.",
    "fail2ban.unban": "Unban",
    "fail2ban.confirmUnban": "Unban {ip}?",
    "fail2ban.unbanned": "IP unbanned",
    "fail2ban.unbanFailed": "Unban failed",
    "fail2ban.loadFailed": "Failed to load",
    "fail2ban.empty": "No jails.",
  },
  vi: {
    "fail2ban.notInstalled": "Chưa cài fail2ban",
    "fail2ban.notInstalledHint":
      "Cài đặt từ tab Gói phần mềm hoặc Kho ứng dụng để quản lý chặn IP.",
    "fail2ban.jail": "Jail",
    "fail2ban.banned": "Đã chặn",
    "fail2ban.noBanned": "Không có IP bị chặn.",
    "fail2ban.unban": "Bỏ chặn",
    "fail2ban.confirmUnban": "Bỏ chặn {ip}?",
    "fail2ban.unbanned": "Đã bỏ chặn IP",
    "fail2ban.unbanFailed": "Bỏ chặn thất bại",
    "fail2ban.loadFailed": "Tải thất bại",
    "fail2ban.empty": "Chưa có jail.",
  },
};
