import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, userOrganizations, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyH5Token } from '@/lib/h5-auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

// GET /api/h5/profile - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    const user = verifyH5Token(token);
    if (!user) {
      return unauthorizedResponse('无效的登录信息');
    }

    // 获取用户完整信息
    const [userData] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        realName: users.realName,
        avatar: users.avatar,
        metadata: users.metadata,
        tenantId: users.tenantId,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return errorResponse('用户不存在');
    }

    // 获取用户组织信息
    const userOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        position: userOrganizations.position,
        isMain: userOrganizations.isMain
      })
      .from(userOrganizations)
      .innerJoin(
        organizations,
        eq(userOrganizations.organizationId, organizations.id)
      )
      .where(eq(userOrganizations.userId, user.id));

    // 找到主组织，如果没有则取第一个
    const mainOrg = userOrgs.find((org) => org.isMain) || userOrgs[0];

    // 提取 metadata 中的昵称
    const metadata = (userData.metadata as any) || {};

    return successResponse({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      avatar: userData.avatar,
      nickname: metadata.nickname || userData.realName || userData.username,
      createdAt: userData.createdAt,
      organization: mainOrg
        ? {
            id: mainOrg.id,
            name: mainOrg.name,
            position: mainOrg.position
          }
        : null
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return errorResponse('获取用户信息失败');
  }
}

// PUT /api/h5/profile - 更新个人信息
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    const user = verifyH5Token(token);
    if (!user) {
      return unauthorizedResponse('无效的登录信息');
    }

    const body = await request.json();
    const { username, nickname, phone, email } = body;

    // 获取当前用户 metadata
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return errorResponse('用户不存在');
    }

    // 构建更新数据
    const updateData: any = {};
    const currentMetadata = (currentUser.metadata as any) || {};

    // 验证并更新用户名
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length < 2) {
        return errorResponse('用户名至少需要 2 个字符');
      }

      // 检查用户名唯一性（排除自己）
      const existingUsername = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.username, username.trim()),
            eq(users.tenantId, user.tenantId || 1)
          )
        )
        .limit(1);

      if (existingUsername.length > 0 && existingUsername[0].id !== user.id) {
        return errorResponse('该用户名已被使用');
      }

      updateData.username = username.trim();
    }

    // 验证并更新昵称
    if (nickname !== undefined) {
      if (nickname && (typeof nickname !== 'string' || nickname.length > 20)) {
        return errorResponse('昵称不能超过 20 个字符');
      }
      currentMetadata.nickname = nickname || null;
      updateData.metadata = currentMetadata;
    }

    // 验证手机号格式
    if (phone !== undefined) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (phone && !phoneRegex.test(phone)) {
        return errorResponse('手机号格式不正确');
      }

      // 检查手机号唯一性（排除自己）
      if (phone) {
        const existingPhone = await db
          .select()
          .from(users)
          .where(
            and(eq(users.phone, phone), eq(users.tenantId, user.tenantId || 1))
          )
          .limit(1);

        if (existingPhone.length > 0 && existingPhone[0].id !== user.id) {
          return errorResponse('该手机号已被使用');
        }
      }
      updateData.phone = phone || null;
    }

    // 验证邮箱格式
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        return errorResponse('邮箱格式不正确');
      }

      // 检查邮箱唯一性（排除自己）
      if (email) {
        const existingEmail = await db
          .select()
          .from(users)
          .where(
            and(eq(users.email, email), eq(users.tenantId, user.tenantId || 1))
          )
          .limit(1);

        if (existingEmail.length > 0 && existingEmail[0].id !== user.id) {
          return errorResponse('该邮箱已被使用');
        }
      }
      updateData.email = email || null;
    }

    // 更新用户信息
    await db.update(users).set(updateData).where(eq(users.id, user.id));

    // 获取更新后的用户信息
    const [updatedUser] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        metadata: users.metadata
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const updatedMetadata = (updatedUser.metadata as any) || {};

    return successResponse({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      nickname:
        updatedMetadata.nickname || currentUser.realName || updatedUser.username
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return errorResponse('更新用户信息失败');
  }
}
