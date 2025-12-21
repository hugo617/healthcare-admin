import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, systemLogs } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TenantContext } from '@/lib/tenant-context';
import { requirePermission } from '@/lib/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';
import { auth } from '@/lib/auth';



/**
 * 获取指定租户信息
 * GET /api/tenants/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    await requirePermission(PERMISSIONS.TENANT.READ, undefined, request);

    const resolvedParams = await params;
    const tenantId = BigInt(resolvedParams.id);

    // 查询租户信息
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: '租户不存在'
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tenant[0],
        id: tenant[0].id.toString(),
        createdAt: tenant[0].createdAt?.toISOString(),
        updatedAt: tenant[0].updatedAt?.toISOString()
      },
      message: '获取租户信息成功'
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Failed to get tenant ${resolvedParams.id}:`, error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取租户信息失败'
      }
    }, { status: 500 });
  }
}

/**
 * 更新租户信息
 * PUT /api/tenants/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    await requirePermission(PERMISSIONS.TENANT.UPDATE, undefined, request);

    const resolvedParams = await params;
    const tenantId = BigInt(resolvedParams.id);
    const body = await request.json();

    // 验证请求体
    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求体不能为空'
        }
      }, { status: 400 });
    }

    const { name, code, status, settings } = body;

    // 验证name字段（如果提供）
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '租户名称不能为空'
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
    }

    // 验证code字段（如果提供）
    if (code !== undefined) {
      if (typeof code !== 'string' || code.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '租户代码不能为空'
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
    }

    // 验证status字段（如果提供）
    if (status !== undefined && !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户状态只能是 active、inactive 或 suspended'
        }
      }, { status: 400 });
    }

    // 验证settings字段（如果提供）
    if (settings !== undefined && (typeof settings !== 'object' || Array.isArray(settings))) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'settings必须是对象类型'
        }
      }, { status: 400 });
    }

    const validatedData = {
      name: name ? name.trim() : undefined,
      code: code ? code.trim() : undefined,
      status,
      settings: settings !== undefined ? settings : undefined
    };

    // 检查是否有实际更新内容
    const hasUpdates = Object.values(validatedData).some(value => value !== undefined);
    if (!hasUpdates) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: '没有提供需要更新的字段'
        }
      }, { status: 400 });
    }

    // 检查租户是否存在
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: '租户不存在'
        }
      }, { status: 404 });
    }

    // 如果要更新代码，检查是否与其他租户冲突
    if (validatedData.code && validatedData.code !== existingTenant[0].code) {
      const codeExists = await db
        .select()
        .from(tenants)
        .where(and(
          eq(tenants.code, validatedData.code),
          sql`${tenants.id} != ${tenantId}`
        ))
        .limit(1);

      if (codeExists.length > 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TENANT_CODE_EXISTS',
            message: '租户代码已存在'
          }
        }, { status: 409 });
      }
    }

    // 防止修改默认租户的代码
    if (existingTenant[0].code === 'default' && validatedData.code && validatedData.code !== 'default') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DEFAULT_TENANT_CODE_NOT_MODIFIABLE',
          message: '默认租户的代码不能修改'
        }
      }, { status: 403 });
    }

    // 构建更新数据，只包含实际需要更新的字段
    const updateData: any = {
      updatedAt: new Date()
    };

    // 只添加非undefined的字段
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.code !== undefined) {
      updateData.code = validatedData.code;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    if (validatedData.settings !== undefined) {
      // 深度合并settings，而不是完全替换
      const currentSettings = existingTenant[0].settings || {};
      updateData.settings = { ...currentSettings, ...validatedData.settings };
    }

    const result = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId))
      .returning();

    const updatedTenant = result[0];

    // 记录审计日志
    await db.insert(systemLogs).values({
      level: 'info',
      action: 'UPDATE_TENANT',
      module: 'tenant',
      message: `更新租户: ${updatedTenant.name}`,
      details: {
        tenantId: updatedTenant.id.toString(),
        tenantCode: updatedTenant.code,
        changes: validatedData,
        operation: 'update'
      }
    });

    // 序列化返回结果
    const serializedTenant = {
      ...updatedTenant,
      id: updatedTenant.id.toString(),
      createdAt: updatedTenant.createdAt?.toISOString(),
      updatedAt: updatedTenant.updatedAt?.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: serializedTenant,
      message: '租户信息更新成功'
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Failed to update tenant ${resolvedParams.id}:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: error.errors
        }
      }, { status: 400 });
    }

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
        message: '更新租户信息失败'
      }
    }, { status: 500 });
  }
}

/**
 * 删除租户
 * DELETE /api/tenants/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    await requirePermission(PERMISSIONS.TENANT.DELETE, undefined, request);

    const resolvedParams = await params;
    const tenantId = BigInt(resolvedParams.id);

    // 检查租户是否存在
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: '租户不存在'
        }
      }, { status: 404 });
    }

    // 防止删除默认租户
    if (existingTenant[0].code === 'default') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DEFAULT_TENANT_NOT_DELETABLE',
          message: '默认租户不能删除'
        }
      }, { status: 403 });
    }

    // 检查租户下是否还有用户
    const userCount = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(sql`users`)
      .where(sql`tenant_id = ${tenantId}`);

    if (userCount[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_HAS_USERS',
          message: '租户下还有用户，无法删除'
        }
      }, { status: 409 });
    }

    // 删除租户（级联删除相关数据）
    await db.delete(tenants).where(eq(tenants.id, tenantId));

    // 记录审计日志
    try {
      await db.insert(systemLogs).values({
        level: 'warn',
        action: 'DELETE_TENANT',
        module: 'tenant',
        message: `删除租户: ${existingTenant[0].name}`,
        details: {
          tenantId: existingTenant[0].id.toString(),
          tenantCode: existingTenant[0].code,
          operation: 'delete'
        }
      });
    } catch (logError) {
      // 日志记录失败不应该影响删除操作的成功
      console.error('Failed to record audit log for tenant deletion:', logError);
    }

    return NextResponse.json({
      success: true,
      message: '租户删除成功'
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Failed to delete tenant ${resolvedParams.id}:`, error);

    // 处理已知的错误类型
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: '该租户存在关联数据，无法删除'
        }
      }, { status: 409 });
    }

    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_HAS_DEPENDENCIES',
          message: '该租户存在依赖数据，无法删除'
        }
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '删除租户失败'
      }
    }, { status: 500 });
  }
}

