import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { identifyTenant } from '@/lib/tenant-context';
import { jwtVerify } from 'jose';

/**
 * 获取当前租户信息
 * GET /api/auth/current-tenant
 */
export async function GET(request: NextRequest) {
  try {
    // 获取Authorization头
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未提供有效的认证信息'
        }
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');

    // 验证JWT token
    let decoded: any;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      decoded = payload;
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '无效的认证令牌'
        }
      }, { status: 401 });
    }

    // 从token中获取租户ID
    const tenantId = decoded.tenantId ? BigInt(decoded.tenantId) : null;

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_TENANT_CONTEXT',
          message: '用户未关联租户'
        }
      }, { status: 400 });
    }

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

    const tenantInfo = tenant[0];

    // 识别租户的方式
    const identificationResult = await identifyTenant(request);
    const identificationMethod = identificationResult.method || 'token';

    // 构建响应数据
    const responseData = {
      tenant: {
        id: tenantInfo.id.toString(),
        name: tenantInfo.name,
        code: tenantInfo.code,
        status: tenantInfo.status,
        createdAt: tenantInfo.createdAt?.toISOString(),
        updatedAt: tenantInfo.updatedAt?.toISOString()
      },
      identification: {
        method: identificationMethod,
        source: identificationMethod === 'jwt' ? 'token' :
               identificationMethod === 'header' ? 'request-header' :
               identificationMethod === 'subdomain' ? 'domain' :
               identificationMethod === 'default' ? 'system-default' : 'unknown'
      },
      settings: tenantInfo.settings || {},
      user: {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        roleId: decoded.roleId,
        isSuperAdmin: decoded.isSuperAdmin || false,
        avatar: decoded.avatar
      },
      context: {
        domain: identificationMethod === 'subdomain' ? request.headers.get('host') : null,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.ip ||
             'unknown'
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: '获取当前租户信息成功'
    });

  } catch (error) {
    console.error('Failed to get current tenant:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取租户信息失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}