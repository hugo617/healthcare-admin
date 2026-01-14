import { db } from '@/db';
import { permissions, rolePermissions } from '@/db/schema';
import { like, and, gte, lte, count, eq, isNull } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/service/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const description = searchParams.get('description');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 验证分页参数
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // 限制最大100条
    const offset = (validPage - 1) * validLimit;

    // 构建查询条件
    const conditions = [eq(permissions.isDeleted, false)];

    if (name) {
      conditions.push(like(permissions.name, `%${name}%`));
    }

    if (code) {
      conditions.push(like(permissions.code, `%${code}%`));
    }

    if (type && type !== 'all') {
      conditions.push(eq(permissions.type, type as any));
    }

    if (description) {
      conditions.push(like(permissions.description, `%${description}%`));
    }

    if (startDate) {
      conditions.push(gte(permissions.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(permissions.createdAt, new Date(endDate)));
    }

    // 构建基础查询
    const whereClause = and(...conditions);

    // 获取总数
    const [totalResult] = await db
      .select({ count: count() })
      .from(permissions)
      .where(whereClause);

    const total = totalResult.count;

    // 获取分页数据，包含角色使用数量
    const permissionList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        code: permissions.code,
        type: permissions.type,
        description: permissions.description,
        parentId: permissions.parentId,
        sortOrder: permissions.sortOrder,
        isSystem: permissions.isSystem,
        frontPath: permissions.frontPath,
        apiPath: permissions.apiPath,
        method: permissions.method,
        resourceType: permissions.resourceType,
        status: permissions.status,
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt,
        roleUsageCount: count(rolePermissions.roleId)
      })
      .from(permissions)
      .leftJoin(
        rolePermissions,
        eq(permissions.id, rolePermissions.permissionId)
      )
      .where(whereClause)
      .groupBy(permissions.id)
      .orderBy(permissions.sortOrder, permissions.createdAt)
      .limit(validLimit)
      .offset(offset);

    // 转换数据格式
    const formattedList = permissionList.map((p) => ({
      ...p,
      isSystem: p.isSystem || false,
      roleUsageCount: Number(p.roleUsageCount) || 0
    }));

    // 计算分页信息
    const totalPages = Math.ceil(total / validLimit);

    return successResponse(formattedList, {
      page: validPage,
      limit: validLimit,
      total,
      totalPages
    });
  } catch (error) {
    console.error('获取权限列表失败:', error);
    return errorResponse('获取权限列表失败');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      type = 'page',
      description,
      parentId,
      sortOrder = 0,
      frontPath,
      apiPath,
      method,
      resourceType
    } = body;

    if (!name || !code) {
      return errorResponse('权限名称和标识不能为空');
    }

    const [newPermission] = await db
      .insert(permissions)
      .values({
        name,
        code,
        type,
        description: description || null,
        parentId: parentId || null,
        sortOrder,
        isSystem: false,
        frontPath: frontPath || null,
        apiPath: apiPath || null,
        method: method || null,
        resourceType: resourceType || null,
        status: 'active'
      })
      .returning();

    return successResponse({ ...newPermission, message: '权限创建成功' });
  } catch (error) {
    console.error('创建权限失败:', error);
    return errorResponse('创建权限失败');
  }
}
