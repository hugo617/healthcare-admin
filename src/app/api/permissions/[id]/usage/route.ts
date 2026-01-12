import { db } from '@/db';
import { permissions, roles, rolePermissions, users } from '@/db/schema';
import { eq, sql, and, count } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/service/response';

/**
 * GET /api/permissions/:id/usage
 * 返回权限的使用情况（角色列表、用户数量）
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return errorResponse('无效的权限 ID');
    }

    // 检查权限是否存在
    const [permission] = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        code: permissions.code
      })
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (!permission) {
      return errorResponse('权限不存在');
    }

    // 获取使用此权限的所有角色及其用户数量
    const rolesWithPermission = await db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleCode: roles.code
      })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .where(
        and(
          eq(rolePermissions.permissionId, permissionId),
          eq(roles.isDeleted, false)
        )
      );

    // 获取每个角色的用户数
    const rolesWithUserCount = await Promise.all(
      rolesWithPermission.map(async (role) => {
        const [userCountResult] = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(eq(users.roleId, role.roleId), eq(users.isDeleted, false))
          );

        return {
          id: role.roleId,
          name: role.roleName,
          code: role.roleCode,
          userCount: userCountResult?.count || 0
        };
      })
    );

    // 计算总数
    const totalRoles = rolesWithUserCount.length;
    const totalUsers = rolesWithUserCount.reduce(
      (sum, role) => sum + role.userCount,
      0
    );

    return successResponse({
      permissionId,
      permissionName: permission.name,
      permissionCode: permission.code,
      roles: rolesWithUserCount,
      totalRoles,
      totalUsers
    });
  } catch (error) {
    console.error('获取权限使用情况失败:', error);
    return errorResponse('获取权限使用情况失败');
  }
}
