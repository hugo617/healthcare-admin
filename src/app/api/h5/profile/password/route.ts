import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyH5Token } from '@/lib/h5-auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

// POST /api/h5/profile/password - 修改密码
export async function POST(request: NextRequest) {
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
    const { newPassword } = body;

    // 验证新密码
    if (!newPassword || typeof newPassword !== 'string') {
      return errorResponse('请输入新密码');
    }

    if (newPassword.length < 6) {
      return errorResponse('新密码长度至少为6位');
    }

    if (newPassword.length > 50) {
      return errorResponse('新密码长度不能超过50位');
    }

    // 获取当前用户
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return errorResponse('用户不存在');
    }

    // 加密新密码
    const saltRounds = Number(process.env.SALT_ROUNDS || 12);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return successResponse({
      message: '密码修改成功',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return errorResponse('修改密码失败');
  }
}
