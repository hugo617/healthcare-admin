/**
 * 权限常量定义
 * 从 permission-constants.ts 重新导出，保持向后兼容
 */
export { PERMISSIONS, ROUTE_PERMISSIONS } from './permission-constants';

// ==================== Permission Helper Functions ====================

/**
 * Type alias for Session from auth module
 */
export type PermissionSession = {
  user: {
    id: number;
    isSuperAdmin: boolean;
  };
};

/**
 * Check if a user has a specific permission
 * This is a convenience wrapper that works with the Session object from auth()
 *
 * @param session Session object from auth() or null
 * @param permissionCode Permission code to check
 * @returns Promise<boolean> true if user has permission
 */
export async function hasPermission(
  session: PermissionSession | null,
  permissionCode: string
): Promise<boolean> {
  // If no session, deny access
  if (!session || !session.user) {
    return false;
  }

  const user = session.user;

  // Super admins have all permissions
  if (user.isSuperAdmin) {
    return true;
  }

  // Import and use the server-side permission check
  const { hasPermission: checkServerPermission } = await import(
    './server-permissions'
  );
  return checkServerPermission(permissionCode, user.id);
}

/**
 * Check if a user has any of the specified permissions
 *
 * @param session Session object from auth() or null
 * @param permissionCodes Array of permission codes to check
 * @returns Promise<boolean> true if user has any of the permissions
 */
export async function hasAnyPermission(
  session: PermissionSession | null,
  permissionCodes: string[]
): Promise<boolean> {
  // If no session, deny access
  if (!session || !session.user) {
    return false;
  }

  const user = session.user;

  // Super admins have all permissions
  if (user.isSuperAdmin) {
    return true;
  }

  // Import and use the server-side permission check
  const { hasAnyPermission: checkAnyServerPermission } = await import(
    './server-permissions'
  );
  return checkAnyServerPermission(permissionCodes, user.id);
}

/**
 * Check if a user has all of the specified permissions
 *
 * @param session Session object from auth() or null
 * @param permissionCodes Array of permission codes to check
 * @returns Promise<boolean> true if user has all of the permissions
 */
export async function hasAllPermissions(
  session: PermissionSession | null,
  permissionCodes: string[]
): Promise<boolean> {
  // If no session, deny access
  if (!session || !session.user) {
    return false;
  }

  const user = session.user;

  // Super admins have all permissions
  if (user.isSuperAdmin) {
    return true;
  }

  // Import and use the server-side permission check
  const { hasAllPermissions: checkAllServerPermissions } = await import(
    './server-permissions'
  );
  return checkAllServerPermissions(permissionCodes, user.id);
}
