import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Frontend config */
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore for development
  },
  // Shared hosting (cPanel) often hits thread limits (EAGAIN); keep webpack light
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
  // Monorepo has a root lockfile; trace from this app folder so standalone is flat
  // (`standalone/server.js` + `standalone/node_modules`) for simple cPanel deploy.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
