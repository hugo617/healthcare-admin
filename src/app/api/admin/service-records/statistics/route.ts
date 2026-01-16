import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { serviceRecords, serviceArchives } from '@/db/schema';
import { eq, and, sql, gte, lte, count, desc } from 'drizzle-orm';

/**
 * GET /api/admin/service-records/statistics
 * 获取服务记录统计信息(管理端)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (
      !user ||
      !(await hasPermission(user, PERMISSIONS.SERVICE_RECORD.READ))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 构建日期条件
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0].replace(/-/g, '/');

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthStr = thisMonth
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '/');

    // 基础条件
    const baseConditions = [eq(serviceRecords.isDeleted, false)];

    // 总数统计
    const totalResult = await db
      .select({ count: count() })
      .from(serviceRecords)
      .where(and(...baseConditions));

    // 今日统计
    const todayResult = await db
      .select({ count: count() })
      .from(serviceRecords)
      .where(
        and(...baseConditions, sql`${serviceRecords.serviceDate} = ${todayStr}`)
      );

    // 本月统计
    const thisMonthResult = await db
      .select({ count: count() })
      .from(serviceRecords)
      .where(
        and(
          ...baseConditions,
          sql`${serviceRecords.serviceDate} >= ${thisMonthStr}`
        )
      );

    // 已完成统计
    const completedResult = await db
      .select({ count: count() })
      .from(serviceRecords)
      .where(and(...baseConditions, eq(serviceRecords.status, 'completed')));

    const total = totalResult[0]?.count || 0;
    const todayCount = todayResult[0]?.count || 0;
    const thisMonthCount = thisMonthResult[0]?.count || 0;
    const completedCount = completedResult[0]?.count || 0;

    // 获取按档案分组的统计
    const byArchiveResult = await db
      .select({
        archiveId: serviceRecords.archiveId,
        count: count(),
        lastServiceDate: sql<string>`MAX(${serviceRecords.serviceDate})`
      })
      .from(serviceRecords)
      .where(and(...baseConditions))
      .groupBy(serviceRecords.archiveId)
      .orderBy(desc(count()))
      .limit(10);

    // 获取档案详情
    const byArchive = await Promise.all(
      byArchiveResult.map(async (item) => {
        const archive = await db.query.serviceArchives.findFirst({
          where: eq(serviceArchives.id, item.archiveId),
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                realName: true
              }
            }
          }
        });

        return {
          archiveId: item.archiveId?.toString() || '',
          customerNo: archive?.customerNo || '',
          userName:
            archive?.user && 'realName' in archive.user
              ? archive.user.realName || archive.user.username || ''
              : '',
          count: item.count || 0,
          lastServiceDate: item.lastServiceDate || ''
        };
      })
    );

    // 获取最近7天的趋势数据
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '/');

      const dayResult = await db
        .select({ count: count() })
        .from(serviceRecords)
        .where(
          and(
            ...baseConditions,
            sql`${serviceRecords.serviceDate} = ${dateStr}`
          )
        );

      trends.push({
        date: dateStr,
        count: dayResult[0]?.count || 0
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total,
          thisMonth: thisMonthCount,
          today: todayCount,
          completed: completedCount,
          completionRate:
            total > 0 ? Math.round((completedCount / total) * 100) : 0
        },
        serviceTrends: trends,
        byArchive
      }
    });
  } catch (error) {
    console.error('获取服务记录统计失败:', error);
    return NextResponse.json(
      {
        error: '获取服务记录统计失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
