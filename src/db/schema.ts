/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import {
  pgTable,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  json,
  jsonb,
  unique,
  bigint,
  pgEnum,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 租户状态枚举
export const tenantStatusEnum = pgEnum('tenant_status', [
  'active',
  'inactive',
  'suspended'
]);

// 用户状态枚举
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'inactive',
  'locked',
  'deleted'
]);

// 角色状态枚举
export const roleStatusEnum = pgEnum('role_status', [
  'active',
  'inactive',
  'deleted'
]);

// 权限状态枚举
export const permissionStatusEnum = pgEnum('permission_status', [
  'active',
  'inactive',
  'deleted'
]);

// 权限类型枚举
export const permissionTypeEnum = pgEnum('permission_type', [
  'menu',
  'page',
  'button',
  'api',
  'data'
]);

// 数据权限规则类型枚举
export const dataPermissionRuleTypeEnum = pgEnum('data_permission_rule_type', [
  'all',
  'org',
  'dept',
  'self',
  'custom'
]);

// 登录类型枚举
export const loginTypeEnum = pgEnum('login_type', [
  'email',
  'phone',
  'wechat',
  'oauth'
]);

// 设备类型枚举
export const deviceTypeEnum = pgEnum('device_type', [
  'web',
  'mobile',
  'desktop'
]);

// 租户表
export const tenants = pgTable('tenants', {
  id: bigint('id', { mode: 'bigint' })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  status: tenantStatusEnum('status').default('active'),
  settings: json('settings').default('{}'), // 租户配置信息
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Replace the baseUsersSchema with inline column definitions that include references
export const users = pgTable(
  'users',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 50 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    avatar: varchar('avatar', { length: 255 }).default('/avatars/default.jpg'),
    phone: varchar('phone', { length: 20 }),
    realName: varchar('real_name', { length: 100 }),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id),
    isSuperAdmin: boolean('is_super_admin').default(false),
    status: userStatusEnum('status').default('active'),
    metadata: jsonb('metadata').default('{}'),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
    passwordUpdatedAt: timestamp('password_updated_at').defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    tenantEmailUnique: unique('users_tenant_email_unique').on(
      t.tenantId,
      t.email
    ),
    tenantUsernameUnique: unique('users_tenant_username_unique').on(
      t.tenantId,
      t.username
    ),
    phoneIdx: index('idx_users_phone').on(t.phone),
    realNameIdx: index('idx_users_real_name').on(t.realName),
    isDeletedIdx: index('idx_users_is_deleted').on(t.isDeleted)
  })
);

export const roles = pgTable(
  'roles',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: varchar('name', { length: 50 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),
    parentId: integer('parent_id').references(() => roles.id),
    isSuper: boolean('is_super').default(false),
    isSystem: boolean('is_system').default(false),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
    description: varchar('description', { length: 255 }),
    sortOrder: integer('sort_order').default(0),
    status: roleStatusEnum('status').default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    // 联合唯一约束：同一租户内角色名称唯一
    tenantNameUnique: unique('roles_tenant_name_unique').on(t.tenantId, t.name),
    // 联合唯一约束：同一租户内角色代码唯一
    tenantCodeUnique: unique('roles_tenant_code_unique').on(t.tenantId, t.code),
    // 索引
    parentIdIdx: index('idx_roles_parent_id').on(t.parentId),
    codeIdx: index('idx_roles_code').on(t.code),
    isDeletedIdx: index('idx_roles_is_deleted').on(t.isDeleted),
    sortOrderIdx: index('idx_roles_sort_order').on(t.sortOrder)
  })
);

// 权限表
export const permissions = pgTable(
  'permissions',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: varchar('name', { length: 50 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),
    type: permissionTypeEnum('type').notNull().default('api'),
    frontPath: varchar('front_path', { length: 255 }),
    apiPath: varchar('api_path', { length: 255 }),
    resourceType: varchar('resource_type', { length: 100 }),
    method: varchar('method', { length: 20 }),
    description: varchar('description', { length: 255 }),
    parentId: integer('parent_id'), // 父权限ID，null表示顶级权限
    sortOrder: integer('sort_order').default(0), // 排序字段
    isSystem: boolean('is_system').default(false),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
    status: permissionStatusEnum('status').default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    // 联合唯一约束：同一租户内权限代码唯一
    tenantCodeUnique: unique('permissions_tenant_code_unique').on(
      t.tenantId,
      t.code
    ),
    // 联合唯一约束：同一租户内权限名称唯一
    tenantNameUnique: unique('permissions_tenant_name_unique').on(
      t.tenantId,
      t.name
    ),
    // 索引
    typeIdx: index('idx_permissions_type').on(t.type),
    frontPathIdx: index('idx_permissions_front_path').on(t.frontPath),
    apiPathIdx: index('idx_permissions_api_path').on(t.apiPath),
    resourceTypeIdx: index('idx_permissions_resource_type').on(t.resourceType),
    methodIdx: index('idx_permissions_method').on(t.method),
    isDeletedIdx: index('idx_permissions_is_deleted').on(t.isDeleted)
  })
);

