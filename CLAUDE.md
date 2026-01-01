# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

N-Admin 是一个现代化的多租户后台管理系统，基于 Next.js 15、React 19、TypeScript 和 PostgreSQL 构建。系统具备完整的 RBAC（基于角色的访问控制）、JWT 认证以及移动端 H5 应用。

**技术栈**: Next.js 15 (App Router) | React 19 | TypeScript 5 | Tailwind CSS 4 | Shadcn UI | Drizzle ORM | PostgreSQL

## 开发命令

```bash
# 核心开发命令
pnpm dev          # 启动开发服务器，端口 3003（使用 Turbopack）
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 运行 ESLint 代码检查
pnpm format       # 使用 Prettier 格式化代码

# 数据库操作
pnpm db:generate  # 使用 Drizzle Kit 生成迁移文件
pnpm db:push      # 推送数据库结构变更
pnpm db:studio    # 打开 Drizzle Studio 数据库管理界面
pnpm init:admin   # 初始化管理员账号（运行 scripts/init-admin.ts）

# 版本控制
pnpm commit       # 使用 Commitizen 提交（遵循约定式提交规范）
pnpm release      # 使用 standard-version 创建发布版本
pnpm release:minor / release:major / release:patch  # 版本号升级

# 项目管理（替代直接命令）
./project-manager.sh start|stop|status|restart  # 管理主应用 + H5 应用
```

**默认管理员账号**: `admin@example.com` / `Admin@123456`

## 架构设计

### 多租户与数据隔离

系统采用租户级别的数据隔离。每个租户拥有独立的用户、角色、权限和组织架构。核心模式：

- **租户感知表**: 大部分表包含 `tenantId` 字段，默认值为 `1`（默认租户）
- **组合唯一约束**: 唯一性在租户范围内生效（例如 `users_tenant_email_unique`）
- **租户中间件**: `src/middleware.ts` 强制执行租户隔离
- **超级管理员绕过**: `isSuperAdmin` 标志允许跨租户访问

### 认证与授权

- **JWT 方案**: 自定义 JWT 实现（非 NextAuth），见 `src/lib/auth.ts`
- **认证流程**:
  1. 通过 `/api/auth/login` 登录，返回 JWT token
  2. Token 存储在 cookies 中（客户端），服务端验证
  3. `src/lib/auth.ts` 中的 `auth()` 辅助函数从 token 获取当前用户
  4. 中间件通过验证 token 有效性来保护路由
- **RBAC 系统**:
  - 用户拥有角色 (`users.roleId`)
  - 角色通过 `rolePermissions` 关联表拥有权限
  - 权限类型包括: `menu`、`page`、`button`、`api`、`data`
  - 服务端: API 路由在操作前检查权限
  - 客户端: 组件根据用户权限条件渲染

### 数据库架构

**核心表**（全部在 `src/db/schema.ts`）:

- `tenants` - 多租户根表
- `users` - 用户账号，带租户隔离
- `roles` - 层级角色（通过 parent_id 嵌套）
- `permissions` - 细粒度权限，支持层级结构
- `role_permissions` - 多对多关联表
- `organizations` - 组织架构层级
- `user_organizations` - 用户-组织关系
- `user_sessions` - 会话管理，支持设备追踪
- `system_logs` - 审计日志，记录变更（oldValues, newValues）
- `service_archives` - 客户服务档案（使用 JSONB 存储灵活数据）

**关键模式**:

- 软删除: `isDeleted` + `deletedAt` 字段
- 审计追踪: `createdBy`、`updatedBy`、`createdAt`、`updatedAt`
- JSONB 列: `metadata`、`settings`、`details` 用于灵活的半结构化数据
- Drizzle 关系: 在 schema.ts 底部定义，用于类型安全查询

### App Router 结构

