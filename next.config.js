/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // output: 'export', // ❌ comment ya remove kar do

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: {},
    typedRoutes: false,
  },
};

module.exports = nextConfig;