// 角色-权限关联表
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    roleId: integer('role_id').notNull(),
    permissionId: integer('permission_id').notNull(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    // 联合唯一约束：同一租户内角色权限关联唯一
    unq: unique('role_permission_tenant_unique').on(
      t.tenantId,
      t.roleId,
      t.permissionId
    )
  })
);

// 组织架构表
export const organizations = pgTable(
  'organizations',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    code: varchar('code', { length: 100 }),
    path: varchar('path', { length: 255 }), // 暂时用varchar代替ltree
    parentId: bigint('parent_id', { mode: 'number' }).references(
      () => organizations.id
    ),
    leaderId: integer('leader_id').references(() => users.id),
    status: varchar('status', { length: 20 }).default('active'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    tenantIdIdx: index('idx_organizations_tenant_id').on(t.tenantId),
    parentIdIdx: index('idx_organizations_parent_id').on(t.parentId),
    leaderIdIdx: index('idx_organizations_leader_id').on(t.leaderId),
    codeIdx: index('idx_organizations_code').on(t.code)
  })
);

// 用户组织关联表
export const userOrganizations = pgTable(
  'user_organizations',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: bigint('organization_id', { mode: 'number' })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    position: varchar('position', { length: 100 }),
    isMain: boolean('is_main').default(false),
    joinedAt: timestamp('joined_at').defaultNow()
  },
  (t) => ({
    uniqueUserOrg: unique('user_organizations_unique').on(
      t.userId,
      t.organizationId
    ),
    userIdIdx: index('idx_user_organizations_user_id').on(t.userId),
    orgIdIdx: index('idx_user_organizations_org_id').on(t.organizationId),
    isMainIdx: index('idx_user_organizations_is_main').on(t.isMain)
  })
);

// 数据权限规则表
export const dataPermissionRules = pgTable(
  'data_permission_rules',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    ruleType: dataPermissionRuleTypeEnum('rule_type').notNull(),
    ruleExpression: jsonb('rule_expression'),
    description: text('description'),
    status: varchar('status', { length: 20 }).default('active'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    tenantIdIdx: index('idx_data_rules_tenant_id').on(t.tenantId),
    resourceTypeIdx: index('idx_data_rules_resource_type').on(t.resourceType),
    ruleTypeIdx: index('idx_data_rules_rule_type').on(t.ruleType)
  })
);

// 角色数据权限关联表
export const roleDataPermissions = pgTable(
  'role_data_permissions',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    ruleId: bigint('rule_id', { mode: 'number' })
      .notNull()
      .references(() => dataPermissionRules.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at').defaultNow(),
    grantedBy: integer('granted_by').references(() => users.id)
  },
  (t) => ({
    uniqueRoleRule: unique('role_data_permissions_unique').on(
      t.roleId,
      t.ruleId
    ),
    roleIdIdx: index('idx_role_data_permissions_role_id').on(t.roleId),
    ruleIdIdx: index('idx_role_data_permissions_rule_id').on(t.ruleId)
  })
);

// 用户会话表
export const userSessions = pgTable(
  'user_sessions',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
    deviceId: varchar('device_id', { length: 255 }),
    deviceType: deviceTypeEnum('device_type'),
    deviceName: varchar('device_name', { length: 200 }),
    platform: varchar('platform', { length: 100 }),
    tokenHash: varchar('token_hash', { length: 255 }),
    ipAddress: varchar('ip_address', { length: 45 }), // 支持IPv6
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at').notNull(),
    isActive: boolean('is_active').default(true),
    impersonatorId: integer('impersonator_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow()
  },
  (t) => ({
    userIdIdx: index('idx_user_sessions_user_id').on(t.userId),
    sessionIdIdx: index('idx_user_sessions_session_id').on(t.sessionId),
    tokenHashIdx: index('idx_user_sessions_token_hash').on(t.tokenHash),
    expiresAtIdx: index('idx_user_sessions_expires_at').on(t.expiresAt),
    impersonatorIdIdx: index('idx_user_sessions_impersonator_id').on(
      t.impersonatorId
    ),
    isActiveIdx: index('idx_user_sessions_is_active').on(t.isActive)
  })
);

