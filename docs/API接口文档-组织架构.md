# 组织架构模块 API 接口文档

> 组织架构管理模块的完整 API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3003`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 数据模型

### Organization（组织）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 组织 ID（主键） |
| tenantId | bigint | 租户 ID |
| name | string | 组织名称 |
| code | string | 组织编码 |
| path | string | 组织路径（层级结构） |
| parentId | bigint | 父组织 ID |
| leaderId | integer | 负责人 ID |
| status | string | 状态（active/inactive） |
| sortOrder | integer | 排序值 |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |
| createdBy | integer | 创建人 ID |
| updatedBy | integer | 更新人 ID |

### UserOrganization（用户组织关联）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 关联 ID |
| userId | integer | 用户 ID |
| organizationId | bigint | 组织 ID |
| position | string | 职位 |
| isMain | boolean | 是否主组织 |
| joinedAt | datetime | 加入时间 |

---

## API 接口

### 1. 获取组织列表

**请求**
```http
GET /api/organizations
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 10，最大 100 |
| name | string | 否 | 组织名称（模糊搜索） |
| code | string | 否 | 组织编码（模糊搜索） |
| status | string | 否 | 状态筛选 |
| parentId | string | 否 | 父组织 ID，`null` 表示顶级组织 |
| startDate | string | 否 | 创建开始日期 |
| endDate | string | 否 | 创建结束日期 |

**请求示例**
```bash
curl -X GET "http://localhost:3003/api/organizations?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "tenantId": 1,
      "name": "技术部",
      "code": "TECH",
      "path": "1",
      "parentId": null,
      "leaderId": null,
      "status": "active",
      "sortOrder": 1,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z",
      "createdBy": 1,
      "updatedBy": 1,
      "userCount": "5"
    }
  ],
  "pager": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 2. 创建组织

**请求**
```http
POST /api/organizations
```

**请求体**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 组织名称 |
| code | string | 否 | 组织编码 |
| parentId | string | 否 | 父组织 ID |
| leaderId | integer | 否 | 负责人 ID |
| status | string | 否 | 状态，默认 active |
| sortOrder | integer | 否 | 排序值，默认 0 |

**请求示例**
```bash
curl -X POST "http://localhost:3003/api/organizations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "前端开发组",
    "code": "FRONTEND",
    "parentId": "1",
    "status": "active",
    "sortOrder": 1
  }'
```

**响应示例**
```json
{
  "code": 0,
  "data": {
    "id": "2",
    "name": "前端开发组",
    "message": "组织创建成功"
  }
}
```

**错误响应**
```json
{
  "code": -1,
  "message": "组织名称已存在"
}
```

---

### 3. 获取组织详情

**请求**
```http
GET /api/organizations/{id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 组织 ID |

**请求示例**
```bash
curl -X GET "http://localhost:3003/api/organizations/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "tenantId": 1,
    "name": "技术部",
    "code": "TECH",
    "path": "1",
    "parentId": null,
    "leaderId": null,
    "status": "active",
    "sortOrder": 1,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z",
    "createdBy": 1,
    "updatedBy": 1,
    "userCount": 5,
    "childCount": 2
  }
}
```

---

### 4. 更新组织

**请求**
```http
PUT /api/organizations/{id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 组织 ID |

**请求体**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 组织名称 |
| code | string | 否 | 组织编码 |
| parentId | string | 否 | 父组织 ID |
| leaderId | integer | 否 | 负责人 ID |
| status | string | 否 | 状态 |
| sortOrder | integer | 否 | 排序值 |

**请求示例**
```bash
curl -X PUT "http://localhost:3003/api/organizations/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "技术部（更新）",
    "code": "TECH_UPD",
    "status": "active",
    "sortOrder": 10
  }'
