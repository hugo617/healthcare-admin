import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, systemLogs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/permission-guard';
import { z } from 'zod';

/**
 * 租户操作参数 Schema
 */
const tenantActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'suspend', 'reactivate']),
  reason: z.string().optional()
});

/**
 * 租户操作（激活、停用、暂停等）
 * POST /api/tenants/[id]/actions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    await requirePermission('tenant:manage', undefined, request);

    const resolvedParams = await params;
    const tenantId = BigInt(resolvedParams.id);
    const body = await request.json();

    // 验证请求数据
    const { action, reason } = tenantActionSchema.parse(body);

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

    let newStatus: 'active' | 'inactive' | 'suspended';
    let actionMessage: string;
    let logLevel: 'info' | 'warn';

    switch (action) {
      case 'activate':
        newStatus = 'active';
        actionMessage = '激活租户';
        logLevel = 'info';
        break;
      case 'deactivate':
        newStatus = 'inactive';
        actionMessage = '停用租户';
        logLevel = 'warn';
        break;
      case 'suspend':
        newStatus = 'suspended';
        actionMessage = '暂停租户';
        logLevel = 'warn';
        break;
      case 'reactivate':
        newStatus = 'active';
        actionMessage = '重新激活租户';
        logLevel = 'info';
        break;
      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: '无效的操作'
          }
        }, { status: 400 });
    }

    // 检查状态转换是否合理
    const currentStatus = existingTenant[0].status;

    // 如果已经是目标状态，返回提示
    if (currentStatus === newStatus) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_STATUS_CHANGE',
          message: `租户已经是${newStatus}状态`
        }
      }, { status: 400 });
    }

    // 更新租户状态
    const result = await db
      .update(tenants)
      .set({
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    const updatedTenant = result[0];

    // 记录审计日志
    try {
      await db.insert(systemLogs).values({
        level: logLevel,
        action: action.toUpperCase(),
        module: 'tenant',
        message: `${actionMessage}: ${updatedTenant.name}`,
        details: {
          tenantId: updatedTenant.id.toString(),
          tenantCode: updatedTenant.code,
          oldStatus: currentStatus,
          newStatus,
          reason,
          operation: 'status_change'
        }
      });
    } catch (logError) {
      // 日志记录失败不应该影响操作的成功
      console.error('Failed to record audit log for tenant action:', logError);
    }

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
      message: `${actionMessage}成功`
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Failed to perform action on tenant ${resolvedParams.id}:`, error);

    // 处理已知的错误类型
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
        message: '执行租户操作失败'
      }
    }, { status: 500 });
  }
}

/**
 * 获取租户支持的操作列表
 * GET /api/tenants/[id]/actions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    await requirePermission('tenant:read', undefined, request);

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

    const currentStatus = existingTenant[0].status;

    // 根据当前状态确定可执行的操作
    let availableActions: Array<{action: string, description: string}>;

    switch (currentStatus) {
      case 'active':
        availableActions = [
          { action: 'deactivate', description: '停用租户' },
          { action: 'suspend', description: '暂停租户' }
        ];
        break;
      case 'inactive':
        availableActions = [
          { action: 'activate', description: '激活租户' },
          { action: 'reactivate', description: '重新激活租户' }
        ];
        break;
      case 'suspended':
        availableActions = [
          { action: 'activate', description: '激活租户' },
          { action: 'reactivate', description: '重新激活租户' }
        ];
        break;
      default:
        availableActions = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        tenantId: existingTenant[0].id.toString(),
        tenantName: existingTenant[0].name,
        currentStatus,
        availableActions
      },
      message: '获取租户可用操作成功'
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Failed to get available actions for tenant ${resolvedParams.id}:`, error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取租户可用操作失败'
      }
    }, { status: 500 });
  }
}