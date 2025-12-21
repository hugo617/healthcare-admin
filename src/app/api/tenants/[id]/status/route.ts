import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, systemLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

/**
 * 状态更新验证 Schema
 */
const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended'])
});

/**
 * 更新租户状态
 * PATCH /api/tenants/[id]/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    await requirePermission(PERMISSIONS.TENANT.UPDATE, undefined, request);

    const resolvedParams = await params;
    const tenantId = resolvedParams.id;
    const body = await request.json();

    // 验证请求数据
    const validatedData = updateStatusSchema.parse(body);

    // 检查租户是否存在
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId)))
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

    // 防止修改默认租户的状态
    if (existingTenant[0].code === 'default') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DEFAULT_TENANT_STATUS_NOT_MODIFIABLE',
          message: '默认租户的状态不能修改'
        }
      }, { status: 403 });
    }

    // 如果状态没有变化，直接返回
    if (existingTenant[0].status === validatedData.status) {
      return NextResponse.json({
        success: true,
        data: existingTenant[0],
        message: '租户状态未发生变化'
      });
    }

    // 更新租户状态
    const result = await db
      .update(tenants)
      .set({
        status: validatedData.status,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, parseInt(tenantId)))
      .returning();

    const updatedTenant = result[0];

    // 序列化BigInt
    const serializedTenant = {
      ...updatedTenant,
      id: updatedTenant.id.toString(),
      createdAt: updatedTenant.createdAt?.toISOString(),
      updatedAt: updatedTenant.updatedAt?.toISOString()
    };

    // 记录审计日志
    await db.insert(systemLogs).values({
      level: 'info',
      action: 'UPDATE_TENANT_STATUS',
      module: 'tenant',
      message: `更新租户状态: ${updatedTenant.name} -> ${validatedData.status}`,
      details: {
        tenantId: updatedTenant.id.toString(),
        tenantCode: updatedTenant.code,
        oldStatus: existingTenant[0].status,
        newStatus: validatedData.status,
        operation: 'status_update'
      }
    });

    return NextResponse.json({
      success: true,
      data: serializedTenant,
      message: '租户状态更新成功'
    });

  } catch (error) {
    console.error('Failed to update tenant status:', error);

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
        message: '更新租户状态失败'
      }
    }, { status: 500 });
  }
}