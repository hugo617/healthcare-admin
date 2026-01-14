/**
 * N-Admin 统一认证系统核心模块
 *
 * 此模块整合了 Admin 和 H5 系统的认证功能，提供统一的 API。
 *
 * @module auth-core
 */

// ==================== 类型定义 ====================
export type {
  ClientType,
  DeviceType,
  AuthUser,
  SessionInfo,
  AuthContext,
  LoginRequest,
  LoginResponse,
  CreateSessionParams,
  SessionListItem,
  TokenPayload,
  CookieConfig
} from './types';

// ==================== 类型辅助函数 ====================
export {
  getCookieName,
  deviceTypeToClientType,
  clientTypeToDeviceType
} from './types';

// ==================== Token 管理 ====================
export {
  generateToken,
  verifyToken,
  hashToken,
  verifyTokenHash,
  extractTokenFromRequest,
  isTokenExpiringSoon,
  getTokenRemainingTime
} from './token-manager';

// ==================== Session 管理 ====================
export {
  createSession,
  verifySession,
  revokeSession,
  revokeAllUserSessions,
  revokeOtherSessions,
  cleanupExpiredSessions,
  getUserSessions,
  getSessionById,
  getSessionByTokenHash,
  getActiveSessionCount
} from './session-manager';

// ==================== 客户端检测 ====================
export {
  detectClientTypeFromPath,
  detectClientTypeFromHeader,
  detectClientType,
  detectDeviceTypeFromUserAgent,
  getCookieName as getCookieNameForClient,
  extractToken,
  isH5Client,
  isAdminClient
} from './client-detector';

// ==================== 便捷 API ====================

/**
 * 从请求中获取认证上下文
 *
 * 综合使用 Token 验证和 Session 验证，返回完整的认证上下文
 *
 * @param request Next.js Request 对象
 * @returns 认证上下文，认证失败返回 null
 */
import { verifyToken } from './token-manager';
import { verifySession } from './session-manager';
import { extractToken } from './client-detector';
import type { AuthContext } from './types';

export async function getAuthContext(
  request: Request
): Promise<AuthContext | null> {
  // 1. 提取 token
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  // 2. 验证 token 获取用户信息
  const user = verifyToken(token);
  if (!user) {
    return null;
  }

  // 3. 从 token payload 中获取 sessionId（如果有）
  // 注意：需要确保 token 生成时包含 sessionId
  // 这里暂时返回不包含 session 的上下文
  // TODO: 在 token 中添加 sessionId 字段

  return {
    user,
    // session: await verifySession(sessionId, token), // 需要 sessionId
    session: {
      id: '',
      userId: user.id,
      deviceType: 'web',
      ipAddress: '',
      expiresAt: new Date(),
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      isActive: true
    },
    clientType: 'admin' // TODO: 从请求中检测
  };
}
