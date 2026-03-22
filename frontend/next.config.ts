import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Frontend config */
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore for development
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
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
};

export default nextConfig;
