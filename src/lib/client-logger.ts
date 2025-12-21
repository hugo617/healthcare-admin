/**
 * 客户端日志记录器 - 不依赖 next/headers
 * 仅用于开发环境调试和客户端错误处理
 */

export type ClientLogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ClientLogData {
  level: ClientLogLevel;
  action: string;
  module: string;
  message: string;
  details?: Record<string, any>;
  userId?: number;
  duration?: number;
}

/**
 * 客户端日志记录器类
 */
export class ClientLogger {
  private module: string;
  private userId?: number;

  constructor(module: string, userId?: number) {
    this.module = module;
    this.userId = userId;
  }

  private log(level: ClientLogLevel, action: string, message: string, details?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        module: this.module,
        action,
        message,
        details,
        userId: this.userId
      };

      switch (level) {
        case 'debug':
        case 'info':
          console.info(`[${level.toUpperCase()}] ${this.module}: ${message}`, details);
          break;
        case 'warn':
          console.warn(`[${level.toUpperCase()}] ${this.module}: ${message}`, details);
          break;
        case 'error':
          console.error(`[${level.toUpperCase()}] ${this.module}: ${message}`, details);
          break;
      }
    }
  }

  debug(action: string, message: string, details?: Record<string, any>) {
    this.log('debug', action, message, details);
  }

  info(action: string, message: string, details?: Record<string, any>) {
    this.log('info', action, message, details);
  }

  warn(action: string, message: string, details?: Record<string, any>) {
    this.log('warn', action, message, details);
  }

  error(action: string, message: string, details?: Record<string, any>) {
    this.log('error', action, message, details);
  }
}

/**
 * 客户端 Logger 工厂
 */
export function getClientLogger(module: string, userId?: number): ClientLogger {
  return new ClientLogger(module, userId);
}

/**
 * 快捷客户端日志记录函数
 */
export const clientLogger = {
  debug: (module: string, action: string, message: string, details?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${module}: ${message}`, details);
    }
  },

  info: (module: string, action: string, message: string, details?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${module}: ${message}`, details);
    }
  },

  warn: (module: string, action: string, message: string, details?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${module}: ${message}`, details);
    }
  },

  error: (module: string, action: string, message: string, details?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${module}: ${message}`, details);
    }
  },

  for: (module: string, userId?: number) => getClientLogger(module, userId)
};