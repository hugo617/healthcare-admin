import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permission-guard';

/**
 * 获取租户统计信息
 * GET /api/tenants/[id]/statistics
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

    const tenantInfo = tenant[0];

    // 构建基础统计信息
    const statistics = {
      // 基本信息
      id: tenantInfo.id.toString(),
      name: tenantInfo.name,
      code: tenantInfo.code,
      status: tenantInfo.status,
      createdAt: tenantInfo.createdAt?.toISOString(),
      updatedAt: tenantInfo.updatedAt?.toISOString(),

      // 核心统计数据（暂时使用模拟数据）
      userCount: 1,
      roleCount: 1,
      permissionCount: 10,
      rolePermissionCount: 10,

      // 详细统计
      detailedStats: {
        // 用户统计
        users: {
          total: 1,
          active: 1,
          inactive: 0,
          locked: 0,
          recentActive: 1,
          activeRate: '100%',
          activity: {
            thisWeek: 1,
            thisMonth: 1,
            neverLoggedIn: 0
          }
        },

        // 角色统计
        roles: {
          total: 1,
          super: 1,
          regular: 0
        },

        // 权限统计
        permissions: {
          total: 10,
          root: 1,
          child: 9
        },

        // 角色权限关联统计
        rolePermissions: {
          total: 10
        },

        // 组织架构统计
        organizations: {
          total: 0
        },

        // 系统日志统计
        logs: {
          total: 100,
          errors: 0,
          warnings: 10,
          info: 90,
          errorRate: '0%'
        }
      },

      // 健康状态
      health: {
        status: tenantInfo.status === 'active' ? 'healthy' : 'warning',
        issues: tenantInfo.status === 'active' ? [] : ['租户状态不是活跃'],
        score: tenantInfo.status === 'active' ? 100 : 60
      },

      // 时间戳
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: statistics,
      message: '获取租户统计信息成功'
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Failed to get tenant statistics ${resolvedParams.id}:`, error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取租户统计信息失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}