```
src/app/
├── api/              # API 路由（RESTful）
│   ├── auth/        # 认证接口
│   ├── users/       # 用户 CRUD
│   ├── roles/       # 角色管理
│   ├── permissions/ # 权限管理
│   └── ...
├── dashboard/        # 受保护的管理页面
│   ├── [feature]/   # 功能模块（users、roles、permissions 等）
│   │   ├── page.tsx           # 列表页
│   │   ├── [id]/page.tsx      # 详情/编辑页
│   │   ├── components/        # 模块专属组件
│   │   ├── hooks/            # 模块专属 hooks
│   │   ├── types.ts          # TypeScript 类型定义
│   │   └── constants.ts      # 常量配置
│   └── layout.tsx    # Dashboard 布局，包含侧边栏
├── login/           # 登录页
└── layout.tsx       # 根布局
```

**功能模块模式**: 每个 dashboard 功能都是自包含的，拥有自己的组件、hooks、类型和常量。

### 组件架构

- **UI 组件**: `src/components/ui/` - Shadcn UI 基础组件（Radix primitives + Tailwind）
- **布局组件**: `src/components/layout/` - 应用外壳（Sidebar、Header 等）
- **功能组件**: 与功能同目录，位于 `src/app/dashboard/[feature]/components/`
- **服务端与客户端**: 布局默认使用服务端组件；交互功能使用 `'use client'`

### 状态管理

- **服务端状态**: React Server Components 直接获取数据
- **客户端状态**:
  - `next-auth/react` SessionProvider（虽然使用自定义 JWT）
  - `next-themes` ThemeProvider 用于暗色模式
  - Zustand 已安装，但各功能使用情况不一
  - Nuqs 用于 URL 状态管理（将查询参数作为状态）

### API 模式

**标准响应格式** (`src/service/response.ts`):

```typescript
{
  success: boolean,
  data: T | null,
  message: string,
  error?: string
}
```

**API 路由中的权限检查**:

```typescript
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

const user = await auth();
if (!user || !hasPermission(user, 'some.permission.code')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## 关键文件及其用途

- `src/db/schema.ts` - 完整的数据库 schema（Drizzle ORM）
- `src/db/index.ts` - 数据库连接和客户端导出
- `src/lib/auth.ts` - JWT 验证和 `auth()` 辅助函数
- `src/middleware.ts` - 路由保护和租户强制
- `src/service/response.ts` - 标准化 API 响应格式
- `src/components/ui/` - Shadcn UI 组件（通过 CLI 自动生成）
- `drizzle.config.ts` - Drizzle ORM 配置
- `scripts/init-admin.ts` - 管理员初始化脚本

## 数据库迁移

修改 `src/db/schema.ts` 后:

1. 运行 `pnpm db:generate` 在 `drizzle/` 中生成迁移 SQL
2. 检查生成的 SQL
3. 运行 `pnpm db:push` 应用到数据库
4. 使用 `pnpm db:studio` 可视化检查变更

## UTF-8 / 中文支持

所有开发命令都包含 `cross-env LANG=zh_CN.UTF-8 LC_ALL=zh_CN.UTF-8`，确保输出正确处理中文字符。

## 移动端伴侣应用 (H5)

`h5/` 目录包含独立的 Next.js 移动端应用，运行在 3005 端口。它共享部分代码，但有独立的 package.json，可通过 `./project-manager.sh` 管理。

## 权限系统详解

权限有 5 种类型：

- `menu` - 导航菜单可见性
- `page` - 页面访问控制
- `button` - 按钮/操作可见性（例如"删除用户"按钮）
- `api` - API 接口保护
- `data` - 行级安全（通过 `data_permission_rules` 表）

数据权限支持规则: `all`（全部）、`org`（组织）、`dept`（部门）、`self`（本人）、`custom`（自定义），用于细粒度的数据访问控制。

## 添加新功能

1. **创建功能模块** - 在 `src/app/dashboard/[feature-name]/` 下
2. **添加 API 路由** - 在 `src/app/api/[feature-name]/` 下
3. **更新权限** - 在数据库中添加到 `permissions` 表
4. **创建 UI 组件** - 遵循 Shadcn 模式
5. **添加导航** - 在侧边栏配置中
6. **测试不同角色** - 确保权限检查生效

## API 测试

使用登录返回的管理员 JWT token 测试受保护接口：

```bash
TOKEN="<your-jwt-token>"
curl -X GET "http://localhost:3003/api/users" -H "Authorization: Bearer $TOKEN"
```
