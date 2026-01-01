import { db } from '@/db';
import { organizations, userOrganizations, users } from '@/db/schema';
import { like, and, gte, lte, count, eq, sql, isNull, or } from 'drizzle-orm';
import { Logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/service/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const code = searchParams.get('code');
    const status = searchParams.get('status');
    const parentId = searchParams.get('parentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 验证分页参数
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const offset = (validPage - 1) * validLimit;

    // 构建查询条件
    const conditions = [];

    if (name) {
      conditions.push(like(organizations.name, `%${name}%`));
    }

    if (code) {
      conditions.push(like(organizations.code, `%${code}%`));
    }

    if (status) {
      conditions.push(eq(organizations.status, status));
    }

    if (parentId !== null) {
      if (parentId === 'null' || parentId === '') {
        // 查询顶级组织（没有父节点的组织）
        conditions.push(isNull(organizations.parentId));
      } else {
        conditions.push(eq(organizations.parentId, BigInt(parentId)));
      }
    }

    if (startDate) {
      conditions.push(gte(organizations.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(organizations.createdAt, new Date(endDate)));
    }

    // 构建基础查询
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 获取总数
    const [totalResult] = await db
      .select({ count: count() })
      .from(organizations)
      .where(whereClause);

    const total = totalResult.count;

    // 获取分页数据（包含用户数量）
    const baseQuery = db
      .select({
        id: organizations.id,
        tenantId: organizations.tenantId,
        name: organizations.name,
        code: organizations.code,
        path: organizations.path,
        parentId: organizations.parentId,
        leaderId: organizations.leaderId,
        status: organizations.status,
        sortOrder: organizations.sortOrder,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        createdBy: organizations.createdBy,
        updatedBy: organizations.updatedBy,
        userCount: sql<number>`count(DISTINCT ${userOrganizations.userId})`.as(
          'userCount'
        )
      })
      .from(organizations)
      .leftJoin(
        userOrganizations,
        eq(organizations.id, userOrganizations.organizationId)
      )
      .groupBy(
        organizations.id,
        organizations.tenantId,
        organizations.name,
        organizations.code,
        organizations.path,
        organizations.parentId,
        organizations.leaderId,
        organizations.status,
        organizations.sortOrder,
        organizations.createdAt,
        organizations.updatedAt,
        organizations.createdBy,
        organizations.updatedBy
      );

    const query = whereClause ? baseQuery.where(whereClause) : baseQuery;

    const orgList = await query
      .limit(validLimit)
      .offset(offset)
      .orderBy(organizations.sortOrder, organizations.createdAt);

    // 计算分页信息
    const totalPages = Math.ceil(total / validLimit);

    return successResponse(orgList, {
      page: validPage,
      limit: validLimit,
      total,
      totalPages
    });
  } catch (error) {
    console.error('获取组织列表失败:', error);
    return errorResponse('获取组织列表失败');
  }
}

export async function POST(request: Request) {
  const currentUser = getCurrentUser(request);

  try {
    const body = await request.json();
    const {
      name,
      code,
      parentId,
      leaderId,
      status = 'active',
      sortOrder = 0
    } = body;

    // 验证必填字段
    if (!name) {
      return errorResponse('组织名称不能为空');
    }

    // 获取当前用户的租户ID
    const tenantId = currentUser?.tenantId || 1;

    // 检查同一租户下组织名称是否已存在
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.tenantId, BigInt(tenantId)))
      .limit(100);

    const nameExists = existingOrg.some((org) => org.name === name);
    if (nameExists) {
      return errorResponse('组织名称已存在');
    }

    // 验证父组织是否存在
    if (parentId) {
      const parentOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, BigInt(parentId)))
        .limit(1);

      if (parentOrg.length === 0) {
        return errorResponse('父组织不存在');
      }
    }

    // 计算路径
    let path = '';
    if (parentId) {
      const parentOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, BigInt(parentId)))
        .limit(1);

      if (parentOrg.length > 0) {
        path = parentOrg[0].path
          ? `${parentOrg[0].path}.${BigInt(parentId)}`
          : String(parentId);
      }
    }

    // 创建组织
    const [newOrg] = await db
      .insert(organizations)
      .values({
        tenantId: BigInt(tenantId),
        name,
        code: code || null,
        parentId: parentId ? BigInt(parentId) : null,
        leaderId: leaderId || null,
        status,
        sortOrder,
        path,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      })
      .returning();

    // 更新路径（包含新生成的ID）
    if (newOrg.id) {
      const updatedPath = path ? `${path}.${newOrg.id}` : String(newOrg.id);
      await db
        .update(organizations)
        .set({ path: updatedPath })
        .where(eq(organizations.id, newOrg.id));
    }

    return successResponse({
      id: String(newOrg.id),
      name: newOrg.name,
      message: '组织创建成功'
    });
  } catch (error) {
    console.error('创建组织失败:', error);
    return errorResponse('创建组织失败');
  }
}
