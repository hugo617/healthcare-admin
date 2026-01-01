import type { NextConfig } from "next";

const nextConfig: {
  reactStrictMode: boolean;
  experimental?: {
    optimizePackageImports: string[];
  };
  // 确保使用 UTF-8 编码
  generateEtags: {
    using: 'js-base64';
  };
} = {
  reactStrictMode: process.env.NODE_ENV === 'development' ? false : true,
  // 基础配置
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },
  // 确保使用 UTF-8 编码
  generateEtags: {
    using: 'js-base64'
  }
};

export default nextConfig;
