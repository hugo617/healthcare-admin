import { NextRequest, NextResponse } from 'next/server';

/**
 * 双系统路由配置
 * 统一使用 'auth_token' 作为 cookie 名称，向后兼容旧的 cookie 名称
 */

// JWT Secret - 需要与登录 API 使用相同的 secret
// 在 Edge Runtime 中，环境变量的访问方式不同
const JWT_SECRET = process.env.JWT_SECRET || 'your_very_long_random_secret_key';

/**
 * 在 middleware 中验证 token（Edge Runtime 兼容版本）
 */
function verifyTokenInMiddleware(token: string) {
  try {
    // 将 secret 转换为 Uint8Array 供 jose 使用
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);

    // 使用动态导入 jose 以支持 Edge Runtime
    return import('jose').then(({ jwtVerify }) => {
      return jwtVerify(token, secretKey)
        .then(({ payload }) => ({
          id: payload.id,
          email: payload.email,
          username: payload.username,
          avatar: payload.avatar || '',
          roleId: payload.roleId,
          tenantId: Number(payload.tenantId || 1),
          isSuperAdmin: payload.isSuperAdmin || false
        }))
        .catch(() => null);
    });
  } catch {
    return Promise.resolve(null);
  }
}
const SYSTEM_CONFIG = {
  admin: {
    prefix: '/admin',
    loginPath: '/admin/login',
    protectedPaths: ['/admin'],
    publicPaths: ['/admin/login'],
    cookieName: 'auth_token', // 统一使用 auth_token
    legacyCookieName: 'admin_token', // 向后兼容
    name: 'Admin'
  },
  h5: {
    prefix: '/h5',
    loginPath: '/h5/login',
    protectedPaths: ['/h5'],
    publicPaths: ['/h5/login'],
    cookieName: 'auth_token', // 统一使用 auth_token
    legacyCookieName: 'h5_token', // 向后兼容
    name: 'H5'
  }
};

/**
 * 判断路由属于哪个系统
 */
function identifySystem(pathname: string): 'admin' | 'h5' | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/h5')) return 'h5';
  return null;
}

/**
 * 检查是否为系统的公共路由
 */
function isPublicRoute(pathname: string, system: 'admin' | 'h5'): boolean {
  const config = SYSTEM_CONFIG[system];
  return config.publicPaths.some((path) => pathname.startsWith(path));
}

/**
 * 检查是否为系统的受保护路由
 */
function isProtectedRoute(pathname: string, system: 'admin' | 'h5'): boolean {
  const config = SYSTEM_CONFIG[system];
  return config.protectedPaths.some((path) => pathname.startsWith(path));
}

/**
 * 从请求中提取租户ID（不进行数据库查询）
 * @param request Next.js请求对象
 * @returns 租户ID或null
 */
function extractTenantFromRequest(request: NextRequest): string | null {
  // 1. 从URL查询参数获取租户代码
  const { searchParams } = new URL(request.url);
  const tenantCode = searchParams.get('tenant');
  if (tenantCode) {
    return tenantCode;
  }

  // 2. 从子域名获取租户代码
  const hostname = request.headers.get('host');
  if (hostname) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        return subdomain;
      }
    }
  }

  // 3. 从请求头获取租户ID
  const tenantIdHeader = request.headers.get('x-tenant-id');
  if (tenantIdHeader) {
    return tenantIdHeader;
  }

  return null;
}

/**
 * 中间件主函数
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // 1. 提取租户信息（不进行数据库查询）
    const tenantCode = extractTenantFromRequest(request);

    // 2. 识别系统
    const system = identifySystem(pathname);

    // 如果不是 admin 或 h5 路由,只添加租户信息后放行
    if (!system) {
      const response = NextResponse.next();
      if (tenantCode) {
        response.headers.set('x-tenant-code', tenantCode);
      }
      return response;
    }

    const config = SYSTEM_CONFIG[system];

    // 3. 公共路由直接放行
    if (isPublicRoute(pathname, system)) {
      const response = NextResponse.next();
      if (tenantCode) {
        response.headers.set('x-tenant-code', tenantCode);
      }
      return response;
    }

    // 4. 受保护路由需要认证
    if (isProtectedRoute(pathname, system)) {
      // 调试：打印所有可用的 cookies
      const allCookies = request.cookies.getAll();
      console.log(
        '[Middleware] All cookies:',
        allCookies.map((c) => c.name)
      );
      console.log(
        '[Middleware] Looking for cookie:',
        config.cookieName,
        'or',
        config.legacyCookieName
      );
      console.log(
        '[Middleware] JWT_SECRET:',
        JWT_SECRET?.substring(0, 10) + '...'
      );

      // 优先从统一 cookie 获取 token，如果没有则尝试从旧 cookie 获取
      let tokenCookie = request.cookies.get(config.cookieName);
      if (!tokenCookie) {
        // 向后兼容：尝试从旧的 cookie 获取 token
        tokenCookie = request.cookies.get(config.legacyCookieName);
      }

      console.log('[Middleware] Token cookie found:', !!tokenCookie);

      if (!tokenCookie) {
        // 重定向到对应系统的登录页
        const loginUrl = new URL(config.loginPath, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 验证 token - 使用 Edge Runtime 兼容的方式
      const user = await verifyTokenInMiddleware(tokenCookie.value);
      console.log('[Middleware] Token verification result:', !!user);
      if (!user) {
        // 重定向到对应系统的登录页
        const loginUrl = new URL(config.loginPath, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 创建响应并添加用户信息到响应头
      const response = NextResponse.next();

      if (tenantCode) {
        response.headers.set('x-tenant-code', tenantCode);
      }

      const userId = (user as any).id;
      const userEmail = (user as any).email;
      const userTenantId = (user as any).tenantId;

      response.headers.set('x-user-id', userId?.toString() || '');
      response.headers.set('x-user-email', userEmail || '');
      response.headers.set('x-user-tenant-id', userTenantId?.toString() || '');
      response.headers.set('x-user-system', system);

      return response;
    }

    // 对于非保护路由，只添加租户信息
    const response = NextResponse.next();
    if (tenantCode) {
      response.headers.set('x-tenant-code', tenantCode);
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // 错误处理：如果能识别系统则重定向到对应登录页
    const system = identifySystem(pathname);
    if (system) {
      return NextResponse.redirect(
        new URL(
          `${SYSTEM_CONFIG[system].loginPath}?error=middleware_error`,
          request.url
        )
      );
    }

    return NextResponse.next();
  }
}

/**
 * 中间件配置
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
};
