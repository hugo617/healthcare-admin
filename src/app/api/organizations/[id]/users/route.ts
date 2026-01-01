import { db } from '@/db';
import { userOrganizations, users, organizations } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { Logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/service/response';

// 获取组织的用户列表
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = BigInt(params.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 验证分页参数
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const offset = (validPage - 1) * validLimit;

    // 检查组织是否存在
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (org.length === 0) {
      return errorResponse('组织不存在');
    }

    // 获取总数
    const [totalResult] = await db
      .select({ count: count() })
      .from(userOrganizations)
      .where(eq(userOrganizations.organizationId, id));

    const total = totalResult.count;

    // 获取用户列表
    const userList = await db
      .select({
        id: users.id,
        username: users.username,
        realName: users.realName,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        status: users.status,
        position: userOrganizations.position,
        isMain: userOrganizations.isMain,
        joinedAt: userOrganizations.joinedAt
      })
      .from(userOrganizations)
      .innerJoin(users, eq(userOrganizations.userId, users.id))
      .where(eq(userOrganizations.organizationId, id))
      .limit(validLimit)
      .offset(offset)
      .orderBy(userOrganizations.joinedAt);

    const totalPages = Math.ceil(total / validLimit);

    return successResponse(userList, {
      page: validPage,
      limit: validLimit,
      total,
      totalPages
    });
  } catch (error) {
    console.error('获取组织用户列表失败:', error);
    return errorResponse('获取组织用户列表失败');
  }
}

// 添加用户到组织
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = getCurrentUser(request);
  const logger = new Logger('组织用户管理', currentUser?.id);

  try {
    const id = BigInt(params.id);
    const body = await request.json();
    const { userId, position, isMain = false } = body;

    // 验证必填字段
    if (!userId) {
      return errorResponse('用户ID不能为空');
    }

    // 检查组织是否存在
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (org.length === 0) {
      return errorResponse('组织不存在');
    }

    // 检查用户是否存在
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return errorResponse('用户不存在');
    }

    // 检查用户是否已在组织中
    const existing = await db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return errorResponse('用户已在该组织中');
    }

    // 如果设置为主组织，需要先清除用户的其他主组织标记
    if (isMain) {
      await db
        .update(userOrganizations)
        .set({ isMain: false })
        .where(eq(userOrganizations.userId, userId));
    }

    // 添加用户到组织
    await db.insert(userOrganizations).values({
      userId,
      organizationId: id,
      position: position || null,
      isMain,
      joinedAt: new Date()
    });

    // 记录日志
    await logger.info('添加用户到组织', '用户添加到组织成功', {
      orgId: id,
      orgName: org[0].name,
      userId,
      username: user[0].username,
      position,
      isMain,
      operatorId: currentUser?.id,
      operatorName: currentUser?.username,
      timestamp: new Date().toISOString()
    });

    return successResponse({
      message: '用户添加到组织成功'
    });
  } catch (error) {
    await logger.error('添加用户到组织', '添加用户到组织失败：系统错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operatorId: currentUser?.id,
      operatorName: currentUser?.username
    });

    console.error('添加用户到组织失败:', error);
    return errorResponse('添加用户到组织失败');
  }
}

// 从组织移除用户
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = getCurrentUser(request);
  const logger = new Logger('组织用户管理', currentUser?.id);

  try {
    const id = BigInt(params.id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return errorResponse('用户ID不能为空');
    }

    // 检查组织是否存在
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (org.length === 0) {
      return errorResponse('组织不存在');
    }

    // 检查用户是否在组织中
    const existing = await db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, parseInt(userId)),
          eq(userOrganizations.organizationId, id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return errorResponse('用户不在该组织中');
    }

    // 从组织移除用户
    await db
      .delete(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, parseInt(userId)),
          eq(userOrganizations.organizationId, id)
        )
      );

    // 记录日志
    await logger.info('从组织移除用户', '从组织移除用户成功', {
      orgId: id,
      orgName: org[0].name,
      userId: parseInt(userId),
      operatorId: currentUser?.id,
      operatorName: currentUser?.username,
      timestamp: new Date().toISOString()
    });

    return successResponse({
      message: '用户从组织移除成功'
    });
  } catch (error) {
    await logger.error('从组织移除用户', '从组织移除用户失败：系统错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operatorId: currentUser?.id,
      operatorName: currentUser?.username
    });

    console.error('从组织移除用户失败:', error);
    return errorResponse('从组织移除用户失败');
  }
}