// 用户登录方式表
export const userLoginMethods = pgTable(
  'user_login_methods',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    loginType: loginTypeEnum('login_type'),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    isVerified: boolean('is_verified').default(false),
    isPrimary: boolean('is_primary').default(false),
    lastUsedAt: timestamp('last_used_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (t) => ({
    uniqueUserLoginType: unique('user_login_methods_unique').on(
      t.userId,
      t.loginType,
      t.identifier
    ),
    userIdIdx: index('idx_user_login_methods_user_id').on(t.userId),
    identifierIdx: index('idx_user_login_methods_identifier').on(t.identifier),
    loginTypeIdx: index('idx_user_login_methods_login_type').on(t.loginType)
  })
);

// 验证码表
export const verificationCodes = pgTable(
  'verification_codes',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    phone: varchar('phone', { length: 20 }).notNull(),
    code: varchar('code', { length: 10 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'login', 'register', 'reset'
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .default(1)
      .references(() => tenants.id),
    ip: varchar('ip', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    phoneExpiresIdx: index('idx_verification_codes_phone_expires').on(
      t.phone,
      t.expiresAt
    ),
    phoneTypeIdx: index('idx_verification_codes_phone_type').on(
      t.phone,
      t.type
    ),
    expiresAtIdx: index('idx_verification_codes_expires_at').on(t.expiresAt)
  })
);

// 系统日志表（增强）
export const systemLogs = pgTable(
  'system_logs',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    level: varchar('level', { length: 20 }).notNull(), // info, warn, error, debug
    action: varchar('action', { length: 100 }).notNull(), // 操作类型
    module: varchar('module', { length: 50 }).notNull(), // 模块名称
    message: text('message').notNull(), // 日志消息
    details: json('details'), // 详细信息 JSON
    resourceType: varchar('resource_type', { length: 100 }),
    resourceId: varchar('resource_id', { length: 255 }),
    oldValues: jsonb('old_values'), // 变更前的值
    newValues: jsonb('new_values'), // 变更后的值
    userId: integer('user_id'), // 操作用户ID
    sessionId: varchar('session_id', { length: 255 }),
    tenantId: bigint('tenant_id', { mode: 'number' }).references(
      () => tenants.id
    ),
    userAgent: varchar('user_agent', { length: 500 }), // 用户代理
    ip: varchar('ip', { length: 45 }), // IP地址
    requestId: varchar('request_id', { length: 100 }), // 请求ID
    duration: integer('duration'), // 执行时间(毫秒)
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    resourceTypeIdx: index('idx_system_logs_resource_type').on(t.resourceType),
    resourceIdIdx: index('idx_system_logs_resource_id').on(t.resourceId),
    sessionIdIdx: index('idx_system_logs_session_id').on(t.sessionId),
    tenantIdIdx: index('idx_system_logs_tenant_id').on(t.tenantId),
    levelActionIdx: index('idx_system_logs_level_action').on(t.level, t.action)
  })
);

// 关系定义
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id]
  }),
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  userOrganizations: many(userOrganizations),
  ledOrganizations: many(organizations),
  createdBy: one(users, {
    fields: [users.createdBy],
    references: [users.id],
    relationName: 'created_by_user'
  }),
  updatedBy: one(users, {
    fields: [users.updatedBy],
    references: [users.id],
    relationName: 'updated_by_user'
  }),
  sessions: many(userSessions),
  loginMethods: many(userLoginMethods),
  impersonatedSessions: many(userSessions, {
    relationName: 'impersonator'
  }),
  auditLogs: many(systemLogs),
  serviceArchives: many(serviceArchives),
  serviceRecords: many(serviceRecords),
  healthRecords: many(healthRecords),
  serviceAppointments: many(serviceAppointments),
  userPoints: one(userPoints),
  pointTransactions: many(pointTransactions)
}));

