import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  // the app sits inside the engine repo, which has its own lockfile: pin the root to web/
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
