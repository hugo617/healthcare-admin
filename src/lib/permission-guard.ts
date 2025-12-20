import { auth, verifyToken } from '@/lib/auth';
import { db } from '@/db';
import { users, roles, rolePermissions, permissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { TenantContext } from '@/lib/tenant-context';

/**
 * 服务端权限守卫
 * 用于在 Server Action 或 API 路由中检查权限
 */

/**
 * 要求用户具有指定权限
 * @param permissionCode 权限代码
 * @param resourceId 资源ID（可选，用于数据权限检查）
 * @throws UnauthorizedError 当用户未登录时
 * @throws ForbiddenError 当权限不足时
 */
export async function requirePermission(
  permissionCode: string,
  resourceId?: string,
  request?: Request
): Promise<void> {
  let session = null;

  // 如果提供了request对象，尝试从header中获取token
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = verifyToken(token);
      if (user) {
        session = { user };
      }
    }
  }

  // 如果没有从header获取到，尝试从cookie获取
  if (!session) {
    session = await auth();
  }

  if (!session?.user) {
    throw new UnauthorizedError('User not authenticated');
  }

  // 检查是否为超级管理员
  if (session.user.isSuperAdmin) {
    return;
  }

  // 检查基础权限
  const hasPermission = await checkUserPermission(session.user.id, permissionCode);

  if (!hasPermission) {
    throw new ForbiddenError(`Permission required: ${permissionCode}`);
  }

  // TODO: 如果需要数据权限检查，在这里实现
  if (resourceId) {
    const hasDataPermission = await checkDataPermission(
      session.user.id,
      permissionCode,
      resourceId
    );

    if (!hasDataPermission) {
      throw new ForbiddenError(`Data access denied for resource: ${resourceId}`);
    }
  }
}

/**
 * 检查用户是否具有指定权限
 * @param userId 用户ID
 * @param permissionCode 权限代码
 * @returns 是否有权限
 */
async function checkUserPermission(
  userId: number,
  permissionCode: string
): Promise<boolean> {
  try {
    // 获取当前租户ID
    const tenantId = TenantContext.getCurrentTenantId();
    if (!tenantId) {
      console.warn('No tenant context set for permission check');
      return false;
    }

    // 获取用户角色（确保用户属于当前租户）
    const userRoleQuery = db
      .select({
        roleId: roles.id
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId)
      ))
      .limit(1);

    const userRole = await userRoleQuery;

    if (!userRole.length) {
      return false;
    }

    const roleId = userRole[0].roleId;

    // 检查角色权限（确保权限属于当前租户）
    const permissionQuery = db
      .select({
        permissionCode: permissions.code
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.tenantId, tenantId),
        eq(permissions.status, 'active')
      ));

    const userPermissions = await permissionQuery;

    return userPermissions.some(p => p.permissionCode === permissionCode);
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * 检查数据权限（暂时简化实现）
 * @param userId 用户ID
 * @param permissionCode 权限代码
 * @param resourceId 资源ID
 * @returns 是否有数据权限
 */
async function checkDataPermission(
  userId: number,
  permissionCode: string,
  resourceId: string
): Promise<boolean> {
  // TODO: 实现数据权限检查逻辑
  // 这里可以根据业务需求实现复杂的数据权限控制
  // 例如：只能访问自己创建的数据、只能访问本部门的数据等

  // 暂时返回 true，后续完善
  return true;
}

/**
 * 检查用户是否为超级管理员
 * @param userId 用户ID
 * @returns 是否为超级管理员
 */
export async function isSuperAdmin(userId: number): Promise<boolean> {
  try {
    const result = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result[0]?.isSuperAdmin || false;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

/**
 * 获取用户权限列表
 * @param userId 用户ID
 * @returns 权限代码列表
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    // 获取用户角色
    const userRoleQuery = db
      .select({
        roleId: roles.id
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    const userRole = await userRoleQuery;

    if (!userRole.length) {
      return [];
    }

    const roleId = userRole[0].roleId;

    // 获取角色权限
    const permissionQuery = db
      .select({
        permissionCode: permissions.code
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        eq(rolePermissions.roleId, roleId)
      );

    const userPermissions = await permissionQuery;

    return userPermissions.map(p => p.permissionCode);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * 权限守卫装饰器
 */
export function withPermission(permissionCode: string, resourceId?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await requirePermission(permissionCode, resourceId);
      return await method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 未授权错误
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 权限不足错误
 */
export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}