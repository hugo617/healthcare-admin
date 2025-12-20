import { NextRequest, NextResponse } from 'next/server';
import { identifyTenant, TenantContext } from '@/lib/tenant-context';
import { getToken } from 'next-auth/jwt';

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
 * 中间件主函数
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // 1. 租户识别和上下文设置
    const tenantResult = await identifyTenant(request);

    if (tenantResult.tenantId && tenantResult.tenant) {
      // 设置租户上下文
      await TenantContext.setCurrentTenant(tenantResult.tenantId);

      // 添加租户信息到响应头
      const response = NextResponse.next();
      response.headers.set('x-tenant-id', tenantResult.tenantId.toString());
      response.headers.set('x-tenant-code', tenantResult.tenant.code);
      response.headers.set('x-tenant-name', tenantResult.tenant.name);
      response.headers.set('x-tenant-method', tenantResult.method || 'unknown');

      // 如果是通过子域名访问，重定向到主域名（可选）
      if (tenantResult.method === 'subdomain' && process.env.REDIRECT_SUBDOMAIN === 'true') {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const url = new URL(pathname, baseUrl);
        url.searchParams.set('tenant', tenantResult.tenant.code);
        return NextResponse.redirect(url);
      }

      return response;
    }

    // 2. 身份验证检查
    if (isProtectedRoute(pathname)) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });

      if (!token) {
        // 重定向到登录页面
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 3. 管理员权限检查
      if (isAdminRoute(pathname) && !token.isAdmin) {
        // 重定向到无权限页面
        return NextResponse.redirect(new URL('/403', request.url));
      }

      // 4. 用户租户权限检查
      if (tenantResult.tenantId) {
        // 这里需要检查用户是否属于当前租户
        // 由于middleware中无法访问数据库，这个检查在API层进行
        const response = NextResponse.next();
        response.headers.set('x-user-id', token.sub || '');
        response.headers.set('x-user-tenant-id', (token.tenantId as string) || '');
        return response;
      }
    }

    // 默认继续处理
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);

    // 租户识别失败时的处理
    if (isProtectedRoute(pathname)) {
      // 重定向到错误页面或登录页面
      return NextResponse.redirect(new URL('/login?error=tenant_not_found', request.url));
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