export const rolesRelations = relations(roles, ({ many, one }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
  roleDataPermissions: many(roleDataPermissions),
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id]
  }),
  parent: one(roles, {
    fields: [roles.parentId],
    references: [roles.id],
    relationName: 'parent_child'
  }),
  children: many(roles, { relationName: 'parent_child' }),
  createdBy: one(users, {
    fields: [roles.createdBy],
    references: [users.id]
  }),
  updatedBy: one(users, {
    fields: [roles.updatedBy],
    references: [users.id]
  })
}));

export const permissionsRelations = relations(permissions, ({ many, one }) => ({
  rolePermissions: many(rolePermissions),
  templatePermissions: many(templatePermissions),
  parent: one(permissions, {
    fields: [permissions.parentId],
    references: [permissions.id],
    relationName: 'permission_parent_child'
  }),
  children: many(permissions, { relationName: 'permission_parent_child' }),
  tenant: one(tenants, {
    fields: [permissions.tenantId],
    references: [tenants.id]
  }),
  createdBy: one(users, {
    fields: [permissions.createdBy],
    references: [users.id]
  }),
  updatedBy: one(users, {
    fields: [permissions.updatedBy],
    references: [users.id]
  })
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  permissions: many(permissions),
  rolePermissions: many(rolePermissions),
  organizations: many(organizations),
  dataPermissionRules: many(dataPermissionRules),
  systemLogs: many(systemLogs),
  verificationCodes: many(verificationCodes),
  permissionTemplates: many(permissionTemplates),
  templatePermissions: many(templatePermissions),
  serviceArchives: many(serviceArchives),
  serviceRecords: many(serviceRecords),
  healthRecords: many(healthRecords),
  serviceAppointments: many(serviceAppointments),
  userPoints: many(userPoints),
  pointTransactions: many(pointTransactions),
  pointRewards: many(pointRewards)
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id]
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id]
    }),
    tenant: one(tenants, {
      fields: [rolePermissions.tenantId],
      references: [tenants.id]
    })
  })
);

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [organizations.tenantId],
      references: [tenants.id]
    }),
    parent: one(organizations, {
      fields: [organizations.parentId],
      references: [organizations.id],
      relationName: 'org_parent_child'
    }),
    children: many(organizations, { relationName: 'org_parent_child' }),
    leader: one(users, {
      fields: [organizations.leaderId],
      references: [users.id]
    }),
    userOrganizations: many(userOrganizations),
    createdBy: one(users, {
      fields: [organizations.createdBy],
      references: [users.id]
    }),
    updatedBy: one(users, {
      fields: [organizations.updatedBy],
      references: [users.id]
    })
  })
);

export const userOrganizationsRelations = relations(
  userOrganizations,
  ({ one }) => ({
    user: one(users, {
      fields: [userOrganizations.userId],
      references: [users.id]
    }),
    organization: one(organizations, {
      fields: [userOrganizations.organizationId],
      references: [organizations.id]
    })
  })
);

export const dataPermissionRulesRelations = relations(
  dataPermissionRules,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [dataPermissionRules.tenantId],
      references: [tenants.id]
    }),
    roleDataPermissions: many(roleDataPermissions),
    createdBy: one(users, {
      fields: [dataPermissionRules.createdBy],
      references: [users.id]
    }),
    updatedBy: one(users, {
      fields: [dataPermissionRules.updatedBy],
      references: [users.id]
    })
  })
);

export const roleDataPermissionsRelations = relations(
  roleDataPermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [roleDataPermissions.roleId],
      references: [roles.id]
    }),
    rule: one(dataPermissionRules, {
      fields: [roleDataPermissions.ruleId],
      references: [dataPermissionRules.id]
    }),
    grantedBy: one(users, {
      fields: [roleDataPermissions.grantedBy],
      references: [users.id]
    })
  })
);

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id]
  }),
  impersonator: one(users, {
    fields: [userSessions.impersonatorId],
    references: [users.id],
    relationName: 'impersonator'
  })
}));

export const userLoginMethodsRelations = relations(
  userLoginMethods,
  ({ one }) => ({
    user: one(users, {
      fields: [userLoginMethods.userId],
      references: [users.id]
    })
  })
);

export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [systemLogs.tenantId],
    references: [tenants.id]
  })
}));

