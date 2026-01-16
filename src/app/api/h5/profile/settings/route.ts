import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyH5Token } from '@/lib/h5-auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

// PATCH /api/h5/profile/settings - 更新用户设置
export async function PATCH(request: NextRequest) {
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
    const { notificationsEnabled, darkMode } = body;

    // 获取当前用户 metadata
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return errorResponse('用户不存在');
    }

    // 合并 metadata
    const currentMetadata = (currentUser.metadata as any) || {};
    const newMetadata = {
      ...currentMetadata,
      ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      ...(darkMode !== undefined && { darkMode })
    };

    // 更新用户 metadata
    await db
      .update(users)
      .set({ metadata: newMetadata })
      .where(eq(users.id, user.id));

    return successResponse({
      message: '设置已更新',
      metadata: newMetadata
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    return errorResponse('更新设置失败');
  }
}

// GET /api/h5/profile/settings - 获取用户设置
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

    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return errorResponse('用户不存在');
    }

    const metadata = (currentUser.metadata as any) || {};

    return successResponse({
      notificationsEnabled: metadata.notificationsEnabled ?? true,
      darkMode: metadata.darkMode ?? false
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    return errorResponse('获取设置失败');
  }
}
