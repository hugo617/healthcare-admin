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
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/h5/profile/avatar - 上传头像
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('请选择要上传的文件');
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('仅支持 JPG 和 PNG 格式的图片');
    }

    // 验证文件大小（2MB）
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse('图片大小不能超过 2MB');
    }

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'avatars');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成文件名：用户ID_时间戳.扩展名
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${user.id}_${Date.now()}.${ext}`;
    const filepath = join(uploadDir, filename);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 更新用户头像
    const avatarUrl = `/avatars/${filename}`;
    await db
      .update(users)
      .set({ avatar: avatarUrl })
      .where(eq(users.id, user.id));

    return successResponse({
      url: avatarUrl,
      message: '头像上传成功'
    });
  } catch (error) {
    console.error('上传头像失败:', error);
    return errorResponse('上传头像失败');
  }
}
