// next.config.mjs
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

if (process.env.NODE_ENV === 'development') {
  // Soporte dev para Cloudflare
  await setupDevPlatform();
}

export default nextConfig;
