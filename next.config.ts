import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflarestorage.com',
      },
    ],
  },
  // Suppress warnings from framer-motion during build
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'framer-motion': 'framer-motion' }];
    return config;
  },
  experimental: {},
  // Silence Turbopack warning for custom webpack
  turbopack: {},
};

export default withPWA(nextConfig);
