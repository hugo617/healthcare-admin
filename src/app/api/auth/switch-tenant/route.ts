import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, users, systemLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';

/**
 * 切换租户上下文
 * POST /api/auth/switch-tenant
 */
export async function POST(request: NextRequest) {
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

    // 检查用户是否为超级管理员（只有超级管理员可以切换租户）
    if (!decoded.isSuperAdmin) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有超级管理员可以切换租户'
        }
      }, { status: 403 });
    }

    // 获取请求体
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求体不能为空'
        }
      }, { status: 400 });
    }

    const { tenantId, reason } = body;

    // 验证tenantId
    if (!tenantId || typeof tenantId !== 'string' && typeof tenantId !== 'number') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '租户ID不能为空'
        }
      }, { status: 400 });
    }

    const targetTenantId = BigInt(tenantId);

    // 检查目标租户是否存在
    const targetTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, targetTenantId))
      .limit(1);

    if (targetTenant.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: '目标租户不存在'
        }
      }, { status: 404 });
    }

    const targetTenantInfo = targetTenant[0];

    // 检查目标租户状态
    if (targetTenantInfo.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TENANT_INACTIVE',
          message: '目标租户未激活，无法切换'
        }
      }, { status: 400 });
    }

    // 获取当前租户信息
    const currentTenantId = decoded.tenantId ? BigInt(decoded.tenantId) : null;
    let currentTenantInfo = null;

    if (currentTenantId) {
      const currentTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, currentTenantId))
        .limit(1);

      if (currentTenant.length > 0) {
        currentTenantInfo = currentTenant[0];
      }
    }

    // 检查是否已经是目标租户
    if (currentTenantId && currentTenantId.toString() === targetTenantId.toString()) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SAME_TENANT',
          message: '已经在目标租户中'
        }
      }, { status: 400 });
    }

    // 生成新的JWT token
    const newToken = await new SignJWT({
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      roleId: decoded.roleId,
      tenantId: targetTenantId.toString(),
      avatar: decoded.avatar,
      isSuperAdmin: decoded.isSuperAdmin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // 记录切换日志
    try {
      await db.insert(systemLogs).values({
        level: 'info',
        action: 'SWITCH_TENANT',
        module: 'auth',
        message: `超级管理员切换租户: ${currentTenantInfo?.name || '未知'} -> ${targetTenantInfo.name}`,
        details: {
          userId: decoded.id,
          userEmail: decoded.email,
          previousTenantId: currentTenantId?.toString(),
          previousTenantCode: currentTenantInfo?.code,
          currentTenantId: targetTenantId.toString(),
          currentTenantCode: targetTenantInfo.code,
          reason: reason || '未提供原因',
          operation: 'tenant_switch',
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              request.ip ||
              'unknown'
        }
      });
    } catch (logError) {
      console.error('Failed to record tenant switch log:', logError);
      // 日志记录失败不应该影响切换操作
    }

    // 构建响应数据
    const responseData = {
      previousTenant: currentTenantInfo ? {
        id: currentTenantInfo.id.toString(),
        name: currentTenantInfo.name,
        code: currentTenantInfo.code,
        status: currentTenantInfo.status
      } : null,
      currentTenant: {
        id: targetTenantInfo.id.toString(),
        name: targetTenantInfo.name,
        code: targetTenantInfo.code,
        status: targetTenantInfo.status,
        settings: targetTenantInfo.settings || {}
      },
      sessionToken: newToken,
      switchInfo: {
        reason: reason || '未提供原因',
        timestamp: new Date().toISOString(),
        operator: {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
          isSuperAdmin: decoded.isSuperAdmin
        }
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: '租户切换成功'
    });

  } catch (error) {
    console.error('Failed to switch tenant:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '租户切换失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}