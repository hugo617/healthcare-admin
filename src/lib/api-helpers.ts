import { NextRequest } from 'next/server';
import { identifyTenant, TenantContext } from '@/lib/tenant-context';

/**
 * API路由中使用的租户上下文设置
 * @param request Next.js请求对象
 */
export async function setTenantContextFromRequest(request: NextRequest): Promise<void> {
  const tenantResult = await identifyTenant(request);

  if (tenantResult.tenantId && tenantResult.tenant) {
    await TenantContext.setCurrentTenant(tenantResult.tenantId);
  }
}

/**
 * 从请求头中获取租户代码
 * @param request Next.js请求对象
 */
export function getTenantCodeFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-tenant-code');
}

/**
 * 从请求头中获取用户ID
 * @param request Next.js请求对象
 */
export function getUserIdFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

/**
 * 从请求头中获取用户邮箱
 * @param request Next.js请求对象
 */
export function getUserEmailFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-user-email');
}