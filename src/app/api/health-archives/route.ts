import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { healthArchives } from '@/db/schema';
import { eq, and, gte, lte, like, desc, sql } from 'drizzle-orm';
import {
  healthArchiveQuerySchema,
  createHealthArchiveSchema
} from '@/lib/validators/health-archive';
import { successResponse, errorResponse } from '@/service/response';
import { auth } from '@/lib/auth';
import { generateCustomerNo } from '@/lib/utils/customer-no';
import {
  serializeHealthArchive,
  serializeHealthArchiveList
} from '@/lib/utils/serialize';

/**
 * GET /api/health-archives
 * 获取当前登录用户的健康档案列表
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
    const validatedQuery = healthArchiveQuerySchema.parse(query);

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
      eq(healthArchives.userId, session.user.id), // 核心: 只查询当前用户的档案
      eq(healthArchives.isDeleted, false),
      status ? eq(healthArchives.status, status as any) : undefined
    ].filter(Boolean);

    // 客户编号模糊搜索
    if (customerNo) {
      conditions.push(like(healthArchives.customerNo, `%${customerNo}%`));
    }

    // 姓名搜索(在JSONB中)
    if (name) {
      conditions.push(
        sql`${healthArchives.basicInfo}->>'name' ILIKE ${`%${name}%`}`
      );
    }

    // 日期范围
    if (startDate) {
      conditions.push(gte(healthArchives.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(healthArchives.createdAt, new Date(endDate)));
    }

    // 5. 查询总数
    const [{ count }] = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(healthArchives)
      .where(and(...conditions));

    // 6. 查询分页数据
    const offset = (page - 1) * pageSize;
    const list = await db
      .select()
      .from(healthArchives)
      .where(and(...conditions))
      .orderBy(desc(healthArchives.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 7. 序列化数据（转换BigInt等）
    const serializedList = serializeHealthArchiveList(list);

    // 8. 返回结果
    return successResponse({
      list: serializedList,
      total: Number(count),
      page,
      pageSize,
      totalPages: Math.ceil(Number(count) / pageSize)
    });
  } catch (error: any) {
    console.error('查询健康档案列表失败:', error);
    return errorResponse(error.message || '查询失败');
  }
}

/**
 * POST /api/health-archives
 * 创建新的健康档案
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
    const validatedData = createHealthArchiveSchema.parse(body);

    // 4. 生成客户编号(如果没有提供)
    const customerNo =
      validatedData.customerNo || (await generateCustomerNo(session.user.id));

    // 5. 创建档案 - 使用当前用户的user_id
    const [newArchive] = await db
      .insert(healthArchives)
      .values({
        ...validatedData,
        userId: session.user.id, // 核心: 档案属于当前用户
        customerNo,
        createdBy: session.user.id,
        updatedBy: session.user.id
      })
      .returning();

    // 6. 序列化数据并返回
    const serializedArchive = serializeHealthArchive(newArchive);
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

    console.error('创建健康档案失败:', error);
    return errorResponse(error.message || '创建失败');
  }
}
