// next.config.ts
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.20'],
  turbopack: {
    root: projectRoot,
  },
  // No cortes el build por errores de types
  typescript: { ignoreBuildErrors: true },
  images: {
    qualities: [72, 82, 92],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
