# 用户管理 API 接口文档

## 概述

N-Admin 用户管理模块提供完整的 RESTful API 接口，用于用户账号的增删改查、批量操作、会话管理等。所有接口遵循统一的响应格式，支持多租户隔离、细粒度权限控制和完整的审计日志。

**基础路径**: `/api/users`

**认证方式**: JWT Bearer Token（存储在 Cookie 中）

## 统一响应格式

### 成功响应

```typescript
{
  success: true,
  data: T | null,
  message?: string,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### 错误响应

```typescript
{
  success: false,
  error: string,
  message?: string
}
```

## API 路由结构

```mermaid
graph TD
    A[/api/users] --> B[GET 用户列表]
    A --> C[POST 创建用户]

    D[/api/users/:id] --> E[PUT 更新用户]
    D --> F[DELETE 删除用户]

    G[/api/users/statistics] --> H[GET 用户统计]

    I[/api/users/search] --> J[GET 用户搜索]

    K[/api/users/:id/reset-password] --> L[POST 重置密码]

    M[/api/users/batch] --> N[POST 批量操作]

    O[/api/users/:id/organizations] --> P[GET 获取组织]
    O --> Q[PUT 设置组织]

    R[/api/users/:id/sessions] --> S[GET 获取会话]
    R --> T[DELETE 终止会话]

    U[/api/users/:id/status] --> V[PUT 更新状态]

    style A fill:#e1f5ff
    style D fill:#e1f5ff
    style G fill:#fff4e6
    style I fill:#fff4e6
    style K fill:#fff4e6
    style M fill:#ffe6e6
    style O fill:#e6f7ff
    style R fill:#e6f7ff
    style U fill:#e6f7ff
```

---

## 1. 用户列表查询

**接口**: `GET /api/users`

**文件路径**: `src/app/api/users/route.ts`

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| search | string | 否 | - | 搜索关键词（用户名/邮箱/姓名/手机号） |
| status | string | 否 | all | 状态筛选：all/active/inactive/locked |
| sortBy | string | 否 | createdAt | 排序字段：username/email/createdAt/lastLoginAt |
| sortOrder | string | 否 | desc | 排序方向：asc/desc |

### 请求示例

```bash
GET /api/users?page=1&limit=10&status=active&sortBy=createdAt&sortOrder=desc
```

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "phone": "13800138000",
      "username": "admin",
      "realName": "系统管理员",
      "roleId": 1,
      "tenantId": 1,
      "avatar": "/avatars/admin.jpg",
      "status": "active",
      "isSuperAdmin": true,
      "lastLoginAt": "2025-12-21T12:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-21T12:00:00.000Z",
      "metadata": {},
      "role": {
        "id": 1,
        "name": "超级管理员",
        "code": "super_admin"
      },
      "organizations": [
        {
          "id": 1,
          "position": "管理员",
          "isMain": true,
          "organization": {
            "id": 1,
            "name": "默认组织",
            "code": "default_org"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 业务逻辑

1. **租户隔离**: 非超级管理员只能查看自己租户的用户
2. **软删除过滤**: 自动过滤 `isDeleted = true` 的用户
3. **搜索逻辑**: 使用 ILIKE 进行模糊匹配，支持多个字段
4. **排序支持**: 支持多字段排序，默认按创建时间倒序

### 代码示例

```typescript
// 构建查询条件
const conditions = [eq(users.isDeleted, false)];

// 添加搜索条件
if (search) {
  conditions.push(
    sql`(${users.username} ILIKE ${'%' + search + '%'} OR
         ${users.email} ILIKE ${'%' + search + '%'} OR
         ${users.realName} ILIKE ${'%' + search + '%'} OR
         ${users.phone} ILIKE ${'%' + search + '%'})`
  );
}

// 添加状态筛选
if (status && status !== 'all') {
  conditions.push(eq(users.status, status));
}

// 查询数据
const userList = await db
  .select({
    // ... 字段选择
  })
  .from(users)
  .leftJoin(roles, eq(users.roleId, roles.id))
  .where(and(...conditions))
  .limit(limit)
  .offset((page - 1) * limit)
  .orderBy(orderByClause);