export const verificationCodesRelations = relations(
  verificationCodes,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [verificationCodes.tenantId],
      references: [tenants.id]
    })
  })
);

// 类型定义
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type NewUserOrganization = typeof userOrganizations.$inferInsert;

export type DataPermissionRule = typeof dataPermissionRules.$inferSelect;
export type NewDataPermissionRule = typeof dataPermissionRules.$inferInsert;

export type RoleDataPermission = typeof roleDataPermissions.$inferSelect;
export type NewRoleDataPermission = typeof roleDataPermissions.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type UserLoginMethod = typeof userLoginMethods.$inferSelect;
export type NewUserLoginMethod = typeof userLoginMethods.$inferInsert;

export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;

// 枚举类型
export type TenantStatus = (typeof tenantStatusEnum.enumValues)[number];
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type RoleStatus = (typeof roleStatusEnum.enumValues)[number];
export type PermissionStatus = (typeof permissionStatusEnum.enumValues)[number];
export type PermissionType = (typeof permissionTypeEnum.enumValues)[number];
export type DataPermissionRuleType =
  (typeof dataPermissionRuleTypeEnum.enumValues)[number];
export type LoginType = (typeof loginTypeEnum.enumValues)[number];
export type DeviceType = (typeof deviceTypeEnum.enumValues)[number];

// 租户配置接口
export interface TenantSettings {
  theme?: {
    primaryColor?: string;
    logo?: string;
    name?: string;
  };
  features?: {
    multiFactorAuth?: boolean;
    auditLogs?: boolean;
    apiAccess?: boolean;
  };
  limits?: {
    maxUsers?: number;
    maxRoles?: number;
    maxStorage?: number;
  };
  custom?: Record<string, any>;
}

// 租户统计信息
export interface TenantStatistics {
  id: bigint;
  name: string;
  code: string;
  status: TenantStatus;
  createdAt: Date;
  userCount: number;
  roleCount: number;
  permissionCount: number;
  rolePermissionCount: number;
}

