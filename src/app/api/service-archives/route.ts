import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceArchives } from '@/db/schema';
import { eq, and, gte, lte, like, desc, sql } from 'drizzle-orm';
import {
  serviceArchiveQuerySchema,
  createServiceArchiveSchema
} from '@/lib/validators/service-archive';
import { successResponse, errorResponse } from '@/service/response';
import { auth } from '@/lib/auth';
import { generateCustomerNo } from '@/lib/utils/customer-no';
import {
  serializeServiceArchive,
  serializeServiceArchiveList
} from '@/lib/utils/serialize';

/**
 * GET /api/service-archives
 * 获取当前登录用户的服务档案列表
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 获取认证用户信息
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
    const validatedQuery = serviceArchiveQuerySchema.parse(query);

    const {
      page = 1,
      pageSize = 10,
      customerNo,
      name,
      status = 'active',
      startDate,
      endDate
    } = validatedQuery;

    // 4. 构建查询条件 - 必须包含user_id过滤
    const conditions = [
      eq(serviceArchives.userId, session.user.id), // 核心: 只查询当前用户的档案
      eq(serviceArchives.isDeleted, false),
      status ? eq(serviceArchives.status, status as any) : undefined
    ].filter(Boolean);

    // 客户编号模糊搜索
    if (customerNo) {
      conditions.push(like(serviceArchives.customerNo, `%${customerNo}%`));
    }

    // 姓名搜索(在JSONB中)
    if (name) {
      conditions.push(
        sql`${serviceArchives.basicInfo}->>'name' ILIKE ${`%${name}%`}`
      );
    }

    // 日期范围
    if (startDate) {
      conditions.push(gte(serviceArchives.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(serviceArchives.createdAt, new Date(endDate)));
    }

    // 5. 查询总数
    const [{ count }] = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(serviceArchives)
      .where(and(...conditions));

    // 6. 查询分页数据
    const offset = (page - 1) * pageSize;
    const list = await db
      .select()
      .from(serviceArchives)
      .where(and(...conditions))
      .orderBy(desc(serviceArchives.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 7. 序列化数据（转换BigInt等）
    const serializedList = serializeServiceArchiveList(list);

    // 8. 返回结果
    return successResponse({
      list: serializedList,
      total: Number(count),
      page,
      pageSize,
      totalPages: Math.ceil(Number(count) / pageSize)
    });
  } catch (error: any) {
    console.error('查询服务档案列表失败:', error);
    return errorResponse(error.message || '查询失败');
  }
}

/**
 * POST /api/service-archives
 * 创建新的服务档案
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

    // 3. 验证数据
    const validatedData = createServiceArchiveSchema.parse(body);

    // 4. 生成客户编号(如果没有提供)
    const customerNo =
      validatedData.customerNo || (await generateCustomerNo(session.user.id));

    // 5. 创建档案 - 使用当前用户的user_id
    const [newArchive] = await db
      .insert(serviceArchives)
      .values({
        ...validatedData,
        userId: session.user.id, // 核心: 档案属于当前用户
        customerNo,
        createdBy: session.user.id,
        updatedBy: session.user.id
      })
      .returning();

    // 6. 序列化数据并返回
    const serializedArchive = serializeServiceArchive(newArchive);
    return NextResponse.json(
      {
        code: 0,
        data: {
          id: serializedArchive.id,
          customerNo: serializedArchive.customerNo
        },
        message: '创建成功'
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Zod验证错误详情:', error.errors);
      return NextResponse.json(
        {
          code: 400,
          message: '数据验证失败',
          errors: error.errors
        },
        { status: 400 }
      );
    }

    console.error('创建服务档案失败:', error);
    return errorResponse(error.message || '创建失败');
  }
}
