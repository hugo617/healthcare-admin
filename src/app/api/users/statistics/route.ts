import { db } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq, sql, gte, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/service/response';

export async function GET(request: Request) {
  try {
    const currentUser = getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    // 确定要查询的租户ID
    const queryTenantId =
      currentUser?.isSuperAdmin && tenantId
        ? Number(tenantId)
        : Number(currentUser?.tenantId || 1);

    const conditions = [eq(users.isDeleted, false)];

    // 如果不是超级管理员，只能查看自己租户的统计
    if (!currentUser?.isSuperAdmin) {
      conditions.push(eq(users.tenantId, BigInt(queryTenantId)));
    } else if (tenantId) {
      conditions.push(eq(users.tenantId, BigInt(queryTenantId)));
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 新增：今日和本周时间计算
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // 本周一
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalResult,
      activeResult,
      inactiveResult,
      lockedResult,
      recentLoginsResult,
      thisMonthUsersResult,
      lastMonthUsersResult,
      todayUsersResult,
      weekUsersResult,
      tenantInfoResult
    ] = await Promise.all([
      // 总用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions)),

      // 活跃用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions, eq(users.status, 'active'))),

      // 非活跃用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions, eq(users.status, 'inactive'))),

      // 锁定用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions, eq(users.status, 'locked'))),

      // 近30天登录用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions, gte(users.lastLoginAt, thirtyDaysAgo))),

      // 本月新用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions, gte(users.createdAt, thisMonthStart))),

      // 上月新用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(
          and(
            ...conditions,
            gte(users.createdAt, lastMonthStart),
            sql`${users.createdAt} < ${lastMonthEnd}`
          )
        ),

      // 新增：今日新用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions, gte(users.createdAt, todayStart))),

      // 新增：本周新用户数
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(and(...conditions, gte(users.createdAt, weekStart))),

      // 租户信息
      currentUser?.isSuperAdmin && tenantId
        ? db
            .select({
              id: tenants.id,
              name: tenants.name,
              code: tenants.code
            })
            .from(tenants)
            .where(eq(tenants.id, BigInt(queryTenantId)))
            .limit(1)
        : Promise.resolve([])
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const active = Number(activeResult[0]?.count || 0);
    const inactive = Number(inactiveResult[0]?.count || 0);
    const locked = Number(lockedResult[0]?.count || 0);
    const recentLogins = Number(recentLoginsResult[0]?.count || 0);
    const thisMonthUsers = Number(thisMonthUsersResult[0]?.count || 0);
    const lastMonthUsers = Number(lastMonthUsersResult[0]?.count || 0);
    const todayUsers = Number(todayUsersResult[0]?.count || 0);
    const weekUsers = Number(weekUsersResult[0]?.count || 0);

    // 计算增长率
    const monthlyGrowthRate =
      lastMonthUsers > 0
        ? Math.round(
            ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 * 100
          ) / 100
        : 0;

    // 计算活跃率
    const activeRate =
      total > 0 ? Math.round((active / total) * 100 * 100) / 100 : 0;

    const statistics = {
      overview: {
        total,
        active,
        inactive,
        locked,
        activeRate
      },
      engagement: {
        recentLogins,
        recentLoginRate:
          total > 0 ? Math.round((recentLogins / total) * 100 * 100) / 100 : 0
      },
      growth: {
        thisMonth: thisMonthUsers,
        lastMonth: lastMonthUsers,
        growthRate: monthlyGrowthRate,
        today: todayUsers,
        week: weekUsers
      },
      distribution: {
        active: active,
        inactive: inactive,
        locked: locked
      }
    };

    // 如果是超级管理员且查询了特定租户，添加租户信息
    if (currentUser?.isSuperAdmin && tenantId && tenantInfoResult.length > 0) {
      return successResponse({
        ...statistics,
        tenant: tenantInfoResult[0]
      });
    }

    return successResponse(statistics);
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return errorResponse('获取用户统计失败');
  }
}
