import { NextResponse } from 'next/server';
import { db } from '@/db';
import { verificationCodes } from '@/db/schema';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import SmsService, { SmsService as SmsClass } from '@/lib/sms';
import { successResponse, errorResponse } from '@/service/response';
import { headers } from 'next/headers';
import { getUTCExpiresTime } from '@/lib/timezone';

// 验证码配置（时间单位为毫秒）
const CODE_EXPIRE_TIME = parseInt(
  process.env.SMS_CODE_EXPIRE_TIME || '300000',
  10
); // 5分钟（300秒 = 300,000毫秒）
const CODE_LENGTH = parseInt(process.env.SMS_CODE_LENGTH || '6', 10);
const CODE_INTERVAL = parseInt(process.env.SMS_CODE_INTERVAL || '60000', 10); // 60秒 = 60,000毫秒
const DAILY_LIMIT_PER_IP = 10; // 每个IP每天最多发送10次

/**
 * 获取客户端IP地址
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  // 尝试多种方式获取真实IP
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');

  if (forwardedFor) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * 检查IP限流
 */
async function checkIpRateLimit(
  ip: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();

  // 检查60秒内是否发送过
  const recentCodes = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.ip, ip),
        gt(verificationCodes.createdAt, new Date(now.getTime() - CODE_INTERVAL))
      )
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (recentCodes.length > 0 && recentCodes[0]?.createdAt) {
    // 验证时间戳合理性（排除异常时间）
    if (recentCodes[0].createdAt > now) {
      await logger.warn('短信验证码', '限流检查', '发现异常时间戳数据', {
        ip,
        createdAt: recentCodes[0].createdAt.toISOString(),
        now: now.toISOString(),
        codeId: recentCodes[0].id
      });

      // 删除异常数据
      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.id, recentCodes[0].id));

      // 继续处理，不限制发送
      return { allowed: true };
    }

    const remainingSeconds = Math.ceil(
      (recentCodes[0].createdAt.getTime() + CODE_INTERVAL - now.getTime()) /
        1000
    );

    // 防止异常大的等待时间（如果剩余秒数超过阈值，视为异常）
    if (remainingSeconds > CODE_INTERVAL * 5) {
      await logger.error('短信验证码', '限流检查', '检测到异常大的等待时间', {
        ip,
        remainingSeconds,
        codeId: recentCodes[0].id,
        createdAt: recentCodes[0].createdAt.toISOString()
      });

      // 删除异常记录
      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.id, recentCodes[0].id));

      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `发送过于频繁，请${remainingSeconds}秒后再试`
    };
  }

  // 检查今天发送次数
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCodes = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.ip, ip),
        gt(verificationCodes.createdAt, todayStart)
      )
    );

  if (todayCodes.length >= DAILY_LIMIT_PER_IP) {
    return {
      allowed: false,
      reason: '今日发送次数已达上限'
    };
  }

  return { allowed: true };
}

/**
 * 检查手机号限流
 */
async function checkPhoneRateLimit(
  phone: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();

  // 检查60秒内是否发送过
  const recentCodes = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.phone, phone),
        gt(verificationCodes.createdAt, new Date(now.getTime() - CODE_INTERVAL))
      )
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (recentCodes.length > 0 && recentCodes[0]?.createdAt) {
    // 验证时间戳合理性（排除异常时间）
    if (recentCodes[0].createdAt > now) {
      await logger.warn('短信验证码', '手机号限流', '发现异常时间戳数据', {
        phone,
        createdAt: recentCodes[0].createdAt.toISOString(),
        now: now.toISOString(),
        codeId: recentCodes[0].id
      });

      // 删除异常数据
      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.id, recentCodes[0].id));

      return { allowed: true };
    }

    const remainingSeconds = Math.ceil(
      (recentCodes[0].createdAt.getTime() + CODE_INTERVAL - now.getTime()) /
        1000
    );

    // 防止异常大的等待时间
    if (remainingSeconds > CODE_INTERVAL * 5) {
      await logger.error('短信验证码', '手机号限流', '检测到异常大的等待时间', {
        phone,
        remainingSeconds,
        codeId: recentCodes[0].id,
        createdAt: recentCodes[0].createdAt.toISOString()
      });

      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.id, recentCodes[0].id));

      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `发送过于频繁，请${remainingSeconds}秒后再试`
    };
  }

  return { allowed: true };
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const ip = await getClientIp();

    // 验证手机号格式
    if (!SmsClass.validatePhone(phone)) {
      await logger.warn('短信验证码', '发送验证码', '手机号格式错误', {
        phone,
        ip,
        timestamp: new Date().toISOString()
      });

      return errorResponse('手机号格式不正确');
    }

    // 检查IP限流
    const ipCheck = await checkIpRateLimit(ip);
    if (!ipCheck.allowed) {
      await logger.warn('短信验证码', '发送验证码', 'IP限流拒绝', {
        phone,
        ip,
        reason: ipCheck.reason,
        timestamp: new Date().toISOString()
      });

      return errorResponse(ipCheck.reason!);
    }

    // 检查手机号限流
    const phoneCheck = await checkPhoneRateLimit(phone);
    if (!phoneCheck.allowed) {
      await logger.warn('短信验证码', '发送验证码', '手机号限流拒绝', {
        phone,
        ip,
        reason: phoneCheck.reason,
        timestamp: new Date().toISOString()
      });

      return errorResponse(phoneCheck.reason!);
    }

    // 生成验证码
    const code = SmsClass.generateCode(CODE_LENGTH);

    // 发送短信
    const smsResult = await SmsService.sendVerificationCode(phone, code);

    if (!smsResult.success) {
      await logger.error('短信验证码', '发送验证码', '短信发送失败', {
        phone,
        ip,
        code: smsResult.code,
        message: smsResult.message,
        requestId: smsResult.requestId,
        timestamp: new Date().toISOString()
      });

      return errorResponse(smsResult.message || '发送失败，请稍后重试');
    }

    // 存储验证码到数据库
    // 计算过期时间戳（毫秒）
    const now = Date.now();
    const expiresAtTimestamp = now + CODE_EXPIRE_TIME;

    await logger.info('短信验证码', '时间计算', '过期时间计算详情', {
      now,
      nowDate: new Date(now).toISOString(),
      expireTime: CODE_EXPIRE_TIME,
      expiresAtTimestamp,
      expiresAtDate: new Date(expiresAtTimestamp).toISOString(),
      phone
    });

    // 将时间戳转换为 Date 对象存储
    // 注意：这里我们需要处理时区问题
    // PostgreSQL 的 timestamp without time zone 会将会话时区的时间存储
    // 所以我们需要将 UTC 时间戳转换为本地时间字符串
    const expiresDate = new Date(expiresAtTimestamp);

    await db.insert(verificationCodes).values({
      phone,
      code,
      type: 'login',
      expiresAt: expiresDate,
      tenantId: 1,
      ip
    });

    // 记录成功日志
    await logger.info('短信验证码', '发送验证码', '验证码发送成功', {
      phone,
      ip,
      requestId: smsResult.requestId,
      expireTime: CODE_EXPIRE_TIME,
      timestamp: new Date().toISOString()
    });

    return successResponse({
      message: '验证码已发送',
      expireTime: CODE_EXPIRE_TIME
    });
  } catch (error) {
    await logger.error('短信验证码', '发送验证码', '发送过程发生错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return errorResponse('服务器错误，请稍后重试');
  }
}
