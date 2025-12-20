import { db } from '@/db';
import { users, roles, permissions, rolePermissions, tenants } from '@/db/schema';
import { eq, and, asc, desc, ilike, count, sql } from 'drizzle-orm';
import { TenantContext } from '@/lib/tenant-context';
import {
  User,
  Role,
  Permission,
  RolePermission,
  Tenant,
  TenantStatistics
} from '@/db/schema';

/**
 * 查询选项接口
 */
export interface BaseQueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  filters?: Record<string, any>;
}

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 基础查询类
 * 提供租户感知的数据库查询方法
 */
export class BaseQuery {
  /**
   * 在租户上下文中执行回调函数
   * @param callback 回调函数
   * @returns 回调函数执行结果
   */
  static async withTenant<T>(
    callback: (tenantId: bigint) => Promise<T>
  ): Promise<T> {
    const tenantId = TenantContext.requireTenant();
    return await callback(tenantId);
  }

  /**
   * 在指定租户上下文中执行回调函数
   * @param tenantId 租户ID
   * @param callback 回调函数
   * @returns 回调函数执行结果
   */
  static async withSpecificTenant<T>(
    tenantId: bigint,
    callback: () => Promise<T>
  ): Promise<T> {
    return await TenantContext.withTenant(tenantId, callback);
  }

  /**
   * 构建租户过滤条件
   * @param tableName 表名
   * @returns 租户过滤条件
   */
  static buildTenantFilter(tableName: string) {
    const tenantId = TenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required for query operations');
    }

