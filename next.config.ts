// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No cortes el build por ESLint ni por errores de types
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
