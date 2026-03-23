import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Frontend config */
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore for development
  },
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