```

---

## 2. 创建用户

**接口**: `POST /api/users`

**文件路径**: `src/app/api/users/route.ts`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-50字符，字母数字下划线连字符 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，至少6位 |
| phone | string | 否 | 手机号 |
| realName | string | 否 | 真实姓名 |
| roleId | number | 是 | 角色ID |
| tenantId | number | 否 | 租户ID（仅超级管理员可指定） |
| organizationIds | number[] | 否 | 组织ID列表 |
| status | string | 否 | 状态：active/inactive/locked，默认active |
| metadata | object | 否 | 扩展数据 |
| sendWelcomeEmail | boolean | 否 | 是否发送欢迎邮件 |

### 请求示例

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "phone": "13800138000",
  "realName": "新用户",
  "roleId": 2,
  "organizationIds": [1, 2],
  "status": "active",
  "sendWelcomeEmail": true
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 10,
    "username": "newuser",
    "email": "newuser@example.com"
  },
  "message": "用户创建成功"
}
```

### 业务逻辑

1. **唯一性验证**: 检查用户名和邮箱在同一租户内的唯一性
2. **密码加密**: 使用 bcrypt 加密，默认 12 轮盐值
3. **事务处理**: 创建用户和组织关联在同一事务中完成
4. **审计日志**: 记录创建操作的所有详细信息

### 代码示例

```typescript
// 密码加密
const saltRounds = Number(process.env.SALT_ROUNDS || 12);
const hashedPassword = await bcrypt.hash(password, saltRounds);

// 事务处理
await db.transaction(async (tx) => {
  // 创建用户
  const newUser = await tx.insert(users).values({
    username,
    email,
    password: hashedPassword,
    // ... 其他字段
  }).returning();

  // 创建组织关联
  if (organizationIds && organizationIds.length > 0) {
    await tx.insert(userOrganizations).values(
      organizationIds.map((orgId, index) => ({
        userId: newUser[0].id,
        organizationId: BigInt(orgId),
        isMain: index === 0
      }))
    );
  }
});
```

---

## 3. 更新用户

**接口**: `PUT /api/users/:id`

**文件路径**: `src/app/api/users/[id]/route.ts`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 用户名 |
| email | string | 否 | 邮箱地址 |
| phone | string | 否 | 手机号 |
| realName | string | 否 | 真实姓名 |
| roleId | number | 否 | 角色ID |
| status | string | 否 | 状态 |
| metadata | object | 否 | 扩展数据 |
| organizationIds | number[] | 否 | 组织ID列表 |

### 请求示例

```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "phone": "13900139000",
  "realName": "更新用户",
  "roleId": 3,
  "status": "active",
  "organizationIds": [2, 3]
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "message": "用户更新成功"
  }
}
```

### 业务逻辑

1. **超级管理员保护**: 禁止修改超级管理员的基本信息
2. **状态保护**: 单独验证状态变更，防止禁用超级管理员
3. **变更追踪**: 记录所有字段的变更前后值
4. **事务更新**: 用户信息更新和组织关联更新在同一事务中

### 变更追踪日志

```json
{
  "level": "info",
  "action": "更新用户",
  "module": "用户管理",
  "message": "用户信息更新成功",
  "details": {
    "targetUserId": 10,
    "targetUsername": "newuser",
    "changedFields": {
      "username": {
        "from": "olduser",
        "to": "newuser"
      },
      "email": {
        "from": "old@example.com",
        "to": "new@example.com"
      },
      "roleId": {
        "from": 2,
        "to": 3
      }
    },
    "operatorId": 1,
    "operatorName": "admin",
    "timestamp": "2025-12-21T12:00:00.000Z"
  }
}
```

---

## 4. 删除用户

**接口**: `DELETE /api/users/:id`

**文件路径**: `src/app/api/users/[id]/route.ts`

### 请求参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 用户ID（路径参数） |

### 响应示例

```json
{
  "success": true,
  "data": {
    "message": "用户删除成功"
  }
}
```

### 业务逻辑

1. **软删除**: 设置 `isDeleted = true` 和 `deletedAt` 时间戳
2. **超级管理员保护**: 禁止删除超级管理员账号
3. **审计日志**: 记录删除操作和操作者信息

### 代码示例

