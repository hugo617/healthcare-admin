/**
 * Session Management API
 *
 * 提供会话管理功能：
 * - GET: 获取当前用户的所有活动会话列表
 * - DELETE: 撤销指定会话
 *
 * 子路由：
 * - DELETE /all: 撤销所有会话
 * - DELETE /others: 撤销其他会话
 */

import { NextResponse } from 'next/server';

// Force Node.js runtime - auth-core uses crypto module
export const runtime = 'nodejs';
import {
  successResponse,
  unauthorizedResponse,
  errorResponse
} from '@/service/response';
import { logger } from '@/lib/logger';
import {
  verifyToken,
  extractToken,
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
  revokeOtherSessions,
  getSessionByTokenHash,
  hashToken
} from '@/lib/auth-core';

/**
 * 获取客户端 IP 地址
 */
function getClientIp(request: Request): string {
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-client-ip'
  ];

  for (const header of headers) {
    const ip = request.headers.get(header);
    if (ip) {
      return ip.split(',')[0].trim();
    }
  }

  return '0.0.0.0';
}

/**
 * GET /api/auth/sessions
 * 获取当前用户的所有活动会话列表
 */
export async function GET(request: Request) {
  try {
    // 提取 token
    const token = extractToken(request);
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    // 验证 token 获取用户信息
    const user = verifyToken(token);
    if (!user) {
      return unauthorizedResponse('Token 无效或已过期');
    }

    // 获取当前会话 ID（通过 token hash 查找）
    const tokenHash = hashToken(token);
    const currentSession = await getSessionByTokenHash(tokenHash);
    const currentSessionId = currentSession?.id;

    // 获取用户的所有活动会话
    const sessions = await getUserSessions(user.id, currentSessionId);

    // 记录会话列表访问日志
    await logger.info(
      '会话管理',
      '查看会话列表',
      '用户查看活动会话',
      {
        userId: user.id,
        username: user.username,
        sessionCount: sessions.length,
        currentSessionId,
        clientIp: getClientIp(request)
      },
      user.id
    );

    return successResponse({
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceType: s.deviceType,
        deviceName: s.deviceName,
        platform: s.platform,
        ipAddress: s.ipAddress,
        expiresAt: s.expiresAt.toISOString(),
        lastAccessedAt: s.lastAccessedAt.toISOString(),
        isActive: s.isActive,
        isCurrent: s.isCurrent
      })),
      currentSessionId,
      total: sessions.length
    });
  } catch (error) {
    await logger.error('会话管理', '查看会话列表', '获取会话列表失败', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    return errorResponse('获取会话列表失败');
  }
}

/**
 * DELETE /api/auth/sessions
 * 撤销指定会话
 *
 * Query 参数:
 * - sessionId: 要撤销的会话 ID
 */
export async function DELETE(request: Request) {
  try {
    // 提取 token
    const token = extractToken(request);
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    // 验证 token 获取用户信息
    const user = verifyToken(token);
    if (!user) {
      return unauthorizedResponse('Token 无效或已过期');
    }

    // 解析 URL 查询参数
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action'); // 'all' 或 'others'

    // 获取当前会话 ID
    const tokenHash = hashToken(token);
    const currentSession = await getSessionByTokenHash(tokenHash);
    const currentSessionId = currentSession?.id;

    let revokedCount = 0;
    let actionType = '';

    // 执行相应的撤销操作
    if (action === 'all') {
      // 撤销所有会话
      revokedCount = await revokeAllUserSessions(user.id);
      actionType = '撤销所有会话';

      await logger.info(
        '会话管理',
        '撤销所有会话',
        '用户撤销了所有会话',
        {
          userId: user.id,
          username: user.username,
          revokedCount,
          clientIp: getClientIp(request)
        },
        user.id
      );
    } else if (action === 'others') {
      // 撤销其他会话
      if (!currentSessionId) {
        return errorResponse('无法识别当前会话');
      }
      revokedCount = await revokeOtherSessions(user.id, currentSessionId);
      actionType = '撤销其他会话';

      await logger.info(
        '会话管理',
        '撤销其他会话',
        '用户撤销了其他会话',
        {
          userId: user.id,
          username: user.username,
          currentSessionId,
          revokedCount,
          clientIp: getClientIp(request)
        },
        user.id
      );
    } else if (sessionId) {
      // 撤销指定会话
      const success = await revokeSession(sessionId);
      revokedCount = success ? 1 : 0;
      actionType = '撤销指定会话';

      // 检查是否是撤销当前会话
      const isRevokingCurrent = sessionId === currentSessionId;

      await logger.info(
        '会话管理',
        '撤销会话',
        isRevokingCurrent
          ? '用户撤销了当前会话（退出登录）'
          : '用户撤销了指定会话',
        {
          userId: user.id,
          username: user.username,
          sessionId,
          isCurrentSession: isRevokingCurrent,
          success,
          clientIp: getClientIp(request)
        },
        user.id
      );

      if (!success) {
        return errorResponse('会话不存在或已被撤销');
      }
    } else {
      return errorResponse('请指定要撤销的会话 ID 或操作类型');
    }

    return successResponse({
      message: `成功${actionType}`,
      revokedCount,
      currentSessionId
    });
  } catch (error) {
    await logger.error('会话管理', '撤销会话', '撤销会话失败', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });

    return errorResponse('撤销会话失败');
  }
}
