import { db } from '@/db';
import { users, roles, permissions, systemLogs } from '@/db/schema';
import { count, sql, desc, gte } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/service/response';

export async function GET() {
  try {
    // 获取当前时间的各个时间点
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 获取基本统计
    const [
      totalUsers,
      todayUsers,
      weekUsers,
      totalRoles,
      totalPermissions,
      totalLogs,
      todayLogs,
      weekLogs
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, startOfDay)),
      db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, startOfWeek)),
      db.select({ count: count() }).from(roles),
      db.select({ count: count() }).from(permissions),
      db.select({ count: count() }).from(systemLogs),
      db
        .select({ count: count() })
        .from(systemLogs)
        .where(gte(systemLogs.createdAt, startOfDay)),
      db
        .select({ count: count() })
        .from(systemLogs)
        .where(gte(systemLogs.createdAt, startOfWeek))
    ]);

    // 获取错误日志数量
    const [errorLogs] = await db
      .select({ count: count() })
      .from(systemLogs)
      .where(sql`level = 'error'`);

    // 获取最近用户活动
    const recentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    // 获取日志级别分布
    const logLevelStats = await db
      .select({
        level: systemLogs.level,
        count: count()
      })
      .from(systemLogs)
      .groupBy(systemLogs.level)
      .orderBy(desc(count()));

    // 获取最近30天的用户注册数量 - 优化版本
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 获取所有30天内的用户，然后在内存中分组
    const usersForTrend = await db
      .select({
        id: users.id,
        createdAt: users.createdAt
      })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .orderBy(users.createdAt);

    // 按日期分组统计
    const userCountByDate = new Map<string, number>();
    usersForTrend.forEach((user) => {
      const dateKey = new Date(user.createdAt).toISOString().split('T')[0];
      userCountByDate.set(dateKey, (userCountByDate.get(dateKey) || 0) + 1);
    });

    // 生成30天数据
    const userTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      userTrend.push({
        date: dateKey,
        users: userCountByDate.get(dateKey) || 0
      });
    }

    // 计算增长率（简化版）
    const userGrowthRate =
      weekUsers[0].count > 0
        ? `+${((todayUsers[0].count / weekUsers[0].count) * 100).toFixed(1)}%`
        : '+0%';

    return successResponse({
      overview: {
        totalUsers: totalUsers[0].count || 0,
        todayUsers: todayUsers[0].count || 0,
        weekUsers: weekUsers[0].count || 0,
        userGrowthRate,
        totalRoles: totalRoles[0].count || 0,
        totalPermissions: totalPermissions[0].count || 0,
        totalLogs: totalLogs[0].count || 0,
        todayLogs: todayLogs[0].count || 0,
        weekLogs: weekLogs[0].count || 0,
        errorLogs: errorLogs.count || 0
      },
      recentUsers,
      logLevelStats,
      userTrend
    });
  } catch (error) {
    console.error('获取dashboard统计数据失败:', error);
    return errorResponse('获取统计数据失败');
  }
}
