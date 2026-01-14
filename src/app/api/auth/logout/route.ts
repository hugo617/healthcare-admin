import { NextResponse } from 'next/server';

// Force Node.js runtime - auth-core uses crypto module
export const runtime = 'nodejs';
import { successResponse } from '@/service/response';
import { logger } from '@/lib/logger';
import {
  verifyToken,
  extractToken,
  revokeSession,
  getCookieName,
  type ClientType
} from '@/lib/auth-core';

/**
 * 从 Cookie 中提取 Token
 */
function extractTokenFromCookie(
  cookieHeader: string | null,
  cookieName: string
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  // 优先读取统一的 auth_token，然后是旧 cookie
  return (
    cookies['auth_token'] ||
    cookies[cookieName] ||
    cookies['admin_token'] ||
    cookies['h5_token'] ||
    cookies['token'] ||
    null
  );
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');

    // 优先尝试从统一 auth_token 提取，然后尝试旧的 cookie
    let token = extractTokenFromCookie(cookieHeader, 'auth_token');
    let clientType: ClientType = 'admin';

    // 如果没有找到 auth_token，尝试 admin_token
    if (!token) {
      token = extractTokenFromCookie(cookieHeader, 'admin_token');
    }

    // 如果没有找到 admin_token，尝试 h5_token
    if (!token) {
      token = extractTokenFromCookie(cookieHeader, 'h5_token');
      clientType = 'h5';
    }

    // 如果还是没有，尝试通用的 token
    if (!token) {
      token = extractTokenFromCookie(cookieHeader, 'token');
    }

    let userId: number | undefined;
    let username: string | undefined;
    let sessionId: string | undefined;

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          userId = decoded.id;
          username = decoded.username;
          // TODO: 从 token payload 中获取 sessionId
          // sessionId = decoded.sessionId;
        }
      } catch (error) {
        // Token无效，但仍然允许登出
      }
    }

    // 撤销会话（如果有 sessionId）
    if (sessionId) {
      try {
        await revokeSession(sessionId);
      } catch (sessionError) {
        // 会话撤销失败不影响登出
        await logger.warn('用户认证', '用户登出', '会话撤销失败', {
          error:
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError),
          sessionId,
          userId
        });
      }
    }

    // 记录登出日志
    await logger.info('用户认证', '用户登出', '用户退出系统', {
      userId,
      username,
      clientType,
      sessionId,
      logoutTime: new Date().toISOString(),
      hasValidToken: !!token
    });

    const response = successResponse('退出成功');

    // 清除所有可能的 cookie（包括统一 auth_token 和旧 cookie）
    response.cookies.delete('auth_token');
    response.cookies.delete('admin_token');
    response.cookies.delete('h5_token');
    response.cookies.delete('token');

    return response;
  } catch (error) {
    // 记录登出错误日志
    await logger.error('用户认证', '用户登出', '登出过程发生错误', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    const response = successResponse('退出成功');
    // 清除所有可能的 cookie（包括统一 auth_token 和旧 cookie）
    response.cookies.delete('auth_token');
    response.cookies.delete('admin_token');
    response.cookies.delete('h5_token');
    response.cookies.delete('token');
    return response;
  }
}
