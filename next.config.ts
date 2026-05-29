import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin file-tracing root to this project (avoids picking ~/package-lock.json
  // as root when multiple lockfiles exist on the machine).
  outputFileTracingRoot: path.resolve(),
};

export default nextConfig;