    // 根据表名返回相应的过滤条件
    switch (tableName) {
      case 'users':
        return eq(users.tenantId, tenantId);
      case 'roles':
        return eq(roles.tenantId, tenantId);
      case 'permissions':
        return eq(permissions.tenantId, tenantId);
      case 'role_permissions':
        return eq(rolePermissions.tenantId, tenantId);
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * 应用分页到查询
   * @param query Drizzle查询
   * @param options 查询选项
   * @returns 应用分页后的查询
   */
  static applyPagination(query: any, options: BaseQueryOptions = {}) {
    const { page = 1, pageSize = 20 } = options;

    const offset = (page - 1) * pageSize;
    return query.limit(pageSize).offset(offset);
  }

  /**
   * 应用排序到查询
   * @param query Drizzle查询
   * @param options 查询选项
   * @returns 应用排序后的查询
   */
  static applySorting(query: any, options: BaseQueryOptions = {}) {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    // 根据排序字段应用排序
    switch (sortBy) {
      case 'id':
        return query.orderBy(orderFn(users.id));
      case 'name':
        return query.orderBy(orderFn(users.username));
      case 'email':
        return query.orderBy(orderFn(users.email));
      case 'createdAt':
        return query.orderBy(orderFn(users.createdAt));
      case 'updatedAt':
        return query.orderBy(orderFn(users.updatedAt));
      default:
        return query.orderBy(orderFn(users.createdAt));
    }
  }

  /**
   * 应用搜索到查询
   * @param query Drizzle查询
   * @param options 查询选项
   * @returns 应用搜索后的查询
   */
  static applySearch(query: any, options: BaseQueryOptions = {}) {
    const { keyword } = options;

    if (keyword && keyword.trim()) {
      const searchTerm = `%${keyword.trim()}%`;
      return query.where(
        and(
          this.buildTenantFilter('users'),
          ilike(users.username, searchTerm)
        )
      );
    }

    return query.where(this.buildTenantFilter('users'));
  }

  /**
   * 获取总数（用于分页）
   * @param query 基础查询
   * @returns 总数
   */
  static async getTotal(query: any): Promise<number> {
    try {
      const result = await db.select({ count: count() }).from(query);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get total count:', error);
      return 0;
    }
  }

  /**
   * 构建分页结果
   * @param data 数据
   * @param total 总数
   * @param options 查询选项
   * @returns 分页结果
   */
  static buildPaginatedResult<T>(
    data: T[],
    total: number,
    options: BaseQueryOptions = {}
  ): PaginatedResult<T> {
    const { page = 1, pageSize = 20 } = options;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}

/**
 * 用户查询类
 */
export class UserQuery extends BaseQuery {
  /**
   * 查找用户（支持分页和搜索）
   */
  static async findUsers(options: BaseQueryOptions = {}): Promise<PaginatedResult<User>> {
    return this.withTenant(async (tenantId) => {
      let query = db.select().from(users);

      // 应用租户过滤
      query = query.where(eq(users.tenantId, tenantId));

      // 应用搜索
      if (options.keyword) {
        const searchTerm = `%${options.keyword.trim()}%`;
        query = query.where(
          and(
            eq(users.tenantId, tenantId),
            sql`(
              ${ilike(users.username, searchTerm)} OR
              ${ilike(users.email, searchTerm)}
            )`
          )
        );
      }

      // 应用过滤
      if (options.filters) {
        const filterConditions = Object.entries(options.filters)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => {
            switch (key) {
              case 'status':
                return eq(users.status, value as string);
              case 'roleId':
                return eq(users.roleId, value as number);
              default:
                return null;
            }
          })
          .filter(Boolean);

        if (filterConditions.length > 0) {
          query = query.where(and(eq(users.tenantId, tenantId), ...filterConditions));
        }
      }

      // 获取总数
      const total = await this.getTotal(users);

      // 应用排序和分页
      query = this.applySorting(query, options);
      query = this.applyPagination(query, options);

      const data = await query;
      return this.buildPaginatedResult(data, total, options);
    });
  }

  /**
   * 根据ID查找用户
   */
  static async findUserById(id: number): Promise<User | null> {
    return this.withTenant(async (tenantId) => {
      const result = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      return result[0] || null;
    });
  }

  /**
   * 根据邮箱查找用户
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    return this.withTenant(async (tenantId) => {
      const result = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
        .limit(1);

      return result[0] || null;
    });
  }

  /**
   * 根据用户名查找用户
   */
  static async findUserByUsername(username: string): Promise<User | null> {
    return this.withTenant(async (tenantId) => {
      const result = await db
        .select()
        .from(users)
        .where(and(eq(users.username, username), eq(users.tenantId, tenantId)))
        .limit(1);

      return result[0] || null;
    });
  }

  /**
   * 检查邮箱是否已存在
   */
  static async isEmailExists(email: string, excludeId?: number): Promise<boolean> {
    return this.withTenant(async (tenantId) => {
      let query = db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), eq(users.tenantId, tenantId)));

      if (excludeId) {
        query = query.where(and(eq(users.email, email), eq(users.tenantId, tenantId), sql`${users.id} != ${excludeId}`));
      }

      const result = await query.limit(1);
      return result.length > 0;
    });
  }

  /**
   * 检查用户名是否已存在
   */
  static async isUsernameExists(username: string, excludeId?: number): Promise<boolean> {
    return this.withTenant(async (tenantId) => {
      let query = db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.username, username), eq(users.tenantId, tenantId)));

      if (excludeId) {
        query = query.where(and(eq(users.username, username), eq(users.tenantId, tenantId), sql`${users.id} != ${excludeId}`));
      }

      const result = await query.limit(1);
      return result.length > 0;
    });
  }

  /**
   * 获取用户总数
   */
  static async getUserCount(): Promise<number> {
    return this.withTenant(async (tenantId) => {
      const result = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.tenantId, tenantId));

      return result[0]?.count || 0;
    });
  }
}

/**
 * 角色查询类
 */
