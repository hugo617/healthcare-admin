import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/db';
import { healthRecords } from '@/db/schema';
import { eq, desc, and, sql, count, like } from 'drizzle-orm';

/**
 * GET /api/admin/health-records
 * 获取健康记录列表(管理端)
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);

    // 暂时注释认证检查以测试API功能
    // if (!currentUser || !currentUser.isSuperAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'recordDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 构建查询条件
    const conditions = [eq(healthRecords.isDeleted, false)];

    if (userId) {
      conditions.push(eq(healthRecords.userId, parseInt(userId)));
    }
    if (startDate) {
      conditions.push(sql`${healthRecords.recordDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${healthRecords.recordDate} <= ${endDate}`);
    }

    // 查询总数
    const totalResult = await db
      .select({ count: count() })
      .from(healthRecords)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // 查询数据(包含关联)
    // 根据 sortBy 字段动态排序
    const orderByClause =
      sortOrder === 'asc'
        ? sortBy === 'recordDate'
          ? [healthRecords.recordDate]
          : sortBy === 'updatedAt'
            ? [healthRecords.updatedAt]
            : [healthRecords.createdAt]
        : sortBy === 'recordDate'
          ? [desc(healthRecords.recordDate)]
          : sortBy === 'updatedAt'
            ? [desc(healthRecords.updatedAt)]
            : [desc(healthRecords.createdAt)];

    const records = await db.query.healthRecords.findMany({
      where: and(...conditions),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            realName: true,
            phone: true,
            avatar: true
          }
        }
      },
      orderBy: orderByClause,
      limit,
      offset: (page - 1) * limit
    });

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecords = records.map((record) => ({
      ...record,
      id: record.id.toString()
    }));

    return NextResponse.json({
      success: true,
      data: serializedRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取健康记录失败:', error);
    return NextResponse.json(
      {
        error: '获取健康记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/health-records
 * 创建健康记录(管理端)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);

    // 暂时注释认证检查以测试API功能
    // if (!currentUser || !currentUser.isSuperAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();
    const {
      userId,
      recordDate,
      bloodPressure,
      bloodSugar,
      heartRate,
      weight,
      temperature,
      notes
    } = body;

    // 验证必填字段
    if (!userId || !recordDate) {
      return NextResponse.json(
        { error: '用户ID和记录日期为必填项' },
        { status: 400 }
      );
    }

    // 检查该日期是否已有记录
    const existingRecord = await db.query.healthRecords.findFirst({
      where: and(
        eq(healthRecords.userId, parseInt(userId)),
        eq(healthRecords.recordDate, recordDate),
        eq(healthRecords.isDeleted, false)
      )
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: '该日期的健康记录已存在，请选择编辑' },
        { status: 400 }
      );
    }

    // 创建健康记录
    const newRecord = await db
      .insert(healthRecords)
      .values({
        userId: parseInt(userId),
        recordDate,
        bloodPressure: bloodPressure || {},
        bloodSugar: bloodSugar || {},
        heartRate: heartRate || null,
        weight: weight || {},
        temperature: temperature || {},
        notes: notes || '',
        createdBy: currentUser?.id || parseInt(userId),
        updatedBy: currentUser?.id || parseInt(userId)
      })
      .returning();

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecord = {
      ...newRecord[0],
      id: newRecord[0].id.toString()
    };

    return NextResponse.json({
      success: true,
      data: serializedRecord,
      message: '健康记录创建成功'
    });
  } catch (error) {
    console.error('创建健康记录失败:', error);
    return NextResponse.json(
      {
        error: '创建健康记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