// 客户服务档案表
export const serviceArchives = pgTable(
  'service_archives',
  {
    id: bigint('id', { mode: 'bigint' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    customerNo: varchar('customer_no', { length: 50 }).notNull(),
    channels: jsonb('channels').default('{}'),
    basicInfo: jsonb('basic_info').default('{}'),
    healthHistory: jsonb('health_history').default('{}'),
    subjectiveDemand: text('subjective_demand').default(''),
    signature1: jsonb('signature1').default('{}'),
    signature2: jsonb('signature2').default('{}'),
    footer: jsonb('footer').default('{}'),
    status: varchar('status', { length: 20 }).default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    isDeleted: boolean('is_deleted').default(false)
  },
  (t) => ({
    userCustomerUnique: unique('service_archives_user_customer_unique').on(
      t.userId,
      t.customerNo
    ),
    userIdIdx: index('idx_service_archives_user_id').on(t.userId),
    customerNoIdx: index('idx_service_archives_customer_no').on(t.customerNo),
    statusIdx: index('idx_service_archives_status').on(t.status),
    createdAtIdx: index('idx_service_archives_created_at').on(t.createdAt),
    isDeletedIdx: index('idx_service_archives_is_deleted').on(t.isDeleted)
  })
);

// 服务档案关系定义
export const serviceArchivesRelations = relations(
  serviceArchives,
  ({ one, many }) => ({
    user: one(users, {
      fields: [serviceArchives.userId],
      references: [users.id]
    }),
    createdByUser: one(users, {
      fields: [serviceArchives.createdBy],
      references: [users.id]
    }),
    updatedByUser: one(users, {
      fields: [serviceArchives.updatedBy],
      references: [users.id]
    }),
    serviceRecords: many(serviceRecords)
  })
);

// 服务档案类型
export type ServiceArchive = typeof serviceArchives.$inferSelect;
export type NewServiceArchive = typeof serviceArchives.$inferInsert;

// 服务记录表
export const serviceRecords = pgTable(
  'service_records',
  {
    id: bigint('id', { mode: 'bigint' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    archiveId: bigint('archive_id', { mode: 'bigint' })
      .notNull()
      .references(() => serviceArchives.id, { onDelete: 'cascade' }),
    count: integer('count').notNull(),
    serviceDate: varchar('service_date', { length: 10 }).notNull(),
    bloodPressure: jsonb('blood_pressure').default('{}'),
    discomfort: jsonb('discomfort').default('{}'),
    consultant: jsonb('consultant').default('{}'),
    duration: integer('duration').default(45),
    temperature: integer('temperature').default(45),
    feedback: text('feedback').default(''),
    status: varchar('status', { length: 20 }).default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    isDeleted: boolean('is_deleted').default(false)
  },
  (t) => ({
    archiveCountUnique: unique('service_records_archive_count_unique').on(
      t.archiveId,
      t.count
    ),
    userIdIdx: index('idx_service_records_user_id').on(t.userId),
    archiveIdIdx: index('idx_service_records_archive_id').on(t.archiveId),
    serviceDateIdx: index('idx_service_records_service_date').on(t.serviceDate),
    statusIdx: index('idx_service_records_status').on(t.status),
    createdAtIdx: index('idx_service_records_created_at').on(t.createdAt),
    isDeletedIdx: index('idx_service_records_is_deleted').on(t.isDeleted)
  })
);

// 服务记录关系定义
export const serviceRecordsRelations = relations(serviceRecords, ({ one }) => ({
  user: one(users, {
    fields: [serviceRecords.userId],
    references: [users.id]
  }),
  archive: one(serviceArchives, {
    fields: [serviceRecords.archiveId],
    references: [serviceArchives.id]
  }),
  createdByUser: one(users, {
    fields: [serviceRecords.createdBy],
    references: [users.id]
  }),
  updatedByUser: one(users, {
    fields: [serviceRecords.updatedBy],
    references: [users.id]
  })
}));

// 服务记录类型
export type ServiceRecord = typeof serviceRecords.$inferSelect;
export type NewServiceRecord = typeof serviceRecords.$inferInsert;

// 健康记录表
export const healthRecords = pgTable(
  'health_records',
  {
    id: bigint('id', { mode: 'bigint' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recordDate: varchar('record_date', { length: 10 }).notNull(), // YYYY-MM-DD
    bloodPressure: jsonb('blood_pressure').default('{}'), // { systolic: number, diastolic: number }
    bloodSugar: jsonb('blood_sugar').default('{}'), // { value: number, unit: string, type: string }
    heartRate: integer('heart_rate'), // bpm
    weight: jsonb('weight').default('{}'), // { value: number, unit: string }
    temperature: jsonb('temperature').default('{}'), // { value: number, unit: string }
    notes: text('notes').default(''),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    isDeleted: boolean('is_deleted').default(false)
  },
  (t) => ({
    userIdDateUnique: unique('health_records_user_date_unique').on(
      t.userId,
      t.recordDate
    ),
    userIdIdx: index('idx_health_records_user_id').on(t.userId),
    recordDateIdx: index('idx_health_records_record_date').on(t.recordDate),
    isDeletedIdx: index('idx_health_records_is_deleted').on(t.isDeleted)
  })
);

// 健康记录关系定义
export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  user: one(users, {
    fields: [healthRecords.userId],
    references: [users.id]
  }),
  createdByUser: one(users, {
    fields: [healthRecords.createdBy],
    references: [users.id]
  }),
  updatedByUser: one(users, {
    fields: [healthRecords.updatedBy],
    references: [users.id]
  })
}));

// 健康记录类型
export type HealthRecord = typeof healthRecords.$inferSelect;
export type NewHealthRecord = typeof healthRecords.$inferInsert;

// 服务预约表
export const serviceAppointments = pgTable(
  'service_appointments',
  {
    id: bigint('id', { mode: 'bigint' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    appointmentDate: varchar('appointment_date', { length: 10 }).notNull(), // YYYY-MM-DD
    appointmentTime: varchar('appointment_time', { length: 5 }).notNull(), // HH:MM
    serviceType: varchar('service_type', { length: 50 }).notNull(), // 服务类型
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, confirmed, completed, cancelled
    notes: text('notes').default(''),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
    isDeleted: boolean('is_deleted').default(false)
  },
  (t) => ({
    userIdDateTimeUnique: unique(
      'service_appointments_user_datetime_unique'
    ).on(t.userId, t.appointmentDate, t.appointmentTime),
    userIdIdx: index('idx_service_appointments_user_id').on(t.userId),
    appointmentDateIdx: index('idx_service_appointments_appointment_date').on(
      t.appointmentDate
    ),
    statusIdx: index('idx_service_appointments_status').on(t.status),
    isDeletedIdx: index('idx_service_appointments_is_deleted').on(t.isDeleted)
  })
);

// 服务预约关系定义
export const serviceAppointmentsRelations = relations(
  serviceAppointments,
  ({ one }) => ({
    user: one(users, {
      fields: [serviceAppointments.userId],
      references: [users.id]
    }),
    createdByUser: one(users, {
      fields: [serviceAppointments.createdBy],
      references: [users.id]
    }),
    updatedByUser: one(users, {
      fields: [serviceAppointments.updatedBy],
      references: [users.id]
    })
  })
);

// 服务预约类型
export type ServiceAppointment = typeof serviceAppointments.$inferSelect;
export type NewServiceAppointment = typeof serviceAppointments.$inferInsert;

// 权限模板表
export const permissionTemplates = pgTable(
  'permission_templates',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),
    isSystem: boolean('is_system').default(false),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    tenantNameUnique: unique('permission_templates_tenant_name_unique').on(
      t.tenantId,
      t.name
    ),
    tenantIdIdx: index('idx_permission_templates_tenant_id').on(t.tenantId),
    isDeletedIdx: index('idx_permission_templates_is_deleted').on(t.isDeleted)
  })
);

// 模板-权限关联表
export const templatePermissions = pgTable(
  'template_permissions',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    templateId: integer('template_id')
      .notNull()
      .references(() => permissionTemplates.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    unq: unique('template_permission_tenant_unique').on(
      t.tenantId,
      t.templateId,
      t.permissionId
    ),
    templateIdIdx: index('idx_template_permissions_template_id').on(
      t.templateId
    ),
    permissionIdIdx: index('idx_template_permissions_permission_id').on(
      t.permissionId
    )
  })
);

// 权限模板类型
export type PermissionTemplate = typeof permissionTemplates.$inferSelect;
export type NewPermissionTemplate = typeof permissionTemplates.$inferInsert;

// 模板权限关联类型
export type TemplatePermission = typeof templatePermissions.$inferSelect;
export type NewTemplatePermission = typeof templatePermissions.$inferInsert;

// 权限模板关系定义
export const permissionTemplatesRelations = relations(
  permissionTemplates,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [permissionTemplates.tenantId],
      references: [tenants.id]
    }),
    templatePermissions: many(templatePermissions),
    createdBy: one(users, {
      fields: [permissionTemplates.createdBy],
      references: [users.id]
    }),
    updatedBy: one(users, {
      fields: [permissionTemplates.updatedBy],
      references: [users.id]
    })
  })
);

