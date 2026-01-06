# H5 登录问题解决方案

## 问题描述

H5 移动端应用（http://localhost:3005/login）无法登录，返回 401 错误。

## 问题原因

1. **Next.js 重写配置未生效**：H5 应用的 `next.config.js` 中配置了 API 代理重写规则，但需要重启应用才能生效
2. **配置错误**：`next.config.js` 中的 `generateEtags` 配置格式错误

## 解决方案

### 1. 修复 next.config.js

编辑 `/Users/star/hugo/project/n-admin/h5/next.config.js`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: '',
  trailingSlash: false,
  output: 'standalone',
  // 修复: generateEtags 应该是布尔值，不是对象
  generateEtags: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3003/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;
```

### 2. 重启 H5 应用

```bash
cd /Users/star/hugo/project/n-admin
./project-manager.sh restart h5
```

或者手动重启：

```bash
# 停止 H5 应用
cd /Users/star/hugo/project-n-admin/h5
pnpm dev
```

### 3. 验证修复

测试 API 代理是否正常工作：

```bash
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin@example.com","password":"Admin@123456"}'
```

应该返回成功的登录响应。

### 4. 测试浏览器登录

访问 http://localhost:3005/login，使用以下账号登录：

- **邮箱**：admin@example.com
- **密码**：Admin@123456

## 技术细节

### API 代理工作原理

H5 应用的 `next.config.js` 配置了重写规则：

```javascript
{
  source: '/api/:path*',
  destination: 'http://localhost:3003/api/:path*'
}
```

这会将所有 `/api/*` 请求代理到主应用（3003 端口），实现跨应用 API 调用。

### 前端 API 调用

H5 应用使用相对路径调用 API：

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ account, password }),
  credentials: 'include'
});
```

浏览器会自动将请求发送到当前域名（localhost:3005），然后由 Next.js 开发服务器根据重写规则代理到主应用。

## 常见问题排查

### 1. 检查 H5 应用是否运行

```bash
lsof -i :3005
```

### 2. 检查主应用是否运行

```bash
lsof -i :3003
```

### 3. 测试主应用 API

```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin@example.com","password":"Admin@123456"}'
```

### 4. 检查浏览器控制台

打开浏览器开发者工具（F12），查看：

- Network 标签页的请求详情
- Console 标签页的错误信息

### 5. 清除浏览器缓存

有时浏览器缓存会导致问题，尝试：

- 硬刷新：Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
- 清除浏览器缓存和 Cookies

## 相关文件

- H5 配置：`/Users/star/hugo/project/n-admin/h5/next.config.js`
- H5 登录页面：`/Users/star/hugo/project/n-admin/h5/src/app/login/page.tsx`
- H5 API 客户端：`/Users/star/hugo/project/n-admin/h5/src/lib/api.ts`
- 主应用登录 API：`/Users/star/hugo/project/n-admin/src/app/api/auth/login/route.ts`

## 总结

问题的根本原因是 Next.js 配置更改后没有重启应用，导致 API 代理重写规则未生效。修复配置错误并重启 H5 应用后，登录功能即可正常工作。
