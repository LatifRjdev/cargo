/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cargo/shared', '@cargo/i18n'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/cargo/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
module.exports = nextConfig;
