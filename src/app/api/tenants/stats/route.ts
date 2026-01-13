import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { tenants, users } from '@/db/schema';
import { eq, sql, count, and, isNull } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/service/response';

/**
 * 获取全局租户统计信息
 * GET /api/tenants/stats
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.TENANT.READ, undefined, request);

    // 获取所有租户的基础统计
    const allTenants = await db
      .select({
        id: tenants.id,
        status: tenants.status
      })
      .from(tenants);

    // 统计各状态租户数量
    const totalTenants = allTenants.length;
    const activeTenants = allTenants.filter(
      (t) => t.status === 'active'
    ).length;
    const inactiveTenants = allTenants.filter(
      (t) => t.status === 'inactive'
    ).length;
    const suspendedTenants = allTenants.filter(
      (t) => t.status === 'suspended'
    ).length;

    // 获取总用户数（排除已删除用户）
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(isNull(users.deletedAt));
    const totalUsers = totalUsersResult[0]?.count || 0;

    // 活跃用户数
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.status, 'active'), isNull(users.deletedAt)));
    const activeUsers = activeUsersResult[0]?.count || 0;

    // 构建响应数据
    const statistics = {
      totalTenants,
      activeTenants,
      inactiveTenants,
      suspendedTenants,
      totalUsers: Number(totalUsers),
      recentTenants: [] // 可以根据需要添加最近创建的租户
    };

    return successResponse(statistics);
  } catch (error) {
    console.error('[TENANT STATS] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : '获取统计信息失败'
    );
  }
}
