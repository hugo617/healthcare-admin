/**
 * 权限常量定义
 * 此文件可以在客户端和服务端共享
 */
export const PERMISSIONS = {
  // 用户管理权限
  USER: {
    READ: 'account.user.read',
    CREATE: 'account.user.create',
    UPDATE: 'account.user.update',
    DELETE: 'account.user.delete'
  },
  // 角色管理权限
  ROLE: {
    READ: 'account.role.read',
    CREATE: 'account.role.create',
    UPDATE: 'account.role.update',
    DELETE: 'account.role.delete',
    ASSIGN: 'account.role.assign'
  },
  // 权限管理权限
  PERMISSION: {
    READ: 'account.permission.read',
    CREATE: 'account.permission.create',
    UPDATE: 'account.permission.update',
    DELETE: 'account.permission.delete'
  },
  // 日志管理权限
  LOG: {
    READ: 'system.log.read',
    DELETE: 'system.log.delete',
    EXPORT: 'system.log.export'
  },
  // 租户管理权限
  TENANT: {
    READ: 'admin.tenant.read',
    CREATE: 'admin.tenant.create',
    UPDATE: 'admin.tenant.update',
    DELETE: 'admin.tenant.delete',
    CONFIG: 'admin.tenant.config'
  },
  // 组织管理权限
  ORGANIZATION: {
    READ: 'account.organization.read',
    CREATE: 'account.organization.create',
    UPDATE: 'account.organization.update',
    DELETE: 'account.organization.delete'
  },
  // 系统管理权限
  SYSTEM: {
    CONFIG: 'admin.system.config'
  },
  // 服务记录管理权限
  SERVICE_RECORD: {
    READ: 'data.service_record.read',
    CREATE: 'data.service_record.create',
    UPDATE: 'data.service_record.update',
    DELETE: 'data.service_record.delete',
    EXPORT: 'data.service_record.export'
  },
  // 健康记录管理权限
  HEALTH_RECORD: {
    READ: 'data.health_record.read',
    CREATE: 'data.health_record.create',
    UPDATE: 'data.health_record.update',
    DELETE: 'data.health_record.delete',
    EXPORT: 'data.health_record.export',
    VIEW_TRENDS: 'data.health_record.view_trends'
  }
} as const;

/**
 * 路由权限映射
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard/account/user': [PERMISSIONS.USER.READ],
  '/dashboard/account/role': [PERMISSIONS.ROLE.READ],
  '/dashboard/account/permission': [PERMISSIONS.PERMISSION.READ],
  '/dashboard/system/logs': [PERMISSIONS.LOG.READ],
  '/dashboard/account/tenant': [PERMISSIONS.TENANT.READ],
  '/dashboard/account/organization': [PERMISSIONS.ORGANIZATION.READ],
  '/dashboard/data/service-record': [PERMISSIONS.SERVICE_RECORD.READ],
  '/dashboard/data/health-record': [PERMISSIONS.HEALTH_RECORD.READ]
} as const;
