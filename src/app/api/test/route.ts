import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { TenantContext } from '@/lib/tenant-context';

export async function GET(request: Request) {
  try {
    // 1. 从Authorization头获取token
    const authHeader = request.headers.get('authorization');

    console.log('Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '缺少认证头' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token:', token.substring(0, 50) + '...');

    // 2. 验证token
    const user = verifyToken(token);

    console.log('Verified user:', user);

    if (!user) {
      return NextResponse.json({ error: '无效token' }, { status: 401 });
    }

    // 3. 设置租户上下文
    await TenantContext.setCurrentTenant(BigInt(user.tenantId));

    // 4. 获取当前租户信息
    const currentTenant = TenantContext.getCurrentTenant();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
        tenantId: user.tenantId.toString(),
        isSuperAdmin: user.isSuperAdmin
      },
      tenant: currentTenant
        ? {
            id: currentTenant.id.toString(),
            name: currentTenant.name,
            code: currentTenant.code,
            status: currentTenant.status
          }
        : null,
      message: '认证成功'
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      {
        error: '服务器错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
