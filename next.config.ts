// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No cortes el build por ESLint ni por errores de types
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
