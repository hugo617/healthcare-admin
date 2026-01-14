import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * H5 登录 API（已废弃）
 *
 * @deprecated 此 API 已废弃，请使用 /api/auth/login 并设置 clientType=h5
 *
 * 此端点保留用于向后兼容，将在未来版本中移除。
 * 新的统一登录接口支持相同的密码和短信验证码登录功能。
 *
 * 迁移指南：
 *   密码登录: POST /api/auth/login { account, password, loginType: 'password', clientType: 'h5' }
 *   短信登录: POST /api/auth/login { phone, code, loginType: 'sms', clientType: 'h5' }
 */
export async function POST(request: Request) {
  try {
    // 记录废弃警告日志
    await logger.warn('用户认证', 'H5登录', '使用已废弃的API', {
      message: '请使用 /api/auth/login 并设置 clientType=h5',
      deprecatedApi: '/api/auth/h5-login',
      recommendedApi: '/api/auth/login',
      timestamp: new Date().toISOString()
    });

    // 获取请求体
    const body = await request.json();

    // 转发到统一登录 API，添加 clientType 参数
    const loginUrl = new URL('/api/auth/login', request.url);

    const forwardResponse = await fetch(loginUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 转发所有相关 headers
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || ''
      },
      body: JSON.stringify({
        ...body,
        clientType: 'h5' // 强制设置为 H5 客户端
      })
    });

    // 获取响应数据
    const responseData = await forwardResponse.json();

    // 如果是成功响应，添加废弃警告
    if (forwardResponse.ok) {
      responseData.deprecatedWarning = {
        message: '此 API 已废弃，请使用 /api/auth/login 并设置 clientType=h5',
        deprecatedApi: '/api/auth/h5-login',
        recommendedApi: '/api/auth/login',
        documentation: '请参考最新的 API 文档进行迁移'
      };
    }

    // 构建响应，复制 cookies
    const response = NextResponse.json(responseData, {
      status: forwardResponse.status
    });

    // 复制 Set-Cookie headers
    const setCookieHeaders = forwardResponse.headers.getSetCookie();
    for (const cookie of setCookieHeaders) {
      response.headers.append('Set-Cookie', cookie);
    }

    return response;
  } catch (error) {
    // 记录错误日志
    await logger.error('用户认证', 'H5登录', '废弃API转发错误', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: false,
        message: '服务器错误',
        deprecatedWarning: {
          message: '此 API 已废弃，请使用 /api/auth/login 并设置 clientType=h5'
        }
      },
      { status: 500 }
    );
  }
}
