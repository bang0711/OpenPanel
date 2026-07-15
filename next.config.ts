import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/server-only packages out of the bundle.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "ssh2",
  ],
};

export default nextConfig;
