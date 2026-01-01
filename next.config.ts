import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'development' ? false : true,
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  }
};

export default nextConfig;
