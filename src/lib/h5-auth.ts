import { verify } from 'jsonwebtoken';

export interface H5User {
  id: number;
  email?: string;
  username?: string;
  phone?: string;
  avatar?: string;
  roleId?: number;
  tenantId?: bigint;
  isSuperAdmin?: boolean;
}

export interface H5Session {
  user: H5User;
}

/**
 * 验证 H5 token 的工具函数 - 可以在任何地方使用
 * 注意：H5 是纯客户端应用，不支持服务端组件
 */
export function verifyH5Token(token: string): H5User | null {
  try {
    const verified = verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as H5User;
    return {
      id: verified.id,
      email: verified.email,
      username: verified.username,
      phone: verified.phone,
      avatar: verified.avatar,
      roleId: verified.roleId,
      tenantId: verified.tenantId
        ? BigInt(verified.tenantId.toString())
        : undefined,
      isSuperAdmin: verified.isSuperAdmin || false
    };
  } catch {
    return null;
  }
}

/**
 * H5 客户端认证管理器
 * H5 是纯客户端应用，使用 LocalStorage 存储认证状态
 */
export class H5AuthManager {
  private static instance: H5AuthManager;

  static getInstance(): H5AuthManager {
    if (!H5AuthManager.instance) {
      H5AuthManager.instance = new H5AuthManager();
    }
    return H5AuthManager.instance;
  }

  getAuthState(): {
    user: H5User | null;
    token: string | null;
    isAuthenticated: boolean;
  } {
    if (typeof window === 'undefined') {
      return { user: null, token: null, isAuthenticated: false };
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      user,
      token,
      isAuthenticated: !!(token && user)
    };
  }

  setAuthState(token: string, user: H5User) {
    if (typeof window === 'undefined') return;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuthState() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  requireAuth() {
    const { isAuthenticated } = this.getAuthState();
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/h5/login';
      }
      return false;
    }
    return true;
  }
}
