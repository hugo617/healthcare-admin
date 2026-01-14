/**
 * Auth Module - Unified Authentication System
 *
 * This module now uses auth-core for the actual implementation,
 * while maintaining backward compatibility with existing code.
 *
 * IMPORTANT: This file avoids importing database-dependent modules
 * (like session-manager) to maintain edge runtime compatibility for middleware.
 *
 * @module auth
 */

import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';
import type { ClientType, AuthUser } from '@/lib/auth-core';

// ==================== Type Definitions ====================

export interface User {
  id: number;
  email: string;
  username: string;
  avatar: string;
  roleId: number;
  tenantId: number;
  isSuperAdmin: boolean;
}

export interface Session {
  user: User;
}

// ==================== Auth Functions ====================

/**
 * Admin 系统服务端认证函数 - 只能在服务端组件中使用
 * 优先读取 auth_token cookie，回退到 admin_token cookie
 *
 * Edge runtime compatible - no database dependencies.
 *
 * @param request Optional Next.js Request object
 * @returns Session with user or null
 */
export async function adminAuth(request?: Request): Promise<Session | null> {
  let token: string | null = null;

  // 1. 优先使用 Next.js cookies() 函数读取 cookie
  try {
    const cookieStore = await cookies();
    // 优先读取统一 auth_token
    let cookie = cookieStore.get('auth_token');
    // 向后兼容：如果没有 auth_token，尝试读取旧的 admin_token
    if (!cookie) {
      cookie = cookieStore.get('admin_token');
    }
    token = cookie?.value || null;
  } catch {
    // cookies() 可能在某些上下文中不可用，尝试从 request 读取
  }

  // 2. 如果没有从 cookies() 获取到，尝试从 request 获取
  if (!token && request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  const user = verifyTokenInternal(token);
  if (!user) {
    return null;
  }

  return { user };
}

/**
 * 通用服务端认证函数 - 向后兼容，默认使用 adminAuth
 * 优先从Cookie读取，也支持Authorization header
 *
 * @param request Optional Next.js Request object
 * @returns Session with user or null
 */
export async function auth(request?: Request): Promise<Session | null> {
  return adminAuth(request);
}

/**
 * H5 系统服务端认证函数 - 只能在服务端组件中使用
 * 优先读取 auth_token cookie，回退到 h5_token cookie
 *
 * @param request Optional Next.js Request object
 * @returns Session with user or null
 */
export async function h5Auth(request?: Request): Promise<Session | null> {
  let token: string | null = null;

  // 1. 优先使用 Next.js cookies() 函数读取 cookie
  try {
    const cookieStore = await cookies();
    // 优先读取统一 auth_token
    let cookie = cookieStore.get('auth_token');
    // 向后兼容：如果没有 auth_token，尝试读取旧的 h5_token
    if (!cookie) {
      cookie = cookieStore.get('h5_token');
    }
    token = cookie?.value || null;
  } catch {
    // cookies() 可能在某些上下文中不可用，尝试从 request 读取
  }

  // 2. 如果没有从 cookies() 获取到，尝试从 request 获取
  if (!token && request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  const user = verifyTokenInternal(token);
  if (!user) {
    return null;
  }

  return { user };
}

/**
 * 验证token的工具函数 - 可以在任何地方使用
 *
 * Edge runtime compatible - no database dependencies.
 *
 * @param token JWT token string
 * @returns User object or null
 */
export function verifyToken(token: string): User | null {
  return verifyTokenInternal(token);
}

/**
 * Internal token verification with type conversion
 *
 * @param token JWT token string
 * @returns User object or null
 */
function verifyTokenInternal(token: string): User | null {
  try {
    const verified = verify(token, process.env.JWT_SECRET || 'secret') as any;
    return {
      id: verified.id,
      email: verified.email,
      username: verified.username,
      avatar: verified.avatar || '',
      roleId: verified.roleId,
      tenantId: Number(verified.tenantId || 1),
      isSuperAdmin: verified.isSuperAdmin || false
    };
  } catch {
    return null;
  }
}

/**
 * 从Request中获取当前用户信息 - 用于API routes
 * 支持 Cookie 和 Authorization Bearer token
 *
 * Edge runtime compatible - no database dependencies.
 *
 * @param request Next.js Request object
 * @returns User object or null
 */
export function getCurrentUser(request: Request): User | null {
  try {
    let token: string | null = null;

    // 1. 首先尝试从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. 如果没有 Authorization header，尝试从 Cookie 获取
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        // 解析 cookies
        const cookies = cookieHeader.split(';').reduce(
          (acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = value;
            return acc;
          },
          {} as Record<string, string>
        );

        // 优先尝试 admin_token，兼容旧版 token
        token = cookies.admin_token || cookies.token || null;
      }
    }

    if (!token) {
      return null;
    }

    return verifyTokenInternal(token);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * 通用认证函数 - 自动检测客户端类型
 *
 * 尝试从 admin_token 或 h5_token 中获取 token 并验证
 *
 * @param request Optional Next.js Request object
 * @returns Session with user or null
 */
export async function autoAuth(request?: Request): Promise<Session | null> {
  // 先尝试 admin
  const session = await adminAuth(request);
  if (session) {
    return session;
  }

  // 再尝试 h5
  return h5Auth(request);
}

// ==================== Re-exports from auth-core ====================
// Only re-export types and edge-compatible functions (no database dependencies)

export type { AuthUser, ClientType, DeviceType } from '@/lib/auth-core';

// NOTE: The following functions require database access and are NOT re-exported
// to maintain edge runtime compatibility for middleware:
// - generateToken, createSession, verifySession, revokeSession, getUserSessions
// - extractToken, getCookieName, detectClientType
//
// If you need these functions, import them directly from '@/lib/auth-core':
// import { generateToken, createSession } from '@/lib/auth-core';
