import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions-server';
import { PERMISSIONS } from '@/lib/permissions-server';
import { db } from '@/db';
import { healthArchives, users } from '@/db/schema';
import { eq, and, sql, count, desc } from 'drizzle-orm';

/**
 * GET /api/admin/health-records/statistics
 * 获取健康档案统计信息(管理端)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user || !(await hasPermission(user, PERMISSIONS.HEALTH_RECORD.READ))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // 基础条件
    const baseConditions = [eq(healthArchives.isDeleted, false)];

    if (userId) {
      baseConditions.push(eq(healthArchives.userId, parseInt(userId)));
    }

    // 总档案数统计
    const totalResult = await db
      .select({ count: count() })
      .from(healthArchives)
      .where(and(...baseConditions));

    // 本月新增统计
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthResult = await db
      .select({ count: count() })
      .from(healthArchives)
      .where(
        and(...baseConditions, sql`${healthArchives.createdAt} >= ${thisMonth}`)
      );

    // 活跃档案数统计
    const activeResult = await db
      .select({ count: count() })
      .from(healthArchives)
      .where(and(...baseConditions, eq(healthArchives.status, 'active')));

    // 获取按用户分组的统计
    const byUserResult = await db
      .select({
        userId: healthArchives.userId,
        count: count(),
        lastCreatedDate: sql<string>`MAX(${healthArchives.createdAt})`
      })
      .from(healthArchives)
      .where(and(...baseConditions))
      .groupBy(healthArchives.userId)
      .orderBy(desc(count()))
      .limit(10);

    // 获取用户详情
    const byUser = await Promise.all(
      byUserResult.map(async (item) => {
        const userRecord = await db.query.users.findFirst({
          where: eq(users.id, item.userId),
          columns: {
            id: true,
            username: true,
            realName: true
          }
        });

        return {
          userId: item.userId,
          userName: userRecord?.realName || userRecord?.username || '',
          archiveCount: item.count || 0,
          lastCreatedDate: item.lastCreatedDate || ''
        };
      })
    );

    const total = Number(totalResult[0]?.count || 0);
    const thisMonthCount = Number(thisMonthResult[0]?.count || 0);
    const activeCount = Number(activeResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalArchives: total,
          thisMonthArchives: thisMonthCount,
          activeArchives: activeCount
        },
        byUser
      }
    });
  } catch (error) {
    console.error('获取健康档案统计失败:', error);
    return NextResponse.json(
      {
        error: '获取健康档案统计失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