```typescript
await db
  .update(users)
  .set({
    isDeleted: true,
    deletedAt: new Date(),
    updatedBy: currentUser?.id
  })
  .where(eq(users.id, id));
```

---

## 5. 用户统计

**接口**: `GET /api/users/statistics`

**文件路径**: `src/app/api/users/statistics/route.ts`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tenantId | number | 否 | 租户ID（仅超级管理员可跨租户查询） |

### 响应示例

```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 150,
      "active": 120,
      "inactive": 25,
      "locked": 5,
      "activeRate": 80.0
    },
    "engagement": {
      "recentLogins": 100,
      "recentLoginRate": 66.67
    },
    "growth": {
      "thisMonth": 20,
      "lastMonth": 15,
      "growthRate": 33.33,
      "today": 2,
      "week": 5
    },
    "distribution": {
      "active": 120,
      "inactive": 25,
      "locked": 5
    }
  }
}
```

### 统计指标说明

| 指标 | 说明 |
|------|------|
| total | 总用户数 |
| active | 活跃用户数（status = active） |
| inactive | 非活跃用户数（status = inactive） |
| locked | 锁定用户数（status = locked） |
| activeRate | 活跃率 = active / total * 100 |
| recentLogins | 近30天登录用户数 |
| recentLoginRate | 近30天登录率 |
| thisMonth | 本月新用户数 |
| lastMonth | 上月新用户数 |
| growthRate | 月增长率 = (thisMonth - lastMonth) / lastMonth * 100 |
| today | 今日新用户数 |
| week | 本周新用户数（本周一起至今） |

---

## 6. 用户搜索

**接口**: `GET /api/users/search`

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| query | string | 是 | - | 搜索关键词 |
| limit | number | 否 | 10 | 结果数量限制（1-100） |
| tenantId | number | 否 | - | 租户ID（仅超级管理员） |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "realName": "系统管理员",
      "avatar": "/avatars/admin.jpg"
    }
  ]
}
```

### 业务逻辑

1. **实时搜索**: 支持用户名、邮箱、真实姓名搜索
2. **结果限制**: 默认返回10条，最多100条
3. **排序优化**: 按匹配度和活跃度排序

---

## 7. 重置密码

**接口**: `POST /api/users/:id/reset-password`

**文件路径**: `src/app/api/users/[id]/reset-password/route.ts`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newPassword | string | 是 | 新密码，至少6位 |
| sendEmail | boolean | 否 | 是否发送重置邮件，默认false |

### 请求示例

```json
{
  "newPassword": "newPassword123",
  "sendEmail": true
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "message": "密码重置成功",
    "userId": 10
  }
}
```

### 业务逻辑

1. **超级管理员保护**: 禁止重置超级管理员密码
2. **密码加密**: 使用 bcrypt 重新加密新密码
3. **会话清除**: 清除该用户的所有活跃会话（TODO）
4. **邮件通知**: 支持发送密码重置邮件（TODO）

---

## 8. 批量操作

**接口**: `POST /api/users/batch`

**文件路径**: `src/app/api/users/batch/route.ts`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| operation | string | 是 | 操作类型 |
| userIds | number[] | 是 | 用户ID数组 |
| data | object | 否 | 操作数据（如roleId） |

### 支持的操作类型

| operation | 说明 | data字段 |
|-----------|------|----------|
| activate | 批量激活用户 | - |
| deactivate | 批量禁用用户 | - |
| delete | 批量删除用户（软删除） | - |
| assignRole | 批量分配角色 | { roleId: number } |
| removeRole | 批量移除角色 | - |

### 请求示例

```json
{
  "operation": "activate",
  "userIds": [1, 2, 3, 4, 5]
}
```

```json
{
  "operation": "assignRole",
  "userIds": [1, 2, 3],
  "data": {
    "roleId": 5
  }
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "message": "activate操作完成",
    "result": {
      "updated": 5,
      "failed": 0
    }
  }
}
```

### 业务逻辑

1. **事务处理**: 所有批量操作在单个事务中完成
2. **超级管理员检查**: 禁止对超级管理员执行禁用/删除操作
3. **详细日志**: 记录批量操作的所有详细信息

---

## 9. 用户组织管理

### 9.1 获取用户组织

**接口**: `GET /api/users/:id/organizations`

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "organizationId": 1,
      "position": "管理员",
      "isMain": true,
      "joinedAt": "2025-01-01T00:00:00.000Z",
      "organization": {
        "id": 1,
        "name": "默认组织",
        "code": "default_org",
        "description": "系统默认组织"
      }
    }
  ]
}
```

