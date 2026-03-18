/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '330864418503-cq8gpofrj2t07lq8ri8591id899ogs1a.apps.googleusercontent.com',
  },
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
