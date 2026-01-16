import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { healthRecords, users } from '@/db/schema';
import { eq, and, sql, count, desc, avg } from 'drizzle-orm';

/**
 * GET /api/admin/health-records/statistics
 * 获取健康记录统计信息(管理端)
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
    const baseConditions = [eq(healthRecords.isDeleted, false)];

    if (userId) {
      baseConditions.push(eq(healthRecords.userId, parseInt(userId)));
    }

    // 总数统计
    const totalResult = await db
      .select({ count: count() })
      .from(healthRecords)
      .where(and(...baseConditions));

    // 本月统计
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthStr = thisMonth.toISOString().split('T')[0];

    const thisMonthResult = await db
      .select({ count: count() })
      .from(healthRecords)
      .where(
        and(
          ...baseConditions,
          sql`${healthRecords.recordDate} >= ${thisMonthStr}`
        )
      );

    // 平均血压统计
    const avgBloodPressureResult = await db
      .select({
        avgSystolic: avg(
          sql`CAST(${healthRecords.bloodPressure}->>'systolic' AS INTEGER)`
        ),
        avgDiastolic: avg(
          sql`CAST(${healthRecords.bloodPressure}->>'diastolic' AS INTEGER)`
        )
      })
      .from(healthRecords)
      .where(
        and(
          ...baseConditions,
          sql`(${healthRecords.bloodPressure}->>'systolic') IS NOT NULL`
        )
      );

    // 平均血糖统计
    const avgBloodSugarResult = await db
      .select({
        avgValue: avg(
          sql`CAST(${healthRecords.bloodSugar}->>'value' AS NUMERIC)`
        )
      })
      .from(healthRecords)
      .where(
        and(
          ...baseConditions,
          sql`(${healthRecords.bloodSugar}->>'value') IS NOT NULL`
        )
      );

    // 平均心率统计
    const avgHeartRateResult = await db
      .select({ avgValue: avg(healthRecords.heartRate) })
      .from(healthRecords)
      .where(
        and(...baseConditions, sql`${healthRecords.heartRate} IS NOT NULL`)
      );

    // 平均体重统计
    const avgWeightResult = await db
      .select({
        avgValue: avg(sql`CAST(${healthRecords.weight}->>'value' AS NUMERIC)`)
      })
      .from(healthRecords)
      .where(
        and(
          ...baseConditions,
          sql`(${healthRecords.weight}->>'value') IS NOT NULL`
        )
      );

    // 获取最新记录
    const latestRecord = await db.query.healthRecords.findFirst({
      where: and(...baseConditions),
      orderBy: [desc(healthRecords.recordDate)],
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

    // 获取按用户分组的统计
    const byUserResult = await db
      .select({
        userId: healthRecords.userId,
        count: count(),
        lastRecordDate: sql<string>`MAX(${healthRecords.recordDate})`
      })
      .from(healthRecords)
      .where(and(...baseConditions))
      .groupBy(healthRecords.userId)
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
          recordCount: item.count || 0,
          lastRecordDate: item.lastRecordDate || ''
        };
      })
    );

    const total = totalResult[0]?.count || 0;
    const thisMonthCount = thisMonthResult[0]?.count || 0;

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedLatestRecord = latestRecord
      ? {
          ...latestRecord,
          id: latestRecord.id.toString()
        }
      : null;

    // 处理 avg 结果（SQL avg() 返回字符串类型）
    const avgSystolic = Number(avgBloodPressureResult[0]?.avgSystolic || 0);
    const avgDiastolic = Number(avgBloodPressureResult[0]?.avgDiastolic || 0);
    const avgBloodSugar = Number(avgBloodSugarResult[0]?.avgValue || 0);
    const avgHeartRate = Number(avgHeartRateResult[0]?.avgValue || 0);
    const avgWeight = Number(avgWeightResult[0]?.avgValue || 0);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRecords: total,
          thisMonthRecords: thisMonthCount,
          avgBloodPressure: {
            systolic: Math.round(avgSystolic),
            diastolic: Math.round(avgDiastolic)
          },
          avgBloodSugar: Math.round(avgBloodSugar * 10) / 10,
          avgHeartRate: Math.round(avgHeartRate),
          avgWeight: Math.round(avgWeight * 10) / 10
        },
        latestRecord: serializedLatestRecord,
        byUser
      }
    });
  } catch (error) {
    console.error('获取健康记录统计失败:', error);
    return NextResponse.json(
      {
        error: '获取健康记录统计失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
