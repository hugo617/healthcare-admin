/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: '',
  trailingSlash: false,
  output: 'standalone',
  // 确保使用 UTF-8 编码
  generateEtags: {
    using: 'js-base64'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3003/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig