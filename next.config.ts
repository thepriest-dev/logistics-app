// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove the eslint option - it's no longer supported in next.config
  images: {
    unoptimized: true,
  },
  transpilePackages: ['lucide-react'],
};

export default nextConfig;