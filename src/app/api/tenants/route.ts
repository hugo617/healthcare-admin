import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, systemLogs } from '@/db/schema';
import { eq, ilike, and, sql, count, desc, asc } from 'drizzle-orm';
import { Tenant, NewTenant } from '@/db/schema';
import { requirePermission } from '@/lib/permission-guard';
import { z } from 'zod';

/**
 * 分页结果接口
 */
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}


/**
 * 租户查询验证 Schema
 */
const queryTenantSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  keyword: z.string().optional().transform(val => val && val.trim() !== '' ? val : undefined),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  sortBy: z.string().optional().transform(val => val && val.trim() !== '' ? val : undefined),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

/**
 * 获取租户列表
 * GET /api/tenants
 */
export async function GET(request: NextRequest) {
  try {
    // 检查权限（只有超级管理员或系统管理员可以查看所有租户）
    await requirePermission('tenant:read', undefined, request);

    const { searchParams } = new URL(request.url);

    // 验证查询参数 - 直接使用searchParams对象
    const queryData = queryTenantSchema.parse({
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined
    });

    let query = db.select({
      id: tenants.id,
      name: tenants.name,
      code: tenants.code,
      status: tenants.status,
      settings: tenants.settings,
      createdAt: tenants.createdAt,
      updatedAt: tenants.updatedAt,
    }).from(tenants);

    // 应用过滤条件
    const conditions = [];

    if (queryData.keyword) {
      conditions.push(
        sql`(
          ${ilike(tenants.name, `%${queryData.keyword}%`)} OR
          ${ilike(tenants.code, `%${queryData.keyword}%`)}
        )`
      );
    }

    if (queryData.status) {
      conditions.push(eq(tenants.status, queryData.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // 获取总数
    const totalQuery = db.select({ count: count() }).from(tenants);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const totalResult = await totalQuery;
    const total = totalResult[0]?.count || 0;

    // 应用排序
    const sortBy = queryData.sortBy || 'createdAt';
    const sortOrder = queryData.sortOrder || 'desc';
    const orderFn = sortOrder === 'desc' ? desc : asc;

    if (sortBy === 'name') {
      query = query.orderBy(orderFn(tenants.name)) as typeof query;
    } else if (sortBy === 'code') {
      query = query.orderBy(orderFn(tenants.code)) as typeof query;
    } else {
      query = query.orderBy(orderFn(tenants.createdAt)) as typeof query;
    }

    // 应用分页
    const offset = (queryData.page - 1) * queryData.pageSize;
    query = query.limit(queryData.pageSize).offset(offset) as typeof query;

    const tenantsList = await query;

    // 构建分页结果
    const totalPages = Math.ceil(total / queryData.pageSize);
    const result: PaginatedResult<Tenant> = {
      data: tenantsList,
      total,
      page: queryData.page,
      pageSize: queryData.pageSize,
      totalPages,
      hasNext: queryData.page < totalPages,
      hasPrev: queryData.page > 1,
    };

    // 序列化BigInt结果
    const serializedResult = {
      ...result,
      total: Number(result.total),
      totalPages: Number(result.totalPages),
      data: result.data.map((tenant: any) => ({
        ...tenant,
        id: tenant.id.toString(),
        createdAt: tenant.createdAt?.toISOString(),
        updatedAt: tenant.updatedAt?.toISOString()
      }))
    };

    return NextResponse.json({
      success: true,
      data: serializedResult,
      message: '获取租户列表成功'
    });

  } catch (error) {
    console.error('Failed to get tenants:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: error.issues
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取租户列表失败'
      }
    }, { status: 500 });
  }
}

/**
 * 创建新租户
 * POST /api/tenants
 */
export async function POST(request: NextRequest) {
  try {
    // 检查权限
    await requirePermission('tenant:create', undefined, request);

    const body = await request.json();

    // 手动验证请求数据
    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求体不能为空'
        }
      }, { status: 400 });
    }

    const { name, code, status = 'active', settings = {} } = body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户名称不能为空'
        }
      }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户代码不能为空'
        }
      }, { status: 400 });
    }

    if (name.length > 200) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户名称不能超过200个字符'
        }
      }, { status: 400 });
    }

    if (code.length > 100) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户代码不能超过100个字符'
        }
      }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户代码只能包含字母、数字、下划线和横线'
        }
      }, { status: 400 });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户状态只能是 active、inactive 或 suspended'
        }
      }, { status: 400 });
    }

    const validatedData = { name: name.trim(), code: code.trim(), status, settings };

    // 检查租户代码是否已存在
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.code, validatedData.code))
      .limit(1);

    if (existingTenant.length > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_CODE_EXISTS',
          message: '租户代码已存在'
        }
      }, { status: 409 });
    }

    // 准备创建数据
    const newTenantData: NewTenant = {
      name: validatedData.name,
      code: validatedData.code,
      status: validatedData.status,
      settings: validatedData.settings,
    };

    // 创建租户
    const result = await db
      .insert(tenants)
      .values(newTenantData)
      .returning();

    const createdTenant = result[0];

    // 序列化BigInt
    const serializedTenant = {
      ...createdTenant,
      id: createdTenant.id.toString(),
      createdAt: createdTenant.createdAt?.toISOString(),
      updatedAt: createdTenant.updatedAt?.toISOString()
    };

    // 记录审计日志
    await db.insert(systemLogs).values({
      level: 'info',
      action: 'CREATE_TENANT',
      module: 'tenant',
      message: `创建租户: ${createdTenant.name}`,
      details: {
        tenantId: createdTenant.id.toString(),
        tenantCode: createdTenant.code,
        operation: 'create'
      }
    });

    return NextResponse.json({
      success: true,
      data: serializedTenant,
      message: '租户创建成功'
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create tenant:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: error.issues
        }
      }, { status: 400 });
    }

    // 检查是否是数据库唯一约束错误
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_CODE_EXISTS',
          message: '租户代码已存在'
        }
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '创建租户失败'
      }
    }, { status: 500 });
  }
}