export const templatePermissionsRelations = relations(
  templatePermissions,
  ({ one }) => ({
    template: one(permissionTemplates, {
      fields: [templatePermissions.templateId],
      references: [permissionTemplates.id]
    }),
    permission: one(permissions, {
      fields: [templatePermissions.permissionId],
      references: [permissions.id]
    }),
    tenant: one(tenants, {
      fields: [templatePermissions.tenantId],
      references: [tenants.id]
    })
  })
);

// ============ 积分系统相关表 ============

// 积分交易类型枚举
export const pointTransactionTypeEnum = pgEnum('point_transaction_type', [
  'earn',
  'spend',
  'expire',
  'adjust',
  'level_up'
]);

// 积分奖励类型枚举
export const pointRewardTypeEnum = pgEnum('point_reward_type', [
  'one_time',
  'daily',
  'streak',
  'achievement'
]);

// 用户积分表
export const userPoints = pgTable(
  'user_points',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),

    // 积分相关
    points: integer('points').notNull().default(0), // 当前可用积分
    totalEarned: integer('total_earned').notNull().default(0), // 累计获得积分
    totalSpent: integer('total_spent').notNull().default(0), // 累计消耗积分

    // 等级相关
    level: integer('level').notNull().default(1), // 当前等级
    experience: integer('experience').notNull().default(0), // 当前经验值
    nextLevelExp: integer('next_level_exp').notNull().default(50), // 下一级所需经验

    // 签到相关
    checkInStreak: integer('check_in_streak').default(0), // 连续签到天数
    lastCheckInDate: varchar('last_check_in_date', { length: 10 }), // 最后签到日期 YYYY-MM-DD
    totalCheckInDays: integer('total_check_in_days').default(0), // 累计签到天数

    metadata: jsonb('metadata').default('{}'),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    userIdIdx: index('idx_user_points_user_id').on(t.userId),
    levelIdx: index('idx_user_points_level').on(t.level),
    checkInStreakIdx: index('idx_user_points_check_in_streak').on(
      t.checkInStreak
    )
  })
);

