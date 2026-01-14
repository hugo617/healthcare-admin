# 租户管理模块

## 概述

租户管理模块是 N-Admin 系统的核心功能之一，用于管理多租户 SaaS 应用中的租户账户。该模块提供了完整的租户生命周期管理功能，包括创建、编辑、删除、状态控制等。

## 功能特性

### ✅ 已实现功能

- **租户列表管理**

  - 分页展示租户列表
  - 支持关键词搜索（名称、代码）
  - 支持状态筛选
  - 支持多字段排序
  - 实时统计信息展示

- **租户 CRUD 操作**

  - 创建新租户
  - 编辑租户信息
  - 删除租户（软删除）
  - 租户详情查看

- **租户状态管理**

  - 三种状态：正常（active）、停用（inactive）、暂停（suspended）
  - 状态切换确认对话框
  - 状态变更审计日志

- **高级配置选项**

  - 最大用户数限制
  - 会话超时设置
  - 默认角色配置
  - 功能权限开关（自定义品牌、API访问）

- **安全与权限控制**
  - 基于角色的权限控制
  - 操作审计日志
  - 数据验证和错误处理
  - 默认租户保护

## 文件结构

```
src/app/dashboard/admin/tenant/
├── page.tsx                    # 主页面组件
├── loading.tsx                 # 加载状态组件
├── types.ts                   # TypeScript 类型定义
├── constants.ts               # 常量定义
├── README.md                  # 模块文档
├── hooks/                     # 自定义 Hooks
│   ├── index.ts
│   ├── useTenantFilters.ts    # 过滤器管理
│   └── useTenantManagement.ts # 租户管理逻辑
├── components/                # UI 组件
│   ├── index.ts
│   ├── TenantTable.tsx        # 租户表格
│   ├── TenantFilters.tsx      # 过滤器组件
│   ├── TenantForm.tsx         # 创建/编辑表单
│   ├── TenantPageHeader.tsx   # 页面头部
│   └── TenantDialogs.tsx      # 对话框组件
└── services/                  # API 服务
    └── tenantService.ts       # 租户 API 调用服务
```

## API 接口

### 租户列表

- **GET** `/api/tenants` - 获取租户列表（支持分页、搜索、筛选）

### 租户详情

- **GET** `/api/tenants/[id]` - 获取租户详情

### 租户管理

- **POST** `/api/tenants` - 创建新租户
- **PUT** `/api/tenants/[id]` - 更新租户信息
- **DELETE** `/api/tenants/[id]` - 删除租户
- **PATCH** `/api/tenants/[id]/status` - 更新租户状态

## 权限要求

租户管理功能需要以下权限：

- `admin.tenant.read` - 查看租户列表和详情
- `admin.tenant.create` - 创建新租户
- `admin.tenant.update` - 编辑租户信息
- `admin.tenant.delete` - 删除租户
- `admin.tenant.config` - 配置租户设置
- `admin.system.config` - 系统配置管理

## 使用示例

### 基本用法

```typescript
import TenantManagementPage from './page';

// 在路由中使用
export default function AdminTenantPage() {
  return <TenantManagementPage />;
}
```

### 自定义 Hooks 使用

```typescript
import { useTenantManagement, useTenantFilters } from './hooks';

// 在组件中使用
function MyComponent() {
  const { tenants, loading, fetchTenants, createTenant } =
    useTenantManagement();
  const { filters, searchFilters } = useTenantFilters();

  // 搜索租户
  const handleSearch = (keyword: string) => {
    searchFilters({ keyword });
  };

  // 创建租户
  const handleCreate = async (data: TenantFormData) => {
    const success = await createTenant(data);
    if (success) {
      // 刷新列表
      fetchTenants(filters);
    }
  };
}
```

### 服务调用

```typescript
import { tenantService } from './services/tenantService';

// 直接调用 API 服务
async function exampleUsage() {
  // 获取租户列表
  const tenants = await tenantService.getTenants({
    page: 1,
    pageSize: 20,
    keyword: 'test'
  });

  // 创建租户
  const newTenant = await tenantService.createTenant({
    name: '测试租户',
    code: 'test-tenant',
    status: 'active',
    settings: {
      maxUsers: 100,
      allowCustomBranding: true
    }
  });
}
```

## 数据模型

### Tenant 接口

```typescript
interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

interface TenantSettings {
  maxUsers?: number;
  allowCustomBranding?: boolean;
  enableAPIAccess?: boolean;
  defaultRole?: string;
  sessionTimeout?: number;
  [key: string]: any;
}
```

## 配置选项

### 默认租户设置

```typescript
const DEFAULT_TENANT_SETTINGS = {
  maxUsers: 100, // 最大用户数
  allowCustomBranding: true, // 允许自定义品牌
  enableAPIAccess: false, // 启用 API 访问
  defaultRole: 'user', // 默认角色
  sessionTimeout: 3600, // 会话超时（秒）
  features: {
    analytics: true,
    customDomain: false,
    sso: false,
    auditLog: true
  }
};
```

## 安全考虑

1. **权限控制**：所有操作都需要相应的权限验证
2. **数据验证**：严格的输入验证和类型检查
3. **审计日志**：记录所有关键操作的审计日志
4. **默认租户保护**：防止删除或修改默认租户
5. **软删除**：租户删除采用软删除方式，支持数据恢复

## 错误处理

模块提供了完善的错误处理机制：

- **验证错误**：表单验证失败时的友好提示
- **权限错误**：权限不足时的统一错误处理
- **网络错误**：API 调用失败的重试和降级机制
- **业务错误**：特定业务场景的错误处理

## 性能优化

1. **分页加载**：大数据量时的分页展示
2. **搜索防抖**：关键词搜索的防抖处理
3. **缓存策略**：租户数据的本地缓存
4. **懒加载**：组件和数据的按需加载

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 未来规划

- [ ] 租户数据统计和分析
- [ ] 批量操作功能
- [ ] 租户导入/导出
- [ ] 租户模板功能
- [ ] 高级搜索和筛选
- [ ] 租户性能监控
- [ ] 自动化租户配置

## 贡献指南

如需修改或扩展此模块，请遵循以下原则：

1. **保持一致性**：遵循现有的代码风格和架构模式
2. **类型安全**：确保所有 TypeScript 类型定义完整
3. **错误处理**：添加适当的错误处理和用户反馈
4. **测试覆盖**：为新功能添加相应的测试用例
5. **文档更新**：及时更新相关文档和注释

## 支持

如有问题或建议，请联系开发团队或提交 Issue。
