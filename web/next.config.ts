import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  // the app sits inside the engine repo, which has its own lockfile: pin the root to web/
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  // Modal's SDK speaks gRPC: load it from node_modules at runtime rather than bundling it
  serverExternalPackages: ['modal'],
};

export default nextConfig;
