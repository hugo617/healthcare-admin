/**
 * 统一认证系统核心类型定义
 *
 * 此文件定义了 Admin 和 H5 系统共享的所有认证相关类型，
 * 解决了之前 auth.ts 和 h5-auth.ts 类型不一致的问题。
 */

/**
 * 客户端类型枚举
 */
export type ClientType = 'admin' | 'h5';

/**
 * 设备类型枚举（对应数据库 deviceTypeEnum）
 */
export type DeviceType = 'web' | 'mobile' | 'desktop';

/**
 * 统一用户类型
 *
 * 解决了之前 User.tenantId 为 number，而 H5User.tenantId 为 bigint 的问题
 * 所有系统统一使用此类型
 */
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  phone?: string;
  avatar: string;
  roleId: number;
  tenantId: number; // 统一为 number 类型
  isSuperAdmin: boolean;
}

/**
 * 会话信息（来自 user_sessions 表）
 */
export interface SessionInfo {
  id: string; // sessionId (UUID)
  userId: number;
  deviceId?: string;
  deviceType: DeviceType;
  deviceName?: string;
  platform?: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  isActive: boolean;
}

/**
 * 完整认证上下文
 *
 * 包含用户信息、会话信息和客户端类型
 * 用于 API 路由和服务端组件
 */
export interface AuthContext {
  user: AuthUser;
  session: SessionInfo;
  clientType: ClientType;
}

/**
 * 登录请求类型
 */
export interface LoginRequest {
  // 密码登录字段
  account?: string; // 用户名/邮箱/手机号
  password?: string;

  // 短信登录字段
  phone?: string;
  code?: string;

  // 登录类型
  loginType: 'password' | 'sms';

  // 客户端标识（必填）
  clientType: ClientType;

  // 设备信息（可选，用于会话跟踪）
  deviceId?: string;
  deviceName?: string;
}

/**
 * 登录响应类型
 */
export interface LoginResponse {
  user: AuthUser;
  token: string;
  session: {
    id: string;
    expiresAt: string;
    deviceType: DeviceType;
  };
}

/**
 * Session 创建参数
 */
export interface CreateSessionParams {
  userId: number;
  clientType: ClientType;
  token: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  deviceName?: string;
}

/**
 * 会话列表项类型
 */
export interface SessionListItem {
  id: string;
  userId: number;
  deviceType: DeviceType;
  deviceName?: string;
  platform?: string;
  ipAddress: string;
  expiresAt: Date;
  lastAccessedAt: Date;
  isActive: boolean;
  isCurrent: boolean; // 是否为当前会话
}

/**
 * Token 负载类型（JWT payload）
 */
export interface TokenPayload {
  id: number;
  email: string;
  username: string;
  phone?: string;
  avatar: string;
  roleId: number;
  tenantId: number;
  isSuperAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Cookie 配置类型
 */
export interface CookieConfig {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
}

/**
 * 获取客户端 Cookie 名称
 *
 * 统一使用 auth_token，不再区分 admin 和 h5
 */
export function getCookieName(clientType: ClientType): string {
  return 'auth_token';
}

/**
 * 从 deviceType 推断 ClientType
 */
export function deviceTypeToClientType(deviceType: DeviceType): ClientType {
  return deviceType === 'mobile' ? 'h5' : 'admin';
}

/**
 * 从 ClientType 推断 deviceType
 */
export function clientTypeToDeviceType(clientType: ClientType): DeviceType {
  return clientType === 'h5' ? 'mobile' : 'web';
}