```

**响应示例**
```json
{
  "code": 0,
  "data": {
    "id": "1",
    "message": "组织更新成功"
  }
}
```

**错误响应**
```json
{
  "code": -1,
  "message": "组织不存在"
}
```

```json
{
  "code": -1,
  "message": "不能形成循环引用"
}
```

---

### 5. 删除组织

**请求**
```http
DELETE /api/organizations/{id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 组织 ID |

**请求示例**
```bash
curl -X DELETE "http://localhost:3003/api/organizations/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例**
```json
{
  "code": 0,
  "data": {
    "id": "1",
    "message": "组织删除成功"
  }
}
```

**错误响应**
```json
{
  "code": -1,
  "message": "请先删除子组织"
}
```

```json
{
  "code": -1,
  "message": "请先将用户移出该组织"
}
```

---

### 6. 获取组织树

**请求**
```http
GET /api/organizations/tree
```

**请求示例**
```bash
curl -X GET "http://localhost:3003/api/organizations/tree" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "tenantId": 1,
      "name": "技术部",
      "code": "TECH",
      "path": "1",
      "parentId": null,
      "leaderId": null,
      "status": "active",
      "sortOrder": 1,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z",
      "createdBy": 1,
      "updatedBy": 1,
      "userCount": "5",
      "leader": null,
      "children": [
        {
          "id": 2,
          "tenantId": 1,
          "name": "前端开发组",
          "code": "FRONTEND",
          "path": "1.1.2",
          "parentId": 1,
          "leaderId": 1,
          "status": "active",
          "sortOrder": 1,
          "createdAt": "2026-01-01T10:00:00.000Z",
          "updatedAt": "2026-01-01T10:00:00.000Z",
          "createdBy": 1,
          "updatedBy": 1,
          "userCount": "3",
          "leader": {
            "id": 1,
            "username": "Administrator",
            "realName": "管理员",
            "email": "admin@example.com"
          },
          "children": []
        }
      ]
    }
  ]
}
```

---

### 7. 获取组织的用户列表

**请求**
```http
GET /api/organizations/{id}/users
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 组织 ID |

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 10 |

**请求示例**
```bash
curl -X GET "http://localhost:3003/api/organizations/1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "username": "Administrator",
      "realName": "管理员",
      "email": "admin@example.com",
      "phone": "13112344321",
      "avatar": "/avatars/admin.jpg",
      "status": "active",
      "position": "技术总监",
      "isMain": true,
      "joinedAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "pager": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 8. 添加用户到组织

**请求**
```http
POST /api/organizations/{id}/users
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 组织 ID |

**请求体**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | integer | 是 | 用户 ID |
| position | string | 否 | 职位 |
| isMain | boolean | 否 | 是否主组织，默认 false |

**请求示例**
```bash
curl -X POST "http://localhost:3003/api/organizations/1/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "position": "技术总监",
    "isMain": true
  }'
```

**响应示例**
```json
{
  "code": 0,
  "data": {
    "message": "用户添加到组织成功"
  }
}
```

**错误响应**
```json
{
  "code": -1,
  "message": "用户已在该组织中"
}
```

---

### 9. 从组织移除用户

**请求**
```http
DELETE /api/organizations/{id}/users?userId={userId}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 组织 ID |

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | integer | 是 | 用户 ID |

**请求示例**
```bash
curl -X DELETE "http://localhost:3003/api/organizations/1/users?userId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例**
```json
{
  "code": 0,
  "data": {
    "message": "用户从组织移除成功"
  }
}
```

**错误响应**
```json
{
  "code": -1,
  "message": "用户不在该组织中"
}
```

---

## 状态码

| Code | 说明 |
|------|------|
| 0 | 成功 |
| -1 | 业务错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |

---

## 注意事项

1. **租户隔离**: 所有操作都在当前租户范围内进行
2. **循环引用**: 更新组织时会检查是否形成循环引用
3. **删除限制**: 删除组织前需要先删除子组织和移除用户
4. **主组织**: 用户可以属于多个组织，但只能有一个主组织
5. **认证**: 所有接口都需要在 Header 中携带有效的 JWT Token

---

## 测试脚本

使用提供的测试脚本进行完整测试：

```bash
./test-organization-api.sh
```

---

*文档生成时间: 2026-01-01*
*API 版本: v1.0.0*
