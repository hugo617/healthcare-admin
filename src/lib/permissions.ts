/**
 * 权限常量定义
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
  // 系统管理权限
  SYSTEM: {
    CONFIG: 'admin.system.config'
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
  '/dashboard/account/tenant': [PERMISSIONS.TENANT.READ]
} as const;
