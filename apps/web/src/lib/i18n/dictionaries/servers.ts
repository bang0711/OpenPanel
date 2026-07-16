import type { LocaleDict } from "../types";

export const servers: LocaleDict = {
  en: {
    "servers.newServer": "New server",
    "servers.encryptedNote": "Credentials are encrypted at rest before storage.",
    "servers.host": "Host",
    "servers.port": "Port",
    "servers.username": "Username",
    "servers.tags": "Tags (optional)",
    "servers.tagsPlaceholder": "prod, web, eu-west (comma-separated)",
    "servers.authentication": "Authentication",
    "servers.password": "Password",
    "servers.passphraseOptional": "Passphrase (optional)",
    "servers.privateKey": "Private key",
    "servers.saveServer": "Save server",
    "servers.added": "Server added",
    "servers.addFailed": "Failed to add server",
    "servers.uploadFile": "Upload file",
    "servers.keyPlaceholder": "-----BEGIN OPENSSH PRIVATE KEY----- (paste or upload)",
    "servers.verified": "verified",
    "servers.untested": "untested",
    "servers.verifiedHint":
      "Host key pinned. Connections are rejected if this host ever presents a different key.",
    "servers.untestedHint":
      "No host key pinned yet — this host's identity is not verified on connect. Run “Test connection” to pin it.",
    "servers.title": "Servers",
    "servers.subtitle": "Manage your registered remote hosts.",
    "servers.emptyTitle": "No servers yet",
    "servers.emptyDescription":
      "Register a remote Linux host to manage it over SSH.",
  },
  vi: {
    "servers.newServer": "Máy chủ mới",
    "servers.encryptedNote": "Thông tin đăng nhập được mã hóa khi lưu trữ.",
    "servers.host": "Máy chủ",
    "servers.port": "Cổng",
    "servers.username": "Tên đăng nhập",
    "servers.tags": "Thẻ (tùy chọn)",
    "servers.tagsPlaceholder": "prod, web, eu-west (phân tách bằng dấu phẩy)",
    "servers.authentication": "Phương thức xác thực",
    "servers.password": "Mật khẩu",
    "servers.passphraseOptional": "Cụm mật khẩu (tùy chọn)",
    "servers.privateKey": "Khóa riêng tư",
    "servers.saveServer": "Lưu máy chủ",
    "servers.added": "Đã thêm máy chủ",
    "servers.addFailed": "Không thể thêm máy chủ",
    "servers.uploadFile": "Tải tệp lên",
    "servers.keyPlaceholder": "-----BEGIN OPENSSH PRIVATE KEY----- (dán hoặc tải lên)",
    "servers.verified": "đã xác minh",
    "servers.untested": "chưa kiểm tra",
    "servers.verifiedHint":
      "Đã ghim khóa máy chủ. Kết nối sẽ bị từ chối nếu máy chủ này đưa ra khóa khác.",
    "servers.untestedHint":
      "Chưa ghim khóa máy chủ — danh tính máy chủ không được xác minh khi kết nối. Chạy “Kiểm tra kết nối” để ghim.",
    "servers.title": "Máy chủ",
    "servers.subtitle": "Quản lý các máy chủ từ xa đã đăng ký.",
    "servers.emptyTitle": "Chưa có máy chủ",
    "servers.emptyDescription":
      "Đăng ký một máy chủ Linux từ xa để quản lý qua SSH.",
  },
};
