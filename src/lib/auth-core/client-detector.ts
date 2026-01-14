/**
 * Client Detector
 *
 * 负责检测请求的客户端类型（Admin 或 H5）
 * 支持从路径和 HTTP Header 检测
 */

import type { ClientType, DeviceType } from './types';
import { deviceTypeToClientType } from './types';

/**
 * H5 应用的路径标识
 */
const H5_PATH_PREFIXES = ['/h5', '/api/h5'];

/**
 * 从请求路径检测客户端类型
 *
 * @param path 请求路径（如 '/h5/login', '/api/users'）
 * @returns 检测到的客户端类型，默认为 'admin'
 */
export function detectClientTypeFromPath(path: string): ClientType {
  if (!path) {
    return 'admin';
  }

  const normalizedPath = path.toLowerCase();

  // 检查是否包含 H5 路径前缀
  for (const prefix of H5_PATH_PREFIXES) {
    if (normalizedPath.startsWith(prefix)) {
      return 'h5';
    }
  }

  // 默认为 Admin
  return 'admin';
}

/**
 * 从 User-Agent 或自定义 Header 检测客户端类型
 *
 * @param request Next.js Request 对象
 * @returns 检测到的客户端类型，默认为 'admin'
 */
export function detectClientTypeFromHeader(request: Request): ClientType {
  // 1. 首先检查自定义 header（优先级最高）
  const customClientType = request.headers.get('x-client-type');
  if (customClientType) {
    const normalized = customClientType.toLowerCase();
    if (normalized === 'h5' || normalized === 'mobile') {
      return 'h5';
    }
    if (normalized === 'admin' || normalized === 'web') {
      return 'admin';
    }
  }

  // 2. 从 User-Agent 检测
  const userAgent = request.headers.get('user-agent') || '';
  const deviceType = detectDeviceTypeFromUserAgent(userAgent);

  return deviceTypeToClientType(deviceType);
}

/**
 * 从 User-Agent 检测设备类型
 *
 * @param userAgent User-Agent 字符串
 * @returns 设备类型
 */
export function detectDeviceTypeFromUserAgent(userAgent: string): DeviceType {
  if (!userAgent) {
    return 'web';
  }

  const ua = userAgent.toLowerCase();

  // 检测移动设备
  if (/mobile|android|iphone|ipad|phone|tablet|kindle/i.test(ua)) {
    return 'mobile';
  }

  // 检测桌面应用（Electron 等）
  if (/electron|nw.js/i.test(ua)) {
    return 'desktop';
  }

  // 默认为 Web
  return 'web';
}

/**
 * 从请求中综合检测客户端类型
 *
 * 结合路径和 Header 进行检测，路径优先级更高
 *
 * @param request Next.js Request 对象
 * @returns 检测到的客户端类型
 */
export function detectClientType(request: Request): ClientType {
  const url = new URL(request.url);
  const path = url.pathname;

  // 优先使用路径检测
  const fromPath = detectClientTypeFromPath(path);

  // 如果路径检测结果是 admin，再检查 header 是否明确指定为 h5
  // （用于 H5 应用调用 admin API 的情况）
  if (fromPath === 'admin') {
    const fromHeader = detectClientTypeFromHeader(request);
    // 只有 header 明确指定为 h5 时才覆盖
    if (fromHeader === 'h5') {
      const customHeader = request.headers.get('x-client-type');
      if (customHeader?.toLowerCase() === 'h5') {
        return 'h5';
      }
    }
  }

  return fromPath;
}

/**
 * 获取客户端的 Cookie 名称
 *
 * 统一使用 auth_token，不再区分 admin 和 h5
 *
 * @param clientType 客户端类型
 * @returns Cookie 名称
 */
export function getCookieName(clientType: ClientType): string {
  return 'auth_token';
}

/**
 * 从请求中提取 Token（自动检测客户端类型）
 *
 * @param request Next.js Request 对象
 * @returns Token 字符串或 null
 */
export function extractToken(request: Request): string | null {
  const clientType = detectClientType(request);
  const cookieName = getCookieName(clientType);

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
 * 判断是否为 H5 客户端请求
 *
 * @param request Next.js Request 对象
 * @returns 是否为 H5 客户端
 */
export function isH5Client(request: Request): boolean {
  return detectClientType(request) === 'h5';
}

/**
 * 判断是否为 Admin 客户端请求
 *
 * @param request Next.js Request 对象
 * @returns 是否为 Admin 客户端
 */
export function isAdminClient(request: Request): boolean {
  return detectClientType(request) === 'admin';
}
