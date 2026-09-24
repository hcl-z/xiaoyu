import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack anchored at the pnpm workspace root instead of an
  // unrelated lockfile in the parent directory.
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;
