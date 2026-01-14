import { NextResponse } from 'next/server';
import { successResponse } from '@/service/response';
import { verify } from 'jsonwebtoken';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // 获取 h5_token 并解析用户信息
    const token = request.headers.get('cookie')?.match(/h5_token=([^;]+)/)?.[1];
    let userId: number | undefined;
    let username: string | undefined;

    if (token) {
      try {
        const decoded = verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as any;
        userId = decoded.id;
        username = decoded.username;
      } catch (error) {
        // Token无效，但仍然允许登出
      }
    }

    // 记录登出日志
    await logger.info('H5认证', 'H5登出', 'H5用户退出系统', {
      userId,
      username,
      logoutTime: new Date().toISOString(),
      hasValidToken: !!token
    });

    const response = successResponse('退出成功');

    // 清除 H5 系统专用 cookie
    response.cookies.delete('h5_token');

    return response;
  } catch (error) {
    // 记录登出错误日志
    await logger.error('H5认证', 'H5登出', '登出过程发生错误', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    const response = successResponse('退出成功');
    response.cookies.delete('h5_token');
    return response;
  }
}
