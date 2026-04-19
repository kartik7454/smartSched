import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: when Vercel Root Directory is `frontend`, include repo root for file tracing
  outputFileTracingRoot: path.join(process.cwd(), ".."),
};

export default nextConfig;
