/**
 * Token 管理器
 *
 * 负责JWT token的生成、验证和哈希处理
 * 统一 Admin 和 H5 系统的 token 操作
 */

import { sign, verify } from 'jsonwebtoken';
import { createHash } from 'crypto';
import type { TokenPayload, AuthUser } from './types';

/**
 * JWT 配置
 */
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = '24h'; // 24小时（默认）
const JWT_EXPIRES_IN_REMEMBER = '30d'; // 30天（记住我）

/**
 * 生成 JWT Token
 *
 * @param user 用户信息
 * @param rememberMe 是否记住登录（延长过期时间到30天）
 */
export function generateToken(
  user: AuthUser,
  rememberMe: boolean = false
): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    avatar: user.avatar,
    roleId: user.roleId,
    tenantId: user.tenantId,
    isSuperAdmin: user.isSuperAdmin
  };

  const expiresIn = rememberMe ? JWT_EXPIRES_IN_REMEMBER : JWT_EXPIRES_IN;
  return sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 验证 JWT Token
 *
 * @param token JWT token 字符串
 * @returns 解码后的用户信息，验证失败返回 null
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = verify(token, JWT_SECRET) as TokenPayload;

    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      phone: decoded.phone,
      avatar: decoded.avatar,
      roleId: decoded.roleId,
      tenantId: Number(decoded.tenantId || 1),
      isSuperAdmin: decoded.isSuperAdmin || false
    };
  } catch (error) {
    // Token 无效或过期
    return null;
  }
}

/**
 * 生成 Token 哈希值
 *
 * 用于安全地存储在数据库中，避免直接存储原始 token
 *
 * @param token 原始 JWT token
 * @returns SHA-256 哈希值
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * 验证 Token 哈希
 *
 * @param token 原始 token
 * @param hash 哈希值
 * @returns 是否匹配
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

/**
 * 从 Authorization Header 或 Cookie 中提取 Token
 *
 * @param request Next.js Request 对象
 * @param cookieName Cookie 名称（默认 'admin_token'）
 * @returns Token 字符串或 null
 */
export function extractTokenFromRequest(
  request: Request,
  cookieName: string = 'admin_token'
): string | null {
  // 1. 首先尝试从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. 从 Cookie 获取
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    return cookies[cookieName] || cookies['token'] || null;
  }

  return null;
}

/**
 * 解析 Cookie 字符串为对象
 *
 * @param cookieHeader Cookie 请求头字符串
 * @returns Cookie 键值对对象
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * 检查 Token 是否即将过期
 *
 * @param token JWT token
 * @param thresholdMinutes 过期阈值（分钟），默认 30 分钟
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdMinutes: number = 30
): boolean {
  try {
    const decoded = verify(token, JWT_SECRET) as TokenPayload;
    if (!decoded.exp) return false;

    const expirationTime = decoded.exp * 1000; // 转换为毫秒
    const thresholdTime = Date.now() + thresholdMinutes * 60 * 1000;

    return expirationTime <= thresholdTime;
  } catch {
    return true; // 无效的 token 视为已过期
  }
}

/**
 * 获取 Token 剩余有效时间（秒）
 *
 * @param token JWT token
 * @returns 剩余秒数，-1 表示已过期或无效
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const decoded = verify(token, JWT_SECRET) as TokenPayload;
    if (!decoded.exp) return -1;

    const expirationTime = decoded.exp * 1000;
    const remaining = Math.max(0, expirationTime - Date.now());

    return Math.floor(remaining / 1000);
  } catch {
    return -1;
  }
}
