import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permission-guard';

/**
 * 获取指定租户信息（简化版）
 * GET /api/tenants/[id]/simple
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

    // 序列化返回结果
    const result = {
      ...tenant[0],
      id: tenant[0].id.toString(),
      createdAt: tenant[0].createdAt?.toISOString(),
      updatedAt: tenant[0].updatedAt?.toISOString(),
      settings: tenant[0].settings || {}
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: '获取租户信息成功'
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Failed to get tenant ${resolvedParams.id}:`, error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取租户信息失败',
        details: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
}