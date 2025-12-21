import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

/**
 * 受保护的路由列表
 * 这些路由需要身份验证
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api',
];

/**
 * 公共路由列表
 * 这些路由不需要身份验证
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/auth',
  '/api/auth',
  '/_next',
  '/favicon.ico',
];

/**
 * 管理员路由列表
 * 这些路由需要管理员权限
 */
const ADMIN_ROUTES = [
  '/dashboard/system',
  '/api/admin',
];

/**
 * 检查路由是否为公共路由
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * 检查路由是否为管理员路由
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * 检查路由是否需要保护
 */
function isProtectedRoute(pathname: string): boolean {
  // 如果是公共路由，不需要保护
  if (isPublicRoute(pathname)) {
    return false;
  }

  // 如果是受保护的路由前缀，需要保护
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
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

    // 身份验证检查
    if (isProtectedRoute(pathname)) {
      // 从cookie中获取token
      const tokenCookie = request.cookies.get('token');
      if (!tokenCookie) {
        // 重定向到登录页面
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 验证token
      const user = verifyToken(tokenCookie.value);
      if (!user) {
        // 重定向到登录页面
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 管理员权限检查
      if (isAdminRoute(pathname) && !user.isSuperAdmin) {
        // 重定向到无权限页面
        return NextResponse.redirect(new URL('/403', request.url));
      }

      // 创建响应并添加租户和用户信息到响应头
      const response = NextResponse.next();

      if (tenantCode) {
        response.headers.set('x-tenant-code', tenantCode);
      }

      response.headers.set('x-user-id', user.id.toString());
      response.headers.set('x-user-email', user.email);
      response.headers.set('x-user-tenant-id', user.tenantId.toString());

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

    // 租户识别失败时的处理
    if (isProtectedRoute(pathname)) {
      // 重定向到错误页面或登录页面
      return NextResponse.redirect(new URL('/login?error=middleware_error', request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};