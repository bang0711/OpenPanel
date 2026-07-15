import type { LocaleDict } from "../types";

export const dbBackup: LocaleDict = {
  en: {
    "dbBackup.noEngines":
      "Neither mysqldump nor pg_dump is installed on this server.",
    "dbBackup.dir": "Backup directory",
    "dbBackup.engine": "Engine",
    "dbBackup.database": "Database",
    "dbBackup.dump": "Dump",
    "dbBackup.dumping": "Dumping…",
    "dbBackup.colFile": "File",
    "dbBackup.empty": "No dumps yet.",
    "dbBackup.done": "Dump complete",
    "dbBackup.failed": "Dump failed",
    "dbBackup.loadFailed": "Failed to load",
  },
  vi: {
    "dbBackup.noEngines":
      "Máy chủ này chưa cài mysqldump hoặc pg_dump.",
    "dbBackup.dir": "Thư mục sao lưu",
    "dbBackup.engine": "Công cụ",
    "dbBackup.database": "Cơ sở dữ liệu",
    "dbBackup.dump": "Sao lưu",
    "dbBackup.dumping": "Đang sao lưu…",
    "dbBackup.colFile": "Tệp",
    "dbBackup.empty": "Chưa có bản sao lưu.",
    "dbBackup.done": "Sao lưu hoàn tất",
    "dbBackup.failed": "Sao lưu thất bại",
    "dbBackup.loadFailed": "Tải thất bại",
  },
};
