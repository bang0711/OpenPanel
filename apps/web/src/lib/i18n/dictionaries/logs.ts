import type { LocaleDict } from "../types";

export const logs: LocaleDict = {
  en: {
    "logs.source": "Source",
    "logs.lines": "Lines",
    "logs.unit": "Unit",
    "logs.unitPlaceholder": "e.g. nginx.service",
    "logs.refresh": "Refresh",
    "logs.empty": "No log output.",
    "logs.loadFailed": "Failed to load logs",

    "logs.src.syslog": "System log",
    "logs.src.auth": "Auth log",
    "logs.src.kernel": "Kernel (dmesg)",
    "logs.src.journal": "Journal",
    "logs.src.nginxAccess": "Nginx access",
    "logs.src.nginxError": "Nginx error",
    "logs.src.unit": "systemd unit",
  },
  vi: {
    "logs.source": "Nguồn",
    "logs.lines": "Số dòng",
    "logs.unit": "Dịch vụ",
    "logs.unitPlaceholder": "ví dụ: nginx.service",
    "logs.refresh": "Làm mới",
    "logs.empty": "Không có nhật ký.",
    "logs.loadFailed": "Tải nhật ký thất bại",

    "logs.src.syslog": "Nhật ký hệ thống",
    "logs.src.auth": "Nhật ký xác thực",
    "logs.src.kernel": "Nhân (dmesg)",
    "logs.src.journal": "Journal",
    "logs.src.nginxAccess": "Nginx truy cập",
    "logs.src.nginxError": "Nginx lỗi",
    "logs.src.unit": "Dịch vụ systemd",
  },
};
