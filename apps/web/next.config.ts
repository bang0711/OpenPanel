import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace package shipped as raw TS; Next must transpile it.
  transpilePackages: ["@openpanel/shared"],
};

export default nextConfig;
