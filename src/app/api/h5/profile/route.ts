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
        tenantId: users.tenantId
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

    return successResponse({
      ...userData,
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
    const { realName, email, phone } = body;

    // 验证真实姓名
    if (realName !== undefined) {
      if (
        typeof realName !== 'string' ||
        realName.length < 2 ||
        realName.length > 50
      ) {
        return errorResponse('真实姓名长度必须在 2-50 个字符之间');
      }
    }

    // 验证邮箱格式
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse('邮箱格式不正确');
      }

      // 检查邮箱唯一性（排除自己）
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
    }

    // 构建更新数据
    const updateData: any = {};
    if (realName !== undefined) updateData.realName = realName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // 更新用户信息
    await db.update(users).set(updateData).where(eq(users.id, user.id));

    // 获取更新后的用户信息
    const [updatedUser] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        realName: users.realName,
        avatar: users.avatar
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return successResponse(updatedUser);
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return errorResponse('更新用户信息失败');
  }
}
