import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.sui-rpc\..*\/$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'sui-rpc-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
  ],
});

export default withPWAConfig(nextConfig);
