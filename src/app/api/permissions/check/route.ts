import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permission-guard';
import { z } from 'zod';

/**
 * 权限检查请求参数 Schema
 */
const permissionCheckSchema = z.object({
  permissions: z.array(z.string()).min(1, '至少需要一个权限进行检查'),
  resourceId: z.string().optional()
});

/**
 * 检查当前用户是否具有指定权限
 * POST /api/permissions/check
 */
export async function POST(request: NextRequest) {
  try {
    // 检查权限（用于客户端权限验证，使用当前的权限守卫）
    await requirePermission('permission:read', undefined, request);

    const body = await request.json();

    // 验证请求数据
    const validatedData = permissionCheckSchema.parse(body);
    const { permissions, resourceId } = validatedData;

    // 这里应该基于实际的权限系统进行检查
    // 暂时返回一个简化的权限检查结果
    const permissionResults: Record<string, boolean> = {};

    // 从请求头或token中获取用户信息
    const authHeader = request.headers.get('authorization');
    let hasPermission = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // 这里应该解析JWT token并获取用户权限
      // 暂时进行基本的权限检查
      hasPermission = true; // 如果通过了 requirePermission，认为有权限
    }

    // 简化的权限检查逻辑
    permissions.forEach(permission => {
      // 这里应该查询用户的实际权限
      // 暂时对已认证用户返回true
      permissionResults[permission] = hasPermission;
    });

    // 计算权限统计
    const totalPermissions = permissions.length;
    const grantedPermissions = Object.values(permissionResults).filter(Boolean).length;
    const deniedPermissions = totalPermissions - grantedPermissions;

    return NextResponse.json({
      success: true,
      data: {
        permissions: permissionResults,
        summary: {
          total: totalPermissions,
          granted: grantedPermissions,
          denied: deniedPermissions,
          grantedRate: totalPermissions > 0 ? ((grantedPermissions / totalPermissions) * 100).toFixed(2) + '%' : '0%'
        },
        resourceId: resourceId || null,
        timestamp: new Date().toISOString()
      },
      message: '权限检查完成'
    });

  } catch (error) {
    console.error('Permission check failed:', error);

    // 处理Zod验证错误
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

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '权限检查失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

/**
 * GET方法支持（用于简单的权限查询）
 * GET /api/permissions/check?permissions=user:read,user:create
 */
export async function GET(request: NextRequest) {
  try {
    // 检查权限
    await requirePermission('permission:read', undefined, request);

    const { searchParams } = new URL(request.url);
    const permissionsParam = searchParams.get('permissions');
    const resourceId = searchParams.get('resourceId');

    if (!permissionsParam) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'permissions参数是必需的'
        }
      }, { status: 400 });
    }

    // 解析权限列表
    const permissions = permissionsParam.split(',').map(p => p.trim()).filter(p => p.length > 0);

    if (permissions.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '至少需要提供一个权限进行检查'
        }
      }, { status: 400 });
    }

    // 简化的权限检查
    const permissionResults: Record<string, boolean> = {};
    permissions.forEach(permission => {
      // 这里应该查询用户的实际权限
      // 暂时对已认证用户返回true
      permissionResults[permission] = true;
    });

    // 计算权限统计
    const totalPermissions = permissions.length;
    const grantedPermissions = Object.values(permissionResults).filter(Boolean).length;
    const deniedPermissions = totalPermissions - grantedPermissions;

    return NextResponse.json({
      success: true,
      data: {
        permissions: permissionResults,
        summary: {
          total: totalPermissions,
          granted: grantedPermissions,
          denied: deniedPermissions,
          grantedRate: totalPermissions > 0 ? ((grantedPermissions / totalPermissions) * 100).toFixed(2) + '%' : '0%'
        },
        resourceId: resourceId || null,
        timestamp: new Date().toISOString()
      },
      message: '权限检查完成'
    });

  } catch (error) {
    console.error('Permission check failed:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '权限检查失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}