// 积分流水表
export const pointTransactions = pgTable(
  'point_transactions',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),

    // 交易信息
    type: pointTransactionTypeEnum('type').notNull(), // 'earn', 'spend', 'expire', 'adjust', 'level_up'
    amount: integer('amount').notNull(), // 积分变动数量
    balance: integer('balance').notNull(), // 交易后余额

    // 来源和描述
    source: varchar('source', { length: 50 }), // 'check_in', 'service', 'reward', 'expire'
    description: varchar('description', { length: 255 }),
    referenceId: varchar('reference_id', { length: 100 }), // 关联业务ID

    // 经验相关
    experienceGained: integer('experience_gained').default(0), // 获得的经验值

    status: varchar('status', { length: 20 }).default('completed'), // 'pending', 'completed', 'cancelled'
    metadata: jsonb('metadata').default('{}'),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    userIdIdx: index('idx_point_transactions_user_id').on(t.userId),
    createdAtIdx: index('idx_point_transactions_created_at').on(t.createdAt),
    typeIdx: index('idx_point_transactions_type').on(t.type)
  })
);

// 积分奖励配置表
export const pointRewards = pgTable(
  'point_rewards',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    tenantId: bigint('tenant_id', { mode: 'number' }).notNull().default(1),

    // 奖励配置
    code: varchar('code', { length: 50 }).notNull(), // 唯一标识: 'daily_check_in'
    name: varchar('name', { length: 100 }).notNull(),
    type: pointRewardTypeEnum('type').notNull(), // 'one_time', 'daily', 'streak', 'achievement'

    // 奖励内容
    points: integer('points').notNull().default(0),
    experience: integer('experience').notNull().default(0),

    // 条件限制
    maxDailyTimes: integer('max_daily_times').default(1), // 每日最大次数
    maxTotalTimes: integer('max_total_times').default(0), // 总次数限制，0=无限制

    // 连续签到配置
    streakDays: integer('streak_days').default(0), // 连续天数要求

    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),

    metadata: jsonb('metadata').default('{}'),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id)
  },
  (t) => ({
    codeUnique: unique('point_rewards_code_unique').on(t.code),
    tenantIdx: index('idx_point_rewards_tenant_id').on(t.tenantId),
    isActiveIdx: index('idx_point_rewards_is_active').on(t.isActive),
    isDeletedIdx: index('idx_point_rewards_is_deleted').on(t.isDeleted)
  })
);

// 积分表关系定义
export const userPointsRelations = relations(userPoints, ({ one, many }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [userPoints.tenantId],
    references: [tenants.id]
  }),
  transactions: many(pointTransactions),
  createdBy: one(users, {
    fields: [userPoints.createdBy],
    references: [users.id]
  }),
  updatedBy: one(users, {
    fields: [userPoints.updatedBy],
    references: [users.id]
  })
}));

export const pointTransactionsRelations = relations(
  pointTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [pointTransactions.userId],
      references: [users.id]
    }),
    tenant: one(tenants, {
      fields: [pointTransactions.tenantId],
      references: [tenants.id]
    }),
    userPoints: one(userPoints, {
      fields: [pointTransactions.userId],
      references: [userPoints.userId]
    })
  })
);

export const pointRewardsRelations = relations(pointRewards, ({ one }) => ({
  tenant: one(tenants, {
    fields: [pointRewards.tenantId],
    references: [tenants.id]
  }),
  createdBy: one(users, {
    fields: [pointRewards.createdBy],
    references: [users.id]
  }),
  updatedBy: one(users, {
    fields: [pointRewards.updatedBy],
    references: [users.id]
  })
}));

// 积分系统类型
export type UserPoints = typeof userPoints.$inferSelect;
export type NewUserPoints = typeof userPoints.$inferInsert;

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;

export type PointReward = typeof pointRewards.$inferSelect;
export type NewPointReward = typeof pointRewards.$inferInsert;

export type PointTransactionType =
  (typeof pointTransactionTypeEnum.enumValues)[number];
export type PointRewardType = (typeof pointRewardTypeEnum.enumValues)[number];
