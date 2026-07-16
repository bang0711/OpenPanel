import type { LocaleDict } from "../types";

export const query: LocaleDict = {
  en: {
    "query.noEngines": "No MySQL or PostgreSQL client detected.",
    "query.engine": "Engine",
    "query.database": "Database",
    "query.databasePlaceholder": "optional",
    "query.sql": "SQL",
    "query.sqlPlaceholder": "SELECT * FROM users LIMIT 10;",
    "query.run": "Run",
    "query.running": "Running…",
    "query.rows": "{count} row(s)",
    "query.truncated":
      "Output was capped at 5 MB — later rows were discarded. Add a LIMIT to see the rest.",
    "query.empty": "No rows returned.",
    "query.failed": "Query failed",
    "query.loadFailed": "Failed to detect database engines",
  },
  vi: {
    "query.noEngines": "Không phát hiện client MySQL hoặc PostgreSQL.",
    "query.engine": "Công cụ",
    "query.database": "Cơ sở dữ liệu",
    "query.databasePlaceholder": "tùy chọn",
    "query.sql": "SQL",
    "query.sqlPlaceholder": "SELECT * FROM users LIMIT 10;",
    "query.run": "Chạy",
    "query.running": "Đang chạy…",
    "query.rows": "{count} dòng",
    "query.truncated":
      "Kết quả bị giới hạn ở 5 MB — các dòng sau đã bị bỏ. Thêm LIMIT để xem phần còn lại.",
    "query.empty": "Không có dòng nào được trả về.",
    "query.failed": "Truy vấn thất bại",
    "query.loadFailed": "Không phát hiện được công cụ cơ sở dữ liệu",
  },
};
