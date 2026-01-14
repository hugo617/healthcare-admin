import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'development' ? false : true,
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },
  // 确保特定环境变量在 edge runtime (middleware) 中可用
  env: {
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
  }
};

export default nextConfig;
