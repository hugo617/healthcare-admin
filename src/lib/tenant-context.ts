import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { Tenant } from '@/db/schema';

/**
 * 租户上下文服务
 * 提供多租户环境下的租户识别、验证和管理功能
 */
export class TenantContext {
  private static tenantId: bigint | null = null;
  private static tenantInfo: Tenant | null = null;
  private static contextStack: Array<bigint | null> = [];

  /**
   * 设置当前租户上下文
   * @param tenantId 租户ID
   * @throws Error 当租户不存在时抛出错误
   */
  static async setCurrentTenant(tenantId: bigint): Promise<void> {
    // 验证租户存在性
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with id ${tenantId} not found`);
    }

    if (tenant.status !== 'active') {
      throw new Error(`Tenant ${tenant.code} is not active`);
    }

    this.tenantId = tenantId;
    this.tenantInfo = tenant;

    // 设置数据库会话变量
    await this.setDatabaseTenantContext(tenantId);
  }

  /**
   * 获取当前租户ID
   * @returns 当前租户ID或null
   */
  static getCurrentTenantId(): bigint | null {
    return this.tenantId;
  }

  /**
   * 获取当前租户信息
   * @returns 当前租户信息或null
   */
  static getCurrentTenant(): Tenant | null {
    return this.tenantInfo;
  }

  /**
   * 要求必须有租户上下文
   * @returns 当前租户ID
   * @throws Error 当没有租户上下文时抛出错误
   */
  static requireTenant(): bigint {
    if (!this.tenantId) {
      throw new Error('Tenant context is required but not set');
    }
    return this.tenantId;
  }

  /**
   * 清除租户上下文
   */
  static clearTenant(): void {
    this.tenantId = null;
    this.tenantInfo = null;
  }

  /**
   * 推送租户上下文到栈中（用于嵌套调用）
   * @param tenantId 租户ID
   */
  static async pushTenantContext(tenantId: bigint): Promise<void> {
    this.contextStack.push(this.tenantId);
    await this.setCurrentTenant(tenantId);
  }

  /**
   * 从栈中弹出租户上下文
   */
  static async popTenantContext(): Promise<void> {
    this.tenantId = this.contextStack.pop() || null;
    if (this.tenantId) {
      await this.setDatabaseTenantContext(this.tenantId);
    }
  }

  /**
   * 在指定租户上下文中执行回调函数
   * @param tenantId 租户ID
   * @param callback 回调函数
   * @returns 回调函数的返回值
   */
  static async withTenant<T>(
    tenantId: bigint,
    callback: () => Promise<T>
  ): Promise<T> {
    const originalTenantId = this.tenantId;
    const originalTenantInfo = this.tenantInfo;

    try {
      await this.setCurrentTenant(tenantId);
      return await callback();
    } finally {
      this.tenantId = originalTenantId;
      this.tenantInfo = originalTenantInfo;

      if (originalTenantId) {
        await this.setDatabaseTenantContext(originalTenantId);
      }
    }
  }

  /**
   * 从请求中识别租户
   * @param request Next.js请求对象
   * @returns 租户ID或null
   */
  static async identifyTenantFromRequest(request: NextRequest): Promise<bigint | null> {
    // 1. 从 JWT Token 中获取租户ID
    const token = this.extractTokenFromRequest(request);
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        if (decoded.tenantId) {
          return BigInt(decoded.tenantId);
        }
      } catch (error) {
        console.warn('Failed to decode JWT token for tenant identification:', error);
      }
    }

    // 2. 从子域名中获取租户（如 tenant1.example.com）
    const hostname = request.headers.get('host');
    if (hostname) {
      const subdomain = this.extractSubdomain(hostname);
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        const tenant = await this.getTenantBySubdomain(subdomain);
        if (tenant) {
          return tenant.id;
        }
      }
    }

    // 3. 从请求头中获取租户ID
    const tenantIdHeader = request.headers.get('x-tenant-id');
    if (tenantIdHeader) {
      try {
        const tenantId = BigInt(tenantIdHeader);
        const tenant = await this.getTenantById(tenantId);
        if (tenant) {
          return tenant.id;
        }
      } catch (error) {
        console.warn('Invalid tenant ID in header:', tenantIdHeader);
      }
    }

    // 4. 返回默认租户（如果启用）
    if (process.env.ENABLE_DEFAULT_TENANT === 'true') {
      const defaultTenant = await this.getDefaultTenant();
      if (defaultTenant) {
        return defaultTenant.id;
      }
    }

    return null;
  }

  /**
   * 根据ID获取租户信息
   * @param tenantId 租户ID
   * @returns 租户信息或null
   */
  static async getTenantById(tenantId: bigint): Promise<Tenant | null> {
    try {
      const result = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Failed to get tenant by ID ${tenantId}:`, error);
      return null;
    }
  }

  /**
   * 根据代码获取租户信息
   * @param code 租户代码
   * @returns 租户信息或null
   */
  static async getTenantByCode(code: string): Promise<Tenant | null> {
    try {
      const result = await db
        .select()
        .from(tenants)
        .where(eq(tenants.code, code))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Failed to get tenant by code ${code}:`, error);
      return null;
    }
  }

  /**
   * 根据子域名获取租户信息
   * @param subdomain 子域名
   * @returns 租户信息或null
   */
  static async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    try {
      const result = await db
        .select()
        .from(tenants)
        .where(eq(tenants.code, subdomain))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Failed to get tenant by subdomain ${subdomain}:`, error);
      return null;
    }
  }

  /**
   * 获取默认租户
   * @returns 默认租户或null
   */
  static async getDefaultTenant(): Promise<Tenant | null> {
    try {
      const result = await db
        .select()
        .from(tenants)
        .where(eq(tenants.code, 'default'))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Failed to get default tenant:', error);
      return null;
    }
  }

  /**
   * 检查租户是否存在且活跃
   * @param tenantId 租户ID
   * @returns 是否存在且活跃
   */
  static async isTenantActive(tenantId: bigint): Promise<boolean> {
    try {
      const tenant = await this.getTenantById(tenantId);
      return tenant?.status === 'active';
    } catch (error) {
      console.error(`Failed to check tenant status ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * 获取租户配置
   * @param tenantId 租户ID
   * @returns 租户配置或null
   */
  static async getTenantSettings(tenantId: bigint): Promise<any> {
    try {
      const tenant = await this.getTenantById(tenantId);
      return tenant?.settings || {};
    } catch (error) {
      console.error(`Failed to get tenant settings ${tenantId}:`, error);
      return {};
    }
  }

  /**
   * 设置数据库租户上下文
   * @param tenantId 租户ID
   */
  private static async setDatabaseTenantContext(tenantId: bigint): Promise<void> {
    try {
      await db.execute(`SET app.tenant_id = ${tenantId}`);
    } catch (error) {
      console.error(`Failed to set database tenant context for ${tenantId}:`, error);
      throw new Error(`Failed to set database tenant context: ${error}`);
    }
  }

  /**
   * 从请求中提取JWT Token
   * @param request Next.js请求对象
   * @returns JWT Token或null
   */
  private static extractTokenFromRequest(request: NextRequest): string | null {
    // 1. 从Authorization头获取
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. 从Cookie获取
    const tokenCookie = request.cookies.get('token');
    if (tokenCookie) {
      return tokenCookie.value;
    }

    return null;
  }

  /**
   * 从主机名中提取子域名
   * @param hostname 主机名
   * @returns 子域名或null
   */
  private static extractSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }
    return null;
  }

  /**
   * 验证租户权限（用户是否属于当前租户）
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @returns 是否有权限
   */
  static async validateUserTenantAccess(
    userId: number,
    tenantId: bigint
  ): Promise<boolean> {
    try {
      // 这里需要导入users表，暂时返回true，实际实现中需要查询用户表
      // const user = await db.select().from(users).where(
      //   and(eq(users.id, userId), eq(users.tenantId, tenantId))
      // ).limit(1);
      // return user.length > 0;

      return true; // 临时实现，需要根据实际情况调整
    } catch (error) {
      console.error(`Failed to validate user ${userId} tenant access:`, error);
      return false;
    }
  }

  /**
   * 获取租户域名（如果有）
   * @param tenantId 租户ID
   * @returns 域名或null
   */
  static getTenantDomain(tenantId: bigint): string | null {
    const baseDomain = process.env.BASE_DOMAIN;
    if (baseDomain && this.tenantInfo) {
      return `${this.tenantInfo.code}.${baseDomain}`;
    }
    return null;
  }

  /**
   * 生成租户访问URL
   * @param tenantId 租户ID
   * @param path 路径
   * @returns 完整URL
   */
  static generateTenantUrl(tenantId: bigint, path: string = '/'): string {
    const domain = this.getTenantDomain(tenantId);
    const baseUrl = domain || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 确保路径以/开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${normalizedPath}`;
  }

  /**
   * 初始化租户上下文（应用启动时调用）
   */
  static async initialize(): Promise<void> {
    try {
      // 确保默认租户存在
      const defaultTenant = await this.getDefaultTenant();
      if (!defaultTenant) {
        console.warn('Default tenant not found. Please create it manually.');
      }
    } catch (error) {
      console.error('Failed to initialize tenant context:', error);
    }
  }
}

/**
 * 租户识别结果接口
 */
export interface TenantIdentificationResult {
  tenantId: bigint | null;
  tenant: Tenant | null;
  method: 'jwt' | 'subdomain' | 'header' | 'default' | null;
  error?: string;
}

/**
 * 识别租户的完整流程
 * @param request Next.js请求对象
 * @returns 识别结果
 */
export async function identifyTenant(
  request: NextRequest
): Promise<TenantIdentificationResult> {
  let result: TenantIdentificationResult = {
    tenantId: null,
    tenant: null,
    method: null
  };

  try {
    // 1. 从JWT Token识别
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        if (decoded.tenantId) {
          result.tenantId = BigInt(decoded.tenantId);
          result.method = 'jwt';
        }
      } catch {}
    }

    // 2. 从子域名识别
    if (!result.tenantId) {
      const hostname = request.headers.get('host');
      if (hostname) {
        const subdomain = hostname.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
          const tenant = await TenantContext.getTenantBySubdomain(subdomain);
          if (tenant) {
            result.tenantId = tenant.id;
            result.tenant = tenant;
            result.method = 'subdomain';
          }
        }
      }
    }

    // 3. 从请求头识别
    if (!result.tenantId) {
      const tenantIdHeader = request.headers.get('x-tenant-id');
      if (tenantIdHeader) {
        try {
          const tenantId = BigInt(tenantIdHeader);
          const tenant = await TenantContext.getTenantById(tenantId);
          if (tenant) {
            result.tenantId = tenant.id;
            result.tenant = tenant;
            result.method = 'header';
          }
        } catch {}
      }
    }

    // 4. 使用默认租户
    if (!result.tenantId && process.env.ENABLE_DEFAULT_TENANT === 'true') {
      const defaultTenant = await TenantContext.getDefaultTenant();
      if (defaultTenant) {
        result.tenantId = defaultTenant.id;
        result.tenant = defaultTenant;
        result.method = 'default';
      }
    }

    // 如果找到了租户ID但没有租户信息，获取完整信息
    if (result.tenantId && !result.tenant) {
      const tenant = await TenantContext.getTenantById(result.tenantId);
      result.tenant = tenant;
    }

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tenant identification failed:', error);
  }

  return result;
}

/**
 * 租户装饰器 - 自动处理租户上下文
 */
export function withTenantContext(tenantId?: bigint) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const targetTenantId = tenantId || TenantContext.getCurrentTenantId();

      if (!targetTenantId) {
        throw new Error('Tenant context is required');
      }

      return await TenantContext.withTenant(targetTenantId, () => {
        return method.apply(this, args);
      });
    };

    return descriptor;
  };
}