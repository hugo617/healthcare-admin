# 组织架构模块前端实现计划

> 基于已完成的后端 API，实现组织架构管理的前端界面

## 📋 项目概述

**后端状态**: ✅ 已完成
**前端状态**: ❌ 待实现
**API 文档**: `docs/API接口文档-组织架构.md`

---

## 🎯 实现目标

实现完整的组织架构管理界面，包括：

1. 组织列表页面（支持树形展示和平铺列表）
2. 组织创建/编辑表单
3. 组织详情页面
4. 用户分配管理
5. 组织成员列表

---

## 📁 文件结构

```
src/app/dashboard/account/organization/
├── page.tsx                          # 组织列表主页面
├── [id]/
│   └── page.tsx                      # 组织详情页
├── components/
│   ├── OrganizationTree.tsx          # 组织树组件
│   ├── OrganizationList.tsx          # 组织列表组件
│   ├── OrganizationForm.tsx          # 组织表单组件
│   ├── OrganizationCard.tsx          # 组织卡片组件
│   ├── UserAssignModal.tsx           # 用户分配弹窗
│   └── UserList.tsx                  # 用户列表组件
├── hooks/
│   ├── useOrganizations.ts           # 组织数据 hook
│   └── useOrganizationTree.ts        # 组织树 hook
└── types.ts                          # 类型定义
```

---

## 🔧 技术栈

- **框架**: Next.js 15 App Router + React 19
- **UI 组件**: Shadcn UI (Radix UI + Tailwind CSS)
- **状态管理**: React Hooks (useState, useEffect, useContext)
- **数据获取**: Fetch API + SWR/React Query (可选)
- **表单**: React Hook Form + Zod
- **树形组件**: Radix UI Tree 或 @dnd-kit/sortable (拖拽)

---

## 📝 实施步骤

### 阶段一：基础页面和组件（1-2天）

#### 1.1 创建主页面和类型定义

**文件**: `src/app/dashboard/account/organization/page.tsx`

```typescript
// 功能需求：
// - 顶部搜索栏（按名称、编码搜索）
// - 切换视图（树形/列表）
// - 创建按钮
// - 组织列表/树形展示区域
```

**文件**: `src/app/dashboard/account/organization/types.ts`

```typescript
// 类型定义：
export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  code: string | null;
  path: string | null;
  parentId: string | null;
  leaderId: number | null;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  userCount: number | string;
  childCount?: number;
}

export interface OrganizationTreeNode extends Organization {
  children: OrganizationTreeNode[];
  leader?: {
    id: number;
    username: string;
    realName: string | null;
    email: string;
  };
}

export interface UserOrganization {
  id: number;
  username: string;
  realName: string | null;
  email: string;
  phone: string | null;
  avatar: string;
  status: string;
  position: string | null;
  isMain: boolean;
  joinedAt: string;
}
```

#### 1.2 创建数据获取 Hook

**文件**: `src/app/dashboard/account/organization/hooks/useOrganizations.ts`

```typescript
// 功能需求：
// - fetchOrganizations(params) - 获取组织列表
// - createOrganization(data) - 创建组织
// - updateOrganization(id, data) - 更新组织
// - deleteOrganization(id) - 删除组织
// - fetchOrganizationTree() - 获取组织树
// - fetchOrganizationUsers(id) - 获取组织用户
// - addUserToOrganization(orgId, data) - 添加用户
// - removeUserFromOrganization(orgId, userId) - 移除用户

// 参考 API 文档实现请求逻辑
```

### 阶段二：核心组件实现（2-3天）

#### 2.1 组织树组件

**文件**: `src/app/dashboard/account/organization/components/OrganizationTree.tsx`

```typescript
// 功能需求：
// - 树形结构展示
// - 可展开/折叠
// - 点击选中组织
// - 右键菜单（编辑、删除、添加子组织）
// - 拖拽排序（可选）
// - 显示负责人和成员数量

// 可用组件：
// - Radix UI Tree
// - 或使用递归 + shadcn/ui Collapsible
```

#### 2.2 组织列表组件

**文件**: `src/app/dashboard/account/organization/components/OrganizationList.tsx`

```typescript
// 功能需求：
// - 表格或卡片视图
// - 分页
// - 搜索/筛选
// - 操作按钮（编辑、删除、查看详情）
// - 显示层级关系（面包屑或缩进）
```

#### 2.3 组织表单组件

**文件**: `src/app/dashboard/account/organization/components/OrganizationForm.tsx`

```typescript
// 功能需求：
// - 创建/编辑模式切换
// - 表单字段：
//   - 组织名称（必填）
//   - 组织编码
//   - 父组织（下拉选择）
//   - 负责人（用户选择）
//   - 状态（开关）
//   - 排序值
// - 表单验证
// - 提交/取消按钮

// 技术选择：
// - React Hook Form + Zod
// - shadcn/ui Form 组件
```

#### 2.4 用户分配弹窗

**文件**: `src/app/dashboard/account/organization/components/UserAssignModal.tsx`

```typescript
// 功能需求：
// - 用户列表（支持搜索）
// - 多选用户
// - 设置职位
// - 设置是否主组织
// - 批量添加
// - 已有用户列表展示
// - 移除用户功能
```

### 阶段三：详情页面（1天）

#### 3.1 组织详情页

**文件**: `src/app/dashboard/account/organization/[id]/page.tsx`

```typescript
// 功能需求：
// - 面包屑导航
// - 组织基本信息卡片
// - 统计数据（成员数、子组织数）
// - Tab 切换：
//   - 成员列表
//   - 子组织列表
//   - 操作日志
// - 操作按钮（编辑、删除、添加成员）
```

### 阶段四：侧边栏集成（0.5天）

#### 4.1 更新侧边栏配置

**文件**: `src/components/layout/Sidebar.tsx` 或配置文件

```typescript
// 添加组织架构菜单项：
{
  title: '组织架构',
  href: '/dashboard/account/organization',
  icon: Organization,
  permission: 'organizations.view'
}
```

---

## 🎨 UI/UX 设计要点

### 设计风格

- 遵循项目现有的 Shadcn UI 设计风格
- 使用 Tailwind CSS 进行样式管理
- 响应式设计，支持移动端

### 交互细节

1. **树形视图**

   - 默认展开第一层
   - 点击箭头展开/折叠，点击文字选中
   - 选中状态高亮

2. **列表视图**

   - 支持按名称、编码搜索
   - 支持按状态筛选
   - 分页加载

3. **表单交互**

   - 实时验证
   - 提交时 loading 状态
   - 错误提示

4. **删除确认**
   - 二次确认弹窗
   - 显示删除影响（成员数、子组织数）

---

## 🔄 数据流

### 获取组织列表

```
page.tsx → useOrganizations → fetch('/api/organizations') → 更新 state → 渲染列表
```

### 创建组织

```
OrganizationForm → onSubmit → useOrganizations.createOrganization
→ fetch('/api/organizations', POST) → 刷新列表 → 关闭弹窗
```

### 更新组织

```
OrganizationForm → onSubmit → useOrganizations.updateOrganization
→ fetch('/api/organizations/{id}', PUT) → 刷新列表 → 关闭弹窗
```

### 删除组织

```
确认弹窗 → useOrganizations.deleteOrganization
→ fetch('/api/organizations/{id}', DELETE) → 刷新列表
```

---

## 📦 可复用的 Shadcn UI 组件

项目中已有的组件（位于 `src/components/ui/`）：

- Button
- Input
- Label
- Select
- Dialog
- Table
- Card
- Badge
- Separator
- Toast
- Form
- Switch

**可能需要新增的组件**：

- Tree (组织树)
- Breadcrumb (面包屑导航)
- Popover (右键菜单)

---

## 🧪 测试要点

### 功能测试

- [ ] 创建顶级组织
- [ ] 创建子组织
- [ ] 编辑组织信息
- [ ] 删除组织（空）
- [ ] 删除组织（有子组织，应被阻止）
- [ ] 删除组织（有成员，应被阻止）
- [ ] 添加用户到组织
- [ ] 移除组织成员
- [ ] 设置主组织
- [ ] 搜索组织
- [ ] 树形视图切换

### 边界测试

- [ ] 组织名称重复验证
- [ ] 循环引用检测
- [ ] 删除保护逻辑
- [ ] 分页边界

---

## 🚀 后续优化建议

1. **拖拽排序**: 使用 @dnd-kit/core 实现拖拽调整组织层级
2. **批量操作**: 批量删除、批量移动
3. **导入导出**: Excel 导入/导出组织结构
4. **组织权限**: 基于组织的数据权限配置
5. **成员统计**: 成员增长趋势图表

---

## 📚 参考文档

- **API 文档**: `docs/API接口文档-组织架构.md`
- **数据库 Schema**: `src/db/schema.ts` (organizations 表)
- **类似实现**: `src/app/dashboard/account/user/page.tsx` (用户管理)

---

## 🤝 给下一个代理的开发提示

1. **优先级**: 先实现列表和表单，再实现树形视图
2. **状态管理**: 简单场景用 useState，复杂场景考虑 Zustand
3. **错误处理**: 统一使用 Toast 提示
4. **权限控制**: 参考 `src/lib/permissions.ts` 实现
5. **代码风格**: 遵循项目现有代码规范

---

_文档创建时间: 2026-01-01_
_后端 API 版本: v1.0.0_
