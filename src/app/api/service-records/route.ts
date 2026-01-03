import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceRecords, serviceArchives } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import {
  createServiceRecordSchema,
  serviceRecordQuerySchema
} from '@/lib/validators/service-record';
import { auth } from '@/lib/auth';
import { serializeServiceRecordList } from '@/lib/utils/serialize';

/**
 * GET /api/service-records
 * 获取当前登录用户的服务记录列表
 * 支持按档案ID、日期范围筛选
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 获取认证用户
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // 3. 验证查询参数
    const validatedQuery = serviceRecordQuerySchema.safeParse(query);

    if (!validatedQuery.success) {
      return NextResponse.json(
        {
          code: 400,
          message: '查询参数验证失败',
          errors: validatedQuery.error.errors
        },
        { status: 400 }
      );
    }

    const {
      page = 1,
      pageSize = 10,
      archiveId,
      startDate,
      endDate,
      status = 'active'
    } = validatedQuery.data;

    // 4. 构建查询条件
    const conditions = [
      eq(serviceRecords.userId, session.user.id),
      eq(serviceRecords.isDeleted, false),
      status ? eq(serviceRecords.status, status as any) : undefined
    ].filter(Boolean);

    // 按档案ID筛选
    if (archiveId) {
      conditions.push(eq(serviceRecords.archiveId, BigInt(archiveId)));
    }

    // 日期范围筛选
    if (startDate) {
      conditions.push(gte(serviceRecords.serviceDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(serviceRecords.serviceDate, endDate));
    }

    // 5. 查询总数
    const [{ count }] = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(serviceRecords)
      .where(and(...conditions));

    // 6. 查询分页数据
    const offset = (page - 1) * pageSize;
    const list = await db
      .select()
      .from(serviceRecords)
      .where(and(...conditions))
      .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 7. 序列化数据
    const serializedList = serializeServiceRecordList(list);

    // 8. 返回结果
    return NextResponse.json({
      code: 0,
      data: {
        list: serializedList,
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize)
      },
      message: '查询成功'
    });
  } catch (error: any) {
    console.error('查询服务记录列表失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: error.message || '查询失败'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/service-records
 * 创建新的服务记录
 * 自动计算服务次数(同一档案下的最大count + 1)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取认证用户
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await request.json();

    // 3. 验证请求数据
    const validatedData = createServiceRecordSchema.safeParse(body);

    if (!validatedData.success) {
      console.error('Zod验证错误详情:', validatedData.error.errors);
      return NextResponse.json(
        {
          code: 400,
          message: '数据验证失败',
          errors: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    // 4. 确定档案ID
    let archiveId = body.archiveId;

    if (!archiveId) {
      // 如果没有提供archiveId，则查询用户的默认档案(最新的)
      const [defaultArchive] = await db
        .select()
        .from(serviceArchives)
        .where(
          and(
            eq(serviceArchives.userId, session.user.id),
            eq(serviceArchives.isDeleted, false),
            eq(serviceArchives.status, 'active')
          )
        )
        .orderBy(desc(serviceArchives.createdAt))
        .limit(1);

      if (!defaultArchive) {
        return NextResponse.json(
          {
            code: 400,
            message: '未找到服务档案，请先创建档案'
          },
          { status: 400 }
        );
      }

      archiveId = defaultArchive.id.toString();
    }

    // 5. 验证档案是否存在且属于当前用户
    const [archive] = await db
      .select()
      .from(serviceArchives)
      .where(
        and(
          eq(serviceArchives.id, BigInt(archiveId)),
          eq(serviceArchives.userId, session.user.id),
          eq(serviceArchives.isDeleted, false)
        )
      )
      .limit(1);

    if (!archive) {
      return NextResponse.json(
        {
          code: 404,
          message: '服务档案不存在或无权访问'
        },
        { status: 404 }
      );
    }

    // 6. 计算服务次数(该档案下的最大count + 1)
    const [maxCountResult] = await db
      .select({ maxCount: sql<number>`MAX(${serviceRecords.count})` })
      .from(serviceRecords)
      .where(
        and(
          eq(serviceRecords.archiveId, BigInt(archiveId)),
          eq(serviceRecords.isDeleted, false)
        )
      );

    const nextCount = (maxCountResult?.maxCount || 0) + 1;

    // 7. 生成服务日期（如果没有提供）
    const now = new Date();
    const serviceDate =
      body.serviceDate ||
      `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    // 8. 创建服务记录
    const newRecord = {
      ...validatedData.data,
      archiveId: BigInt(archiveId),
      userId: session.user.id,
      count: nextCount,
      serviceDate,
      createdBy: session.user.id,
      updatedBy: session.user.id
    };

    const [createdRecord] = await db
      .insert(serviceRecords)
      .values(newRecord)
      .returning();

    // 9. 序列化并返回
    const serializedRecord = {
      ...createdRecord,
      id: createdRecord.id.toString(),
      archiveId: createdRecord.archiveId.toString(),
      createdBy: createdRecord.createdBy?.toString() || null,
      updatedBy: createdRecord.updatedBy?.toString() || null
    };

    return NextResponse.json(
      {
        code: 0,
        data: serializedRecord,
        message: '创建成功'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('创建服务记录失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: error.message || '创建失败'
      },
      { status: 500 }
    );
  }
}