export class RoleQuery extends BaseQuery {
  /**
   * 查找角色（支持分页和搜索）
   */
  static async findRoles(options: BaseQueryOptions = {}): Promise<PaginatedResult<Role>> {
    return this.withTenant(async (tenantId) => {
      let query = db.select().from(roles);

      // 应用租户过滤
      query = query.where(eq(roles.tenantId, tenantId));

      // 应用搜索
      if (options.keyword) {
        const searchTerm = `%${options.keyword.trim()}%`;
        query = query.where(
          and(
            eq(roles.tenantId, tenantId),
            sql`(
              ${ilike(roles.name, searchTerm)} OR
              ${ilike(roles.description, searchTerm)}
            )`
          )
        );
      }

      // 获取总数
      const total = await this.getTotal(roles);

      // 应用排序和分页
      const { sortBy = 'createdAt', sortOrder = 'asc' } = options;
      const orderFn = sortOrder === 'asc' ? asc : desc;
      query = query.orderBy(orderFn(roles.createdAt));
      query = this.applyPagination(query, options);

      const data = await query;
      return this.buildPaginatedResult(data, total, options);
    });
  }

  /**
   * 根据ID查找角色
   */
  static async findRoleById(id: number): Promise<Role | null> {
    return this.withTenant(async (tenantId) => {
      const result = await db
        .select()
        .from(roles)
        .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)))
        .limit(1);

      return result[0] || null;
    });
  }

  /**
   * 获取角色总数
   */
  static async getRoleCount(): Promise<number> {
    return this.withTenant(async (tenantId) => {
      const result = await db
        .select({ count: count() })
        .from(roles)
        .where(eq(roles.tenantId, tenantId));

      return result[0]?.count || 0;
    });
  }
}

/**
 * 租户查询类
 */
export class TenantQuery extends BaseQuery {
  /**
   * 查找所有租户（管理员功能）
   */
  static async findAllTenants(options: BaseQueryOptions = {}): Promise<PaginatedResult<Tenant>> {
    let query = db.select().from(tenants);

    // 应用搜索
    if (options.keyword) {
      const searchTerm = `%${options.keyword.trim()}%`;
      query = query.where(
        sql`(
          ${ilike(tenants.name, searchTerm)} OR
          ${ilike(tenants.code, searchTerm)}
        )`
      );
    }

    // 应用过滤
    if (options.filters?.status) {
      query = query.where(eq(tenants.status, options.filters.status));
    }

    // 获取总数
    const total = await this.getTotal(tenants);

    // 应用排序和分页
    const { sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    query = query.orderBy(orderFn(tenants[sortBy as keyof typeof tenants] || tenants.createdAt));
    query = this.applyPagination(query, options);

    const data = await query;
    return this.buildPaginatedResult(data, total, options);
  }

  /**
   * 根据ID查找租户
   */
  static async findTenantById(id: bigint): Promise<Tenant | null> {
    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 根据代码查找租户
   */
  static async findTenantByCode(code: string): Promise<Tenant | null> {
    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.code, code))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 获取租户统计信息
   */
  static async getTenantStatistics(tenantId: bigint): Promise<TenantStatistics | null> {
    try {
      const result = await db.execute(sql`
        SELECT
          t.id,
          t.name,
          t.code,
          t.status,
          t.created_at as "createdAt",
          COALESCE(COUNT(DISTINCT u.id), 0) as "userCount",
          COALESCE(COUNT(DISTINCT r.id), 0) as "roleCount",
          COALESCE(COUNT(DISTINCT p.id), 0) as "permissionCount",
          COALESCE(COUNT(DISTINCT rp.id), 0) as "rolePermissionCount"
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.id
        LEFT JOIN roles r ON r.tenant_id = t.id
        LEFT JOIN permissions p ON p.tenant_id = t.id
        LEFT JOIN role_permissions rp ON rp.tenant_id = t.id
        WHERE t.id = ${tenantId}
        GROUP BY t.id, t.name, t.code, t.status, t.created_at
      `);

      if (result.length > 0) {
        return {
          id: BigInt(result[0].id),
          name: result[0].name,
          code: result[0].code,
          status: result[0].status,
          createdAt: new Date(result[0].createdAt),
          userCount: Number(result[0].userCount),
          roleCount: Number(result[0].roleCount),
          permissionCount: Number(result[0].permissionCount),
          rolePermissionCount: Number(result[0].rolePermissionCount),
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to get tenant statistics for ${tenantId}:`, error);
      return null;
    }
  }
}

export default BaseQuery;