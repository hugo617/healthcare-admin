/**
 * 时区工具函数
 * 统一处理上海时区的日期时间操作
 */

// 上海时区标识
export const SHANGHAI_TIMEZONE = 'Asia/Shanghai';

/**
 * 获取当前上海时间
 */
export function getShanghaiTime(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: SHANGHAI_TIMEZONE })
  );
}

/**
 * 将日期转换为上海时区的字符串
 */
export function toShanghaiTimeString(
  date: Date | string,
  format: 'datetime' | 'date' | 'time' = 'datetime'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    timeZone: SHANGHAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  switch (format) {
    case 'date':
      return dateObj.toLocaleDateString('zh-CN', {
        timeZone: SHANGHAI_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    case 'time':
      return dateObj.toLocaleTimeString('zh-CN', {
        timeZone: SHANGHAI_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    default:
      return dateObj.toLocaleString('zh-CN', options);
  }
}

/**
 * 格式化日期显示
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return toShanghaiTimeString(dateObj, 'datetime');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
}

/**
 * 格式化日期显示（仅日期）
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return toShanghaiTimeString(dateObj, 'date');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
}

/**
 * 获取ISO格式的上海时间字符串（用于API响应）
 */
export function getShanghaiISOString(): string {
  const now = getShanghaiTime();
  // 转换为上海时间的ISO字符串
  const offset = 8; // 上海时区UTC+8
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const shanghaiTime = new Date(utcTime + 3600000 * offset);
  return shanghaiTime.toISOString();
}

/**
 * 检查并设置应用时区
 */
export function initializeTimezone(): void {
  // 设置进程时区
  if (process.env.TZ !== SHANGHAI_TIMEZONE) {
    process.env.TZ = SHANGHAI_TIMEZONE;
  }
}

// 在模块加载时初始化时区
initializeTimezone();

/**
 * 创建 UTC 过期时间（用于数据库存储）
 *
 * 问题背景：
 * - JavaScript Date.toISOString() 返回 UTC 时间
 * - PostgreSQL timestamp without time zone 不存储时区
 * - 使用 NOW() 查询时返回会话时区时间，导致时区不匹配
 *
 * 使用场景：
 * - 验证码过期时间（verification_codes.expires_at）
 * - 会话过期时间等需要与 CURRENT_TIMESTAMP AT TIME ZONE 'UTC' 比较的场景
 *
 * @param millisecondsFromNow 从现在开始的毫秒数
 * @returns UTC Date 对象（Drizzle 会自动使用 toISOString() 转换为 UTC 字符串存储）
 *
 * @example
 * const expiresAt = getUTCExpiresTime(5 * 60 * 1000); // 5分钟后
 * // 验证时使用: gt(verificationCodes.expiresAt, sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
 */
export function getUTCExpiresTime(millisecondsFromNow: number): Date {
  return new Date(Date.now() + millisecondsFromNow);
}
