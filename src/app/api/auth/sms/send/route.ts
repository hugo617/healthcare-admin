import { NextResponse } from 'next/server';
import { db } from '@/db';
import { verificationCodes } from '@/db/schema';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import SmsService, { SmsService as SmsClass } from '@/lib/sms';
import { successResponse, errorResponse } from '@/service/response';
import { headers } from 'next/headers';

// 排除阿里云API的代理设置
if (typeof process !== 'undefined') {
  // 清除可能干扰阿里云SDK的代理环境变量
  const aliyunDomains = ['aliyuncs.com', 'alibabacloud.com'];
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || '';
  const domainsToExclude = aliyunDomains.join(',');
  process.env.NO_PROXY = noProxy
    ? `${noProxy},${domainsToExclude}`
    : domainsToExclude;
  process.env.no_proxy = process.env.NO_PROXY;
}

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
  console.log('[SMS API] === 短信发送API调用 ===');
  try {
    console.log('[SMS API] STEP 1: 解析请求体...');
    const { phone } = await request.json();
    const ip = await getClientIp();
    console.log('[SMS API] STEP 2: phone=', phone, 'ip=', ip);

    // 验证手机号格式
    console.log('[SMS API] STEP 3: 验证手机号格式...');
    if (!SmsClass.validatePhone(phone)) {
      console.log('[SMS API] ERROR: 手机号格式错误');
      await logger.warn('短信验证码', '发送验证码', '手机号格式错误', {
        phone,
        ip,
        timestamp: new Date().toISOString()
      });

      return errorResponse('手机号格式不正确');
    }
    console.log('[SMS API] STEP 4: 手机号格式正确');

    // 检查IP限流
    console.log('[SMS API] STEP 5: 检查IP限流...');
    const ipCheck = await checkIpRateLimit(ip);
    if (!ipCheck.allowed) {
      console.log('[SMS API] ERROR: IP限流拒绝 -', ipCheck.reason);
      await logger.warn('短信验证码', '发送验证码', 'IP限流拒绝', {
        phone,
        ip,
        reason: ipCheck.reason,
        timestamp: new Date().toISOString()
      });

      return errorResponse(ipCheck.reason!);
    }
    console.log('[SMS API] STEP 6: IP限流检查通过');

    // 检查手机号限流
    console.log('[SMS API] STEP 7: 检查手机号限流...');
    const phoneCheck = await checkPhoneRateLimit(phone);
    if (!phoneCheck.allowed) {
      console.log('[SMS API] ERROR: 手机号限流拒绝 -', phoneCheck.reason);
      await logger.warn('短信验证码', '发送验证码', '手机号限流拒绝', {
        phone,
        ip,
        reason: phoneCheck.reason,
        timestamp: new Date().toISOString()
      });

      return errorResponse(phoneCheck.reason!);
    }
    console.log('[SMS API] STEP 8: 手机号限流检查通过');

    // 生成验证码
    console.log('[SMS API] STEP 9: 生成验证码...');
    const code = SmsClass.generateCode(CODE_LENGTH);
    console.log('[SMS API] STEP 10: 验证码生成成功, code=', code);

    // 调试模式：跳过短信发送（用于测试）
    console.log('[SMS API] STEP 11: 检查SKIP_SMS环境变量...');
    const SKIP_SMS = process.env.SKIP_SMS === 'true';
    console.log('[SMS API] SKIP_SMS=', SKIP_SMS);
    let smsResult: {
      success: boolean;
      requestId?: string;
      code?: string;
      message?: string;
    } = {
      success: true,
      requestId: 'debug'
    };

    if (!SKIP_SMS) {
      console.log('[SMS API] STEP 12: 调用阿里云短信API...');
      // 发送短信
      smsResult = await SmsService.sendVerificationCode(phone, code);
      console.log('[SMS API] STEP 13: 短信API返回', JSON.stringify(smsResult));

      if (!smsResult.success) {
        console.log('[SMS API] ERROR: 短信发送失败 -', smsResult.message);
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
    } else {
      console.log('[SMS API] STEP 12: 调试模式，跳过短信发送');
      // 调试模式：在日志中输出验证码
      await logger.warn('短信验证码', '调试模式', '跳过短信发送', {
        phone,
        code,
        message: `验证码是: ${code}`,
        timestamp: new Date().toISOString()
      });
    }
    console.log('[SMS API] STEP 14: 短信发送成功');

    // 存储验证码到数据库
    // 计算过期时间戳（毫秒）
    console.log('[SMS API] STEP 15: 准备写入数据库...');
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
    const expiresDate = new Date(expiresAtTimestamp);

    console.log('[SMS API] STEP 16: 插入验证码到数据库...');
    await db.insert(verificationCodes).values({
      phone,
      code,
      type: 'login',
      expiresAt: expiresDate,
      tenantId: 1,
      ip
    });
    console.log('[SMS API] STEP 17: 数据库插入成功');

    // 记录成功日志
    await logger.info('短信验证码', '发送验证码', '验证码发送成功', {
      phone,
      ip,
      requestId: smsResult.requestId,
      expireTime: CODE_EXPIRE_TIME,
      timestamp: new Date().toISOString()
    });

    console.log('[SMS API] SUCCESS: 验证码发送完成');
    return successResponse({
      message: '验证码已发送',
      expireTime: CODE_EXPIRE_TIME
    });
  } catch (error) {
    console.log('[SMS API] === CATCH ERROR ===');
    console.log('[SMS API] Error:', error);
    console.log(
      '[SMS API] Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.log(
      '[SMS API] Error stack:',
      error instanceof Error ? error.stack : 'no stack'
    );
    await logger.error('短信验证码', '发送验证码', '发送过程发生错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return errorResponse('服务器错误，请稍后重试');
  }
}
