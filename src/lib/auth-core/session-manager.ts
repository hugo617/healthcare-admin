/**
 * Session Manager
 *
 * 负责用户会话的创建、验证、撤销和清理
 * 统一 Admin 和 H5 系统的会话管理
 */

import { eq, and, lt, or, isNull, desc, ne } from 'drizzle-orm';
import { db } from '@/db';
import { userSessions } from '@/db/schema';
import { randomUUID } from 'crypto';
import type {
  CreateSessionParams,
  SessionInfo,
  SessionListItem,
  ClientType,
  DeviceType
} from './types';
import { hashToken } from './token-manager';
import { clientTypeToDeviceType } from './types';

/**
 * 会话默认有效期（24小时）
 */
const DEFAULT_SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * 解析 User-Agent 获取设备信息
 */
function parseUserAgent(userAgent: string): {
  deviceType: DeviceType;
  platform?: string;
  deviceName?: string;
} {
  const ua = userAgent.toLowerCase();

  // 检测移动设备
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    if (/iphone|ipad|ipod/.test(ua)) {
      return {
        deviceType: 'mobile',
        platform: 'iOS',
        deviceName: 'iPhone/iPad'
      };
    }
    if (/android/.test(ua)) {
      return {
        deviceType: 'mobile',
        platform: 'Android',
        deviceName: 'Android Device'
      };
    }
    return {
      deviceType: 'mobile',
      platform: 'Mobile',
      deviceName: 'Mobile Device'
    };
  }

  // 检测桌面平台
  if (/windows/.test(ua)) {
    return { deviceType: 'web', platform: 'Windows', deviceName: 'Windows PC' };
  }
  if (/macintosh|mac os x/.test(ua)) {
    return { deviceType: 'web', platform: 'macOS', deviceName: 'Mac' };
  }
  if (/linux/.test(ua)) {
    return { deviceType: 'web', platform: 'Linux', deviceName: 'Linux PC' };
  }

  // 默认返回 Web
  return { deviceType: 'web', platform: 'Unknown', deviceName: 'Web Browser' };
}

/**
 * 创建会话记录
 *
 * @param params 会话创建参数
 * @returns 创建的会话信息
 */
export async function createSession(
  params: CreateSessionParams
): Promise<SessionInfo> {
  const {
    userId,
    clientType,
    token,
    ipAddress,
    userAgent,
    deviceId,
    deviceName: customDeviceName
  } = params;

  // 解析 User-Agent 获取设备信息
  const {
    deviceType,
    platform,
    deviceName: parsedDeviceName
  } = parseUserAgent(userAgent);

  // 生成唯一的 sessionId
  const sessionId = randomUUID();

  // 计算过期时间
  const expiresAt = new Date(Date.now() + DEFAULT_SESSION_EXPIRY_MS);

  // 生成 token 哈希
  const tokenHash = hashToken(token);

  // 插入会话记录
  const [session] = await db
    .insert(userSessions)
    .values({
      userId,
      sessionId,
      deviceId,
      deviceType,
      deviceName: customDeviceName || parsedDeviceName,
      platform,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
      lastAccessedAt: new Date()
    })
    .returning();

  return {
    id: session.sessionId,
    userId: session.userId,
    deviceId: session.deviceId ?? undefined,
    deviceType: session.deviceType as DeviceType,
    deviceName: session.deviceName ?? undefined,
    platform: session.platform ?? undefined,
    ipAddress: session.ipAddress ?? '',
    expiresAt: session.expiresAt,
    createdAt: session.createdAt ?? new Date(),
    lastAccessedAt: session.lastAccessedAt ?? new Date(),
    isActive: session.isActive ?? false
  };
}

/**
 * 验证会话并更新 lastAccessedAt
 *
 * @param sessionId 会话 ID
 * @param token JWT token（用于验证哈希）
 * @returns 会话信息，验证失败返回 null
 */
export async function verifySession(
  sessionId: string,
  token: string
): Promise<SessionInfo | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [session] = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.sessionId, sessionId),
        eq(userSessions.tokenHash, tokenHash),
        eq(userSessions.isActive, true)
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  // 检查是否过期
  if (session.expiresAt < now) {
    // 标记为不活跃
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.sessionId, sessionId));
    return null;
  }

  // 更新最后访问时间（仅在超过5分钟时更新，避免频繁写入）
  const lastAccessedAt = session.lastAccessedAt ?? now;
  const timeSinceLastAccess = now.getTime() - lastAccessedAt.getTime();
  if (timeSinceLastAccess > 5 * 60 * 1000) {
    await db
      .update(userSessions)
      .set({ lastAccessedAt: now })
      .where(eq(userSessions.sessionId, sessionId));
  }

  return {
    id: session.sessionId,
    userId: session.userId,
    deviceId: session.deviceId ?? undefined,
    deviceType: session.deviceType as DeviceType,
    deviceName: session.deviceName ?? undefined,
    platform: session.platform ?? undefined,
    ipAddress: session.ipAddress ?? '',
    expiresAt: session.expiresAt,
    createdAt: session.createdAt ?? new Date(),
    lastAccessedAt: session.lastAccessedAt ?? new Date(),
    isActive: session.isActive ?? false
  };
}

