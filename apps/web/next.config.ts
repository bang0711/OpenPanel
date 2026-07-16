import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Workspace package shipped as raw TS; Next must transpile it.
  transpilePackages: ["@openpanel/shared"],
  // Emit a self-contained server with only the traced node_modules, so the
  // runtime image doesn't ship the source tree or dev dependencies.
  output: "standalone",
  // Trace from the repo root: this is a Bun workspace, so hoisted deps and
  // @openpanel/shared live above apps/web.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
};

export default nextConfig;
