import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { serviceRecords, users, serviceArchives } from '@/db/schema';
import { eq, desc, and, sql, gt, count } from 'drizzle-orm';

/**
 * GET /api/admin/service-records
 * 获取服务记录列表(管理端)
 */
export async function GET(request: NextRequest) {
  try {
    // Pass request to auth() to read Authorization header
    const session = await auth(request);

    if (
      !session ||
      !(await hasPermission(session, PERMISSIONS.SERVICE_RECORD.READ))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const archiveId = searchParams.get('archiveId');
    const customerNo = searchParams.get('customerNo');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 构建查询条件
    const conditions = [eq(serviceRecords.isDeleted, false)];

    if (userId) {
      conditions.push(eq(serviceRecords.userId, parseInt(userId)));
    }
    if (archiveId) {
      conditions.push(eq(serviceRecords.archiveId, BigInt(archiveId)));
    }
    if (customerNo) {
      // 通过档案编号筛选
      const archives = await db.query.serviceArchives.findMany({
        where: eq(serviceArchives.customerNo, customerNo),
        columns: { id: true }
      });
      if (archives.length > 0) {
        conditions.push(sql`${serviceRecords.archiveId} = ${archives[0].id}`);
      } else {
        // 没有找到匹配的档案，返回空结果
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }
    }
    if (status && status !== 'all') {
      conditions.push(eq(serviceRecords.status, status));
    }
    if (startDate) {
      conditions.push(sql`${serviceRecords.serviceDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${serviceRecords.serviceDate} <= ${endDate}`);
    }

    // 查询总数
    const totalResult = await db
      .select({ count: count() })
      .from(serviceRecords)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // 查询数据(包含关联)
    const records = await db.query.serviceRecords.findMany({
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
        },
        archive: {
          columns: {
            id: true,
            customerNo: true,
            basicInfo: true
          }
        }
      },
      orderBy:
        sortOrder === 'asc'
          ? [serviceRecords[sortBy] || serviceRecords.createdAt]
          : [desc(serviceRecords[sortBy] || serviceRecords.createdAt)],
      limit,
      offset: (page - 1) * limit
    });

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecords = records.map((record) => ({
      ...record,
      id: record.id.toString(),
      archiveId: record.archiveId.toString(),
      archive:
        record.archive && typeof record.archive.id === 'bigint'
          ? {
              ...record.archive,
              id: record.archive.id.toString()
            }
          : record.archive
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
    console.error('获取服务记录失败:', error);
    return NextResponse.json(
      {
        error: '获取服务记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/service-records
 * 创建服务记录(管理端)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (
      !session ||
      !(await hasPermission(session, PERMISSIONS.SERVICE_RECORD.CREATE))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentUser = session.user;

    const body = await request.json();
    const {
      archiveId,
      serviceDate,
      bloodPressure,
      discomfort,
      consultant,
      duration,
      temperature,
      feedback
    } = body;

    // 验证必填字段
    if (!archiveId || !serviceDate) {
      return NextResponse.json(
        { error: '档案ID和服务日期为必填项' },
        { status: 400 }
      );
    }

    // 检查血压是否过高
    if (bloodPressure) {
      const { systolic, diastolic } = bloodPressure;
      if (systolic >= 160 || diastolic >= 100) {
        return NextResponse.json(
          { error: '血压过高，禁止创建理疗记录' },
          { status: 400 }
        );
      }
    }

    // 获取档案信息
    const archive = await db.query.serviceArchives.findFirst({
      where: eq(serviceArchives.id, BigInt(archiveId))
    });

    if (!archive) {
      return NextResponse.json({ error: '服务档案不存在' }, { status: 404 });
    }

    // 自动计算服务次数
    const maxCountResult = await db
      .select({ maxCount: sql<number>`MAX(count)` })
      .from(serviceRecords)
      .where(eq(serviceRecords.archiveId, BigInt(archiveId)));

    const nextCount = (maxCountResult[0]?.maxCount || 0) + 1;

    // 创建服务记录
    const newRecord = await db
      .insert(serviceRecords)
      .values({
        userId: archive.userId,
        archiveId: BigInt(archiveId),
        count: nextCount,
        serviceDate,
        bloodPressure: bloodPressure || {},
        discomfort: discomfort || {},
        consultant: consultant || {},
        duration: duration || 45,
        temperature: temperature || 45,
        feedback: feedback || '',
        status: 'completed',
        createdBy: currentUser.id,
        updatedBy: currentUser.id
      })
      .returning();

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecord = {
      ...newRecord[0],
      id: newRecord[0].id.toString(),
      archiveId: newRecord[0].archiveId.toString()
    };

    return NextResponse.json({
      success: true,
      data: serializedRecord,
      message: '服务记录创建成功'
    });
  } catch (error) {
    console.error('创建服务记录失败:', error);
    return NextResponse.json(
      {
        error: '创建服务记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
