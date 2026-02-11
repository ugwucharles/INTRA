import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Frontend config */
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore for development
  },
};

export default nextConfig;