/**
 * 撤销指定会话
 *
 * @param sessionId 会话 ID
 * @returns 是否成功撤销
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const result = await db
    .update(userSessions)
    .set({ isActive: false })
    .where(eq(userSessions.sessionId, sessionId));

  return (result.rowCount ?? 0) > 0;
}

/**
 * 撤销用户所有会话
 *
 * @param userId 用户 ID
 * @param clientType 客户端类型（可选，只撤销指定客户端的会话）
 * @returns 撤销的会话数量
 */
export async function revokeAllUserSessions(
  userId: number,
  clientType?: ClientType
): Promise<number> {
  const conditions = [eq(userSessions.userId, userId)];

  if (clientType) {
    const deviceType = clientTypeToDeviceType(clientType);
    conditions.push(eq(userSessions.deviceType, deviceType));
  }

  const result = await db
    .update(userSessions)
    .set({ isActive: false })
    .where(and(...conditions));

  return result.rowCount ?? 0;
}

/**
 * 撤销用户除当前会话外的所有会话
 *
 * @param userId 用户 ID
 * @param currentSessionId 当前会话 ID（保留）
 * @param clientType 客户端类型（可选）
 * @returns 撤销的会话数量
 */
export async function revokeOtherSessions(
  userId: number,
  currentSessionId: string,
  clientType?: ClientType
): Promise<number> {
  const conditions = [
    eq(userSessions.userId, userId),
    eq(userSessions.isActive, true)
  ];

  if (clientType) {
    const deviceType = clientTypeToDeviceType(clientType);
    conditions.push(eq(userSessions.deviceType, deviceType));
  }

  // Add condition to exclude current session
  conditions.push(ne(userSessions.sessionId, currentSessionId));

  const result = await db
    .update(userSessions)
    .set({ isActive: false })
    .where(and(...conditions));

  return result.rowCount ?? 0;
}

/**
 * 清理过期会话
 *
 * 定期调用此函数以清理数据库中的过期会话记录
 * 建议使用 cron job 或定时任务执行
 *
 * @param daysToKeep 保留天数（默认 30 天）
 * @returns 清理的会话数量
 */
export async function cleanupExpiredSessions(
  daysToKeep: number = 30
): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await db
    .delete(userSessions)
    .where(
      or(
        and(
          eq(userSessions.isActive, false),
          lt(userSessions.expiresAt, cutoffDate)
        ),
        lt(userSessions.expiresAt, new Date())
      )
    );

  return result.rowCount ?? 0;
}

/**
 * 获取用户的所有活动会话列表
 *
 * @param userId 用户 ID
 * @param currentSessionId 当前会话 ID（用于标记）
 * @returns 会话列表
 */
export async function getUserSessions(
  userId: number,
  currentSessionId?: string
): Promise<SessionListItem[]> {
  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), eq(userSessions.isActive, true))
    )
    .orderBy(desc(userSessions.lastAccessedAt));

  return sessions.map((session) => ({
    id: session.sessionId,
    userId: session.userId,
    deviceType: session.deviceType as DeviceType,
    deviceName: session.deviceName ?? undefined,
    platform: session.platform ?? undefined,
    ipAddress: session.ipAddress ?? '',
    expiresAt: session.expiresAt,
    lastAccessedAt: session.lastAccessedAt ?? new Date(),
    isActive: session.isActive ?? false,
    isCurrent: session.sessionId === currentSessionId
  }));
}

/**
 * 根据 sessionId 获取会话信息（不更新访问时间）
 *
 * @param sessionId 会话 ID
 * @returns 会话信息或 null
 */
export async function getSessionById(
  sessionId: string
): Promise<SessionInfo | null> {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.sessionId, sessionId))
    .limit(1);

  if (!session) {
    return null;
  }

  return {
    id: session.sessionId,
    userId: session.userId,
    deviceId: session.deviceId ?? undefined,
    deviceType: session.deviceType as DeviceType,
    deviceName: session.deviceName ?? undefined,
    platform: session.platform ?? undefined,
    ipAddress: session.ipAddress ?? '',
    expiresAt: session.expiresAt,
    createdAt: session.createdAt ?? new Date(),
    lastAccessedAt: session.lastAccessedAt ?? new Date(),
    isActive: session.isActive ?? false
  };
}

/**
 * 根据 token 哈希查找会话
 *
 * @param tokenHash Token 哈希值
 * @returns 会话信息或 null
 */
export async function getSessionByTokenHash(
  tokenHash: string
): Promise<SessionInfo | null> {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.tokenHash, tokenHash))
    .limit(1);

  if (!session) {
    return null;
  }

  return {
    id: session.sessionId,
    userId: session.userId,
    deviceId: session.deviceId ?? undefined,
    deviceType: session.deviceType as DeviceType,
    deviceName: session.deviceName ?? undefined,
    platform: session.platform ?? undefined,
    ipAddress: session.ipAddress ?? '',
    expiresAt: session.expiresAt,
    createdAt: session.createdAt ?? new Date(),
    lastAccessedAt: session.lastAccessedAt ?? new Date(),
    isActive: session.isActive ?? false
  };
}

/**
 * 获取用户的活跃会话数量
 *
 * @param userId 用户 ID
 * @returns 活跃会话数量
 */
export async function getActiveSessionCount(userId: number): Promise<number> {
  const [result] = await db
    .select({ count: userSessions.userId })
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), eq(userSessions.isActive, true))
    );

  return result?.count ?? 0;
}
