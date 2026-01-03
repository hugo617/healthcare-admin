import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export interface User {
  id: number;
  email: string;
  username: string;
  avatar: string;
  roleId: number;
  tenantId: bigint;
  isSuperAdmin: boolean;
}

export interface Session {
  user: User;
}

/**
 * 从Request中获取token - 支持Cookie和Authorization header
 */
function getTokenFromRequest(request: Request): string | null {
  // 1. 首先尝试从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. 从 Cookie 获取
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      },
      {} as Record<string, string>
    );
    return cookies.token || null;
  }

  return null;
}

/**
 * 服务端认证函数 - 只能在服务端组件中使用
 * 优先从Cookie读取，也支持Authorization header
 */
export async function auth(request?: Request): Promise<Session | null> {
  let token: string | null = null;

  // 1. 如果提供了request，先尝试从request获取token
  if (request) {
    token = getTokenFromRequest(request);
  }

  // 2. 如果没有从request获取到，尝试从cookies获取
  if (!token) {
    try {
      const cookieStore = cookies();
      const cookie = (await cookieStore).get('token');
      token = cookie?.value || null;
    } catch {
      // cookies() 可能在某些上下文中不可用
    }
  }

  if (!token) {
    return null;
  }

  const user = verifyToken(token);
  if (!user) {
    return null;
  }

  return { user };
}

/**
 * 验证token的工具函数 - 可以在任何地方使用
 */
export function verifyToken(token: string): User | null {
  try {
    const verified = verify(token, process.env.JWT_SECRET || 'secret') as User;
    return {
      id: verified.id,
      email: verified.email,
      username: verified.username,
      avatar: verified.avatar,
      roleId: verified.roleId,
      tenantId: BigInt(verified.tenantId || 1),
      isSuperAdmin: verified.isSuperAdmin || false
    };
  } catch {
    return null;
  }
}

/**
 * 从Request中获取当前用户信息 - 用于API routes
 * 支持 Cookie 和 Authorization Bearer token
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

        token = cookies.token || null;
      }
    }

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
