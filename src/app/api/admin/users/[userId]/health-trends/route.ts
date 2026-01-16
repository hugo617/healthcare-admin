import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { healthRecords } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/admin/users/[userId]/health-trends
 * 获取用户健康趋势数据(管理端)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await auth();
    if (!user || !(await hasPermission(user, PERMISSIONS.HEALTH_RECORD.READ))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'all';

    // 构建查询条件
    const conditions = [
      eq(healthRecords.userId, parseInt(userId)),
      eq(healthRecords.isDeleted, false)
    ];

    if (startDate) {
      conditions.push(sql`${healthRecords.recordDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${healthRecords.recordDate} <= ${endDate}`);
    }

    // 查询记录
    const records = await db.query.healthRecords.findMany({
      where: and(...conditions),
      orderBy: [desc(healthRecords.recordDate)],
      limit: 365 // 最多返回一年的数据
    });

    // 按日期排序(升序)
    records.sort((a, b) => a.recordDate.localeCompare(b.recordDate));

    // 提取数据
    const dates = records.map((r) => r.recordDate);
    const bloodPressureSystolic = records.map(
      (r) => r.bloodPressure?.systolic || null
    );
    const bloodPressureDiastolic = records.map(
      (r) => r.bloodPressure?.diastolic || null
    );
    const bloodSugarFasting: number[] = [];
    const bloodSugarPostprandial: number[] = [];

    records.forEach((r) => {
      if (r.bloodSugar?.type === 'fasting') {
        bloodSugarFasting.push(r.bloodSugar.value || null);
        bloodSugarPostprandial.push(null);
      } else if (r.bloodSugar?.type === 'postprandial') {
        bloodSugarFasting.push(null);
        bloodSugarPostprandial.push(r.bloodSugar.value || null);
      } else {
        bloodSugarFasting.push(null);
        bloodSugarPostprandial.push(null);
      }
    });

    const heartRate = records.map((r) => r.heartRate || null);
    const weight = records.map((r) => r.weight?.value || null);

    // 根据type返回相应数据
    const data: any = {
      dates
    };

    if (type === 'all' || type === 'bloodPressure') {
      data.bloodPressure = {
        systolic: bloodPressureSystolic,
        diastolic: bloodPressureDiastolic
      };
    }
    if (type === 'all' || type === 'bloodSugar') {
      data.bloodSugar = {
        fasting: bloodSugarFasting,
        postprandial: bloodSugarPostprandial
      };
    }
    if (type === 'all' || type === 'heartRate') {
      data.heartRate = heartRate;
    }
    if (type === 'all' || type === 'weight') {
      data.weight = weight;
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取健康趋势数据失败:', error);
    return NextResponse.json(
      {
        error: '获取健康趋势数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