### 9.2 设置用户组织

**接口**: `PUT /api/users/:id/organizations`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| organizationIds | number[] | 是 | 组织ID数组 |
| mainOrganizationId | number | 否 | 主组织ID |

### 请求示例

```json
{
  "organizationIds": [1, 2, 3],
  "mainOrganizationId": 1
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "message": "组织关联更新成功"
  }
}
```

---

## 10. 用户会话管理

### 10.1 获取用户会话

**接口**: `GET /api/users/:id/sessions`

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "deviceType": "web",
      "deviceName": "Chrome on Windows",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "isActive": true,
      "lastActivityAt": "2025-12-21T12:00:00.000Z",
      "expiresAt": "2025-12-22T12:00:00.000Z",
      "duration": "2小时30分"
    }
  ]
}
```

### 10.2 终止用户会话

**接口**: `DELETE /api/users/:id/sessions`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| excludeCurrent | boolean | 否 | 是否排除当前会话，默认false |

### 请求示例

```json
{
  "excludeCurrent": true
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "message": "会话终止成功",
    "terminatedCount": 3
  }
}
```

---

## 11. 用户状态管理

**接口**: `PUT /api/users/:id/status`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 状态：active/inactive/locked |
| reason | string | 否 | 变更原因 |

### 请求示例

```json
{
  "status": "inactive",
  "reason": "违反公司规定"
}
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "message": "状态更新成功",
    "oldStatus": "active",
    "newStatus": "inactive"
  }
}
```

---

## 安全特性

### 1. 超级管理员保护

```typescript
import {
  preventSuperAdminModification,
  preventSuperAdminDisable
} from '@/lib/super-admin';

// 防止修改超级管理员
await preventSuperAdminModification(userId);

// 防止禁用超级管理员
await preventSuperAdminDisable(userId, newStatus);
```

### 2. 租户隔离

```typescript
// 非超级管理员只能操作自己租户的数据
if (!currentUser?.isSuperAdmin) {
  conditions.push(eq(users.tenantId, currentUser.tenantId));
}
```

### 3. 数据验证

```typescript
import { validateUserCreation, validateUserUpdate } from '@/lib/validation';

const validation = validateUserCreation(formData);
if (!validation.isValid) {
  return errorResponse(validation.errors.join(', '));
}
```

### 4. 软删除

```typescript
// 删除操作仅设置标记，不真正删除数据
await db.update(users)
  .set({
    isDeleted: true,
    deletedAt: new Date()
  })
  .where(eq(users.id, id));
```

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 错误响应示例

```json
{
  "success": false,
  "error": "用户名已存在",
  "message": "同一租户内用户名必须唯一"
}
```

## API 调用示例

### JavaScript/TypeScript

```typescript
// 获取用户列表
const response = await fetch('/api/users?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// 创建用户
const createResponse = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    username: 'newuser',
    email: 'new@example.com',
    password: 'password123',
    roleId: 2
  })
});
```

### cURL

```bash
# 获取用户列表
curl -X GET "http://localhost:3003/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建用户
curl -X POST "http://localhost:3003/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "newuser",
    "email": "new@example.com",
    "password": "password123",
    "roleId": 2
  }'
```

## TypeScript 类型定义

```typescript
// 用户类型
interface User {
  id: number;
  email: string;
  phone?: string;
  username: string;
  realName?: string;
  roleId: number;
  tenantId: number;
  avatar?: string;
  status: 'active' | 'inactive' | 'locked';
  isSuperAdmin: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  role?: Role;
  organizations?: UserOrganization[];
}

// 分页响应
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 统计数据
interface UserStatistics {
  overview: {
    total: number;
    active: number;
    inactive: number;
    locked: number;
    activeRate: number;
  };
  engagement: {
    recentLogins: number;
    recentLoginRate: number;
  };
  growth: {
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    today: number;
    week: number;
  };
}
```
