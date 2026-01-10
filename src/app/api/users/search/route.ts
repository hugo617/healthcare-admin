import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq, and, or, like, isNull, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/service/response';

export async function GET(request: Request) {
  try {
    const currentUser = getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('query')?.trim();
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = searchParams.get('tenantId');

    if (!query) {
      return errorResponse('搜索关键词不能为空');
    }

    if (limit < 1 || limit > 100) {
      return errorResponse('搜索结果数量限制在1-100之间');
    }

    // 构建搜索条件
    const conditions = [
      eq(users.isDeleted, false),
      eq(users.status, 'active') // 只搜索活跃用户
    ];

    // 租户隔离
    const queryTenantId =
      currentUser?.isSuperAdmin && tenantId
        ? Number(tenantId)
        : Number(currentUser?.tenantId || 1);

    if (!currentUser?.isSuperAdmin) {
      conditions.push(eq(users.tenantId, queryTenantId));
    } else if (tenantId) {
      conditions.push(eq(users.tenantId, queryTenantId));
    }

    // 搜索用户名、邮箱、真实姓名
    const searchCondition = or(
      like(users.username, `%${query}%`),
      like(users.email, `%${query}%`),
      like(users.realName, `%${query}%`)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        realName: users.realName,
        avatar: users.avatar,
        tenantId: users.tenantId,
        status: users.status,
        role: {
          id: roles.id,
          name: roles.name,
          code: roles.code
        }
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(...conditions))
      .limit(limit).orderBy(sql`CASE
        WHEN ${users.username} ILIKE ${`%${query}%`} THEN 1
        WHEN ${users.realName} ILIKE ${`%${query}%`} THEN 2
        WHEN ${users.email} ILIKE ${`%${query}%`} THEN 3
        ELSE 4
      END, ${users.username}`);

    const formattedResults = searchResults.map((user) => ({
      ...user,
      tenantId: Number(user.tenantId),
      displayName: user.realName || user.username,
      searchMatch: {
        username: user.username.toLowerCase().includes(query.toLowerCase()),
        email: user.email.toLowerCase().includes(query.toLowerCase()),
        realName:
          user.realName?.toLowerCase().includes(query.toLowerCase()) || false
      }
    }));

    return successResponse({
      query,
      results: formattedResults,
      count: formattedResults.length
    });
  } catch (error) {
    console.error('用户搜索失败:', error);
    return errorResponse('用户搜索失败');
  }
}
