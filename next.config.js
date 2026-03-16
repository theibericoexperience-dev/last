/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'auth.ibero.world',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'video.ibero.world',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-4595df28cecb404d939e877381aec4a0.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
