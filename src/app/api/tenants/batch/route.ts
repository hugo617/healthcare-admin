import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/service/response';

/**
 * 批量操作租户 API
 * POST /api/tenants/batch
 *
 * 支持的操作：
 * - activate: 批量启用租户
 * - deactivate: 批量停用租户
 * - suspend: 批量暂停租户
 * - delete: 批量删除租户
 */
export async function POST(request: NextRequest) {
  try {
    // 验证权限
    await requirePermission(PERMISSIONS.TENANT.UPDATE, undefined, request);

    const body = await request.json();
    const { operation, tenantIds } = body;

    // 验证请求参数
    if (!operation || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return errorResponse('无效的请求参数');
    }

    // 验证操作类型
    const validOperations = ['activate', 'deactivate', 'suspend', 'delete'];
    if (!validOperations.includes(operation)) {
      return errorResponse('不支持的操作类型');
    }

    // 转换 ID 为 BigInt
    const tenantBigIntIds = tenantIds.map((id: string) => {
      try {
        return BigInt(id);
      } catch {
        throw new Error(`无效的租户 ID: ${id}`);
      }
    });

    // 检查租户是否存在
    const existingTenants = await db
      .select({ id: tenants.id, code: tenants.code })
      .from(tenants)
      .where(inArray(tenants.id, tenantBigIntIds));

    if (existingTenants.length !== tenantBigIntIds.length) {
      return errorResponse('部分租户不存在');
    }

    // 防止删除默认租户 (code 为 'default')
    if (operation === 'delete') {
      const defaultTenant = existingTenants.find((t) => t.code === 'default');
      if (defaultTenant) {
        return errorResponse('不能删除默认租户');
      }
    }

    const result: {
      success: number;
      failed: number;
      errors: Array<{ tenantId: string; error: string }>;
    } = {
      success: 0,
      failed: 0,
      errors: []
    };

    // 执行批量操作
    switch (operation) {
      case 'activate':
        await db
          .update(tenants)
          .set({ status: 'active', updatedAt: new Date() })
          .where(inArray(tenants.id, tenantBigIntIds));
        result.success = tenantBigIntIds.length;
        break;

      case 'deactivate':
        await db
          .update(tenants)
          .set({ status: 'inactive', updatedAt: new Date() })
          .where(inArray(tenants.id, tenantBigIntIds));
        result.success = tenantBigIntIds.length;
        break;

      case 'suspend':
        await db
          .update(tenants)
          .set({ status: 'suspended', updatedAt: new Date() })
          .where(inArray(tenants.id, tenantBigIntIds));
        result.success = tenantBigIntIds.length;
        break;

      case 'delete':
        // 硬删除：直接删除租户记录
        await db.delete(tenants).where(inArray(tenants.id, tenantBigIntIds));
        result.success = tenantBigIntIds.length;
        break;

      default:
        return errorResponse('不支持的操作类型');
    }

    return successResponse(result);
  } catch (error) {
    console.error('[TENANT BATCH] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : '批量操作失败'
    );
  }
}
