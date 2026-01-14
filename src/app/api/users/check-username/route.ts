import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull, ne, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/service/response';

export async function GET(request: Request) {
  try {
    const currentUser = getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const username = searchParams.get('username')?.trim();
    const excludeId = searchParams.get('excludeId');

    if (!username) {
      return errorResponse('用户名不能为空');
    }

    // 用户名格式验证
    if (username.length < 3 || username.length > 50) {
      return errorResponse('用户名长度必须在3-50个字符之间');
    }

    // 检查用户名格式（只允许字母、数字、下划线、连字符）
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return errorResponse('用户名只能包含字母、数字、下划线和连字符');
    }

    // 构建查询条件
    const conditions = [
      eq(users.username, username),
      eq(users.isDeleted, false)
    ];

    // 租户隔离
    const queryTenantId = currentUser?.tenantId || 1;
    if (!currentUser?.isSuperAdmin) {
      conditions.push(eq(users.tenantId, BigInt(queryTenantId)));
    }

    // 排除特定用户ID（用于编辑时检查）
    if (excludeId) {
      conditions.push(sql`${users.id} != ${parseInt(excludeId)}`);
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    const isAvailable = existingUser.length === 0;

    return successResponse({
      username,
      isAvailable,
      message: isAvailable ? '用户名可用' : '用户名已被使用'
    });
  } catch (error) {
    console.error('检查用户名可用性失败:', error);
    return errorResponse('检查用户名可用性失败');
  }
}
