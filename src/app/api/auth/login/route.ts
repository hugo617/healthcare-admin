import { NextResponse } from 'next/server';

// Force Node.js runtime - auth-core uses crypto module (randomUUID, createHash)
export const runtime = 'nodejs';
import { db } from '@/db';
import { users, verificationCodes, roles } from '@/db/schema';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';
import {
  generateToken,
  createSession,
  getCookieName,
  clientTypeToDeviceType,
  type ClientType,
  type CreateSessionParams
} from '@/lib/auth-core';

/**
 * 判断账号类型
 * @param account 账号（可能是邮箱、手机号或用户名）
 * @returns 账号类型
 */
function identifyAccountType(account: string): 'email' | 'phone' | 'username' {
  // 邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(account)) {
    return 'email';
  }

  // 手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (phoneRegex.test(account)) {
    return 'phone';
  }

  // 默认为用户名
  return 'username';
}

/**
 * 获取客户端 IP 地址
 */
function getClientIp(request: Request): string {
  // 尝试从各种 header 中获取 IP
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-client-ip'
  ];

  for (const header of headers) {
    const ip = request.headers.get(header);
    if (ip) {
      // x-forwarded-for 可能包含多个 IP，取第一个
      return ip.split(',')[0].trim();
    }
  }

  // 无法获取则返回默认值
  return '0.0.0.0';
}

/**
 * 生成随机密码（用于自动注册用户）
 */
function generateRandomPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      account, // 密码登录的账号
      email, // 兼容旧接口
      password, // 密码
      phone, // 短信登录的手机号
      code, // 短信验证码
      loginType = 'password', // 'password' | 'sms'
      clientType = 'admin', // 'admin' | 'h5'
      rememberMe = false // 是否记住登录（延长token有效期）
    }: {
      account?: string;
      email?: string;
      password?: string;
      phone?: string;
      code?: string;
      loginType?: 'password' | 'sms';
      clientType?: ClientType;
      rememberMe?: boolean;
    } = body;

    // 验证 clientType
    if (clientType !== 'admin' && clientType !== 'h5') {
      return unauthorizedResponse('无效的客户端类型');
    }

    let user;
    let loginAccount: string;
    let loginUserId: number | null = null;

    // ==================== 密码登录流程 ====================
    if (loginType === 'password') {
      // 兼容旧接口（email 字段）
      loginAccount = account || email || '';

      if (!loginAccount || !password) {
        return unauthorizedResponse('账号和密码不能为空');
      }

      // 识别账号类型
      const accountType = identifyAccountType(loginAccount);

      // 根据账号类型查询用户
      if (accountType === 'email') {
        user = await db
          .select()
          .from(users)
          .where(eq(users.email, loginAccount))
          .limit(1);
      } else if (accountType === 'phone') {
        user = await db
          .select()
          .from(users)
          .where(eq(users.phone, loginAccount))
          .limit(1);
      } else {
        // 用户名
        user = await db
          .select()
          .from(users)
          .where(eq(users.username, loginAccount))
          .limit(1);
      }

      if (!user.length) {
        // 记录登录失败日志 - 用户不存在
        await logger.warn('用户认证', '用户登录', '登录失败：用户不存在', {
          reason: '用户不存在',
          account: loginAccount,
          accountType,
          loginType: 'password',
          clientType,
          timestamp: new Date().toISOString()
        });

        return unauthorizedResponse('账号或密码错误');
      }

      loginUserId = user[0].id;

      // 检查用户是否被禁用
      if (user[0].status === 'inactive') {
        await logger.warn(
          '用户认证',
          '用户登录',
          '登录失败：用户已被禁用',
          {
            reason: '用户已被禁用',
            account: loginAccount,
            accountType,
            userId: user[0].id,
            username: user[0].username,
            loginType: 'password',
            clientType,
            timestamp: new Date().toISOString()
          },
          user[0].id
        );

        return unauthorizedResponse('该账户已被禁用，请联系管理员');
      }

      const isValid = await bcrypt.compare(password, user[0].password);
      if (!isValid) {
        // 记录登录失败日志 - 密码错误
        await logger.warn(
          '用户认证',
          '用户登录',
          '登录失败：密码错误',
          {
            reason: '密码错误',
            account: loginAccount,
            accountType,
            userId: user[0].id,
            username: user[0].username,
            loginType: 'password',
            clientType,
            timestamp: new Date().toISOString()
          },
          user[0].id
        );

        return unauthorizedResponse('账号或密码错误');
      }
    }
    // ==================== 短信验证码登录流程 ====================
    else if (loginType === 'sms') {
      if (!phone || !code) {
        return unauthorizedResponse('手机号和验证码不能为空');
      }

      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return unauthorizedResponse('手机号格式不正确');
      }

      // 查询验证码（查询最近 10 分钟内的记录）
      // 使用 createdAt 而不是 expiresAt 来避免时区问题
      const CODE_EXPIRE_SECONDS =
        parseInt(process.env.SMS_CODE_EXPIRE_TIME || '300000', 10) / 1000; // 转换为秒
      const validTimeAgo = new Date(
        Date.now() - CODE_EXPIRE_SECONDS * 1000 * 2
      ); // 2倍过期时间作为安全范围

      const codeRecords = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.phone, phone),
            gt(verificationCodes.createdAt, validTimeAgo)
          )
        )
        .orderBy(desc(verificationCodes.createdAt))
        .limit(1);

      if (!codeRecords.length) {
        await logger.warn(
          '用户认证',
          '用户登录',
          '登录失败：验证码不存在或已过期',
          {
            reason: '验证码不存在或已过期',
            phone,
            loginType: 'sms',
            clientType,
            timestamp: new Date().toISOString()
          }
        );

        return unauthorizedResponse('验证码不存在或已过期');
      }

      // 在 JavaScript 中验证过期时间（基于 createdAt）
      const now = Date.now();
      const createdAt = codeRecords[0].createdAt.getTime();
      const expiresAt = createdAt + CODE_EXPIRE_SECONDS * 1000;

      await logger.info('用户认证', '时间验证', '验证码时间检查', {
        phone,
        now,
        nowISO: new Date(now).toISOString(),
        createdAt,
        createdAtISO: new Date(createdAt).toISOString(),
        expiresAt,
        expiresAtISO: new Date(expiresAt).toISOString(),
        isValid: expiresAt > now,
        timeDiff: expiresAt - now
      });

      if (expiresAt < now) {
        await logger.warn('用户认证', '用户登录', '登录失败：验证码已过期', {
          reason: '验证码已过期',
          phone,
          createdAt: codeRecords[0].createdAt.toISOString(),
          now: new Date(now).toISOString(),
          loginType: 'sms',
          clientType,
          timestamp: new Date().toISOString()
        });

        return unauthorizedResponse('验证码已过期');
      }

      // 验证码是明文存储的，直接进行字符串比较
      const isCodeValid = code === codeRecords[0].code;
      if (!isCodeValid) {
        await logger.warn('用户认证', '用户登录', '登录失败：验证码错误', {
          reason: '验证码错误',
          phone,
          loginType: 'sms',
          clientType,
          timestamp: new Date().toISOString()
        });

        return unauthorizedResponse('验证码错误');
      }

      // 检查验证码是否已被使用
      if (codeRecords[0].usedAt) {
        await logger.warn('用户认证', '用户登录', '登录失败：验证码已被使用', {
          reason: '验证码已被使用',
          phone,
          loginType: 'sms',
          clientType,
          timestamp: new Date().toISOString()
        });

        return unauthorizedResponse('验证码已失效');
      }

      // 删除已使用的验证码
      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.id, codeRecords[0].id));

      // 查询用户
      user = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      // 如果用户不存在，自动注册
      if (!user.length) {
        await logger.info(
          '短信验证码登录',
          '自动注册用户',
          '用户不存在，开始自动注册',
          {
            phone,
            timestamp: new Date().toISOString()
          }
        );

        // 查找默认用户角色
        const defaultRole = await db
          .select()
          .from(roles)
          .where(eq(roles.code, 'user'))
          .limit(1);

        if (!defaultRole.length) {
          await logger.error(
            '短信验证码登录',
            '自动注册失败',
            '默认用户角色不存在',
            {
              phone,
              timestamp: new Date().toISOString()
            }
          );

          return unauthorizedResponse('系统配置错误，请联系管理员');
        }

        // 生成用户数据
        const generatedEmail = `${phone}@sms-auto.local`;
        const generatedUsername = `sms_${phone}`;
        const generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);

        // 创建用户
        const newUser = await db
          .insert(users)
          .values({
            email: generatedEmail,
            username: generatedUsername,
            password: hashedPassword,
            phone: phone,
            roleId: defaultRole[0].id,
            tenantId: 1,
            avatar: '/avatars/default.jpg',
            status: 'active',
            metadata: {
              registeredVia: 'sms',
              autoRegistered: true,
              originalPhone: phone
            }
          })
          .returning();

        user = newUser as any;

        await logger.info(
          '短信验证码登录',
          '自动注册成功',
          '用户自动注册完成',
          {
            userId: user[0].id,
            username: user[0].username,
            phone: user[0].phone,
            email: user[0].email,
            roleId: user[0].roleId,
            timestamp: new Date().toISOString()
          }
        );
      }

      loginUserId = user[0].id;
      loginAccount = user[0].email || user[0].username || phone;

      // 检查用户是否被禁用
      if (user[0].status === 'inactive') {
        await logger.warn(
          '用户认证',
          '用户登录',
          '登录失败：用户已被禁用',
          {
            reason: '用户已被禁用',
            phone,
            userId: user[0].id,
            username: user[0].username,
            loginType: 'sms',
            clientType,
            timestamp: new Date().toISOString()
          },
          user[0].id
        );

        return unauthorizedResponse('该账户已被禁用，请联系管理员');
      }
    } else {
      return unauthorizedResponse('不支持的登录类型');
    }

    // 更新最后登录时间
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user[0].id));

    // 构建用户信息
    const userInfo = {
      id: user[0].id,
      email: user[0].email,
      username: user[0].username,
      phone: user[0].phone ?? undefined,
      avatar: user[0].avatar ?? '',
      roleId: user[0].roleId,
      tenantId: Number(user[0].tenantId || 1),
      isSuperAdmin: user[0].isSuperAdmin || false
    };

    // 生成 JWT token（根据 rememberMe 决定过期时间）
    const token = generateToken(userInfo, rememberMe);

    // 计算过期时间（秒）
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30天 或 24小时

    // 获取请求信息用于创建 session
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    // 创建会话记录
    let session;
    try {
      session = await createSession({
        userId: user[0].id,
        clientType,
        token,
        ipAddress,
        userAgent
      });
    } catch (sessionError) {
      // session 创建失败不影响登录，仅记录日志
      await logger.error(
        '用户认证',
        '用户登录',
        '会话创建失败',
        {
          error:
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError),
          userId: user[0].id,
          clientType
        },
        user[0].id
      );
    }

    // 记录登录成功日志
    await logger.info(
      '用户认证',
      '用户登录',
      '用户登录成功',
      {
        userId: user[0].id,
        username: user[0].username,
        email: user[0].email,
        phone: user[0].phone,
        roleId: user[0].roleId,
        loginType,
        clientType,
        sessionId: session?.id,
        loginTime: new Date().toISOString(),
        tokenExpiry: rememberMe ? '30天' : '24小时',
        rememberMe
      },
      user[0].id
    );

    // 根据客户端类型确定跳转地址
    const redirectUrl = clientType === 'h5' ? '/h5' : '/admin/dashboard';

    const response = successResponse({
      message: '登录成功',
      user: {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username,
        phone: user[0].phone,
        avatar: user[0].avatar
      },
      token,
      redirectUrl,
      session: session
        ? {
            id: session.id,
            expiresAt: session.expiresAt.toISOString(),
            deviceType: session.deviceType
          }
        : undefined
    });

    // Cookie secure 设置：优先使用环境变量，生产环境默认为 true，但可通过 COOKIE_SECURE=false 覆盖
    // 这允许在 HTTP 环境下禁用 secure cookie（用于临时部署场景）
    const cookieSecure =
      process.env.COOKIE_SECURE === 'false'
        ? false
        : process.env.NODE_ENV === 'production';

    // 统一设置 auth_token cookie
    const cookieName = getCookieName(clientType); // 现在返回 'auth_token'
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge
    });

    // 向后兼容：同时设置旧 cookie（过渡期使用）
    if (clientType === 'admin') {
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: 'lax',
        path: '/',
        maxAge
      });
    } else if (clientType === 'h5') {
      response.cookies.set('h5_token', token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: 'lax',
        path: '/',
        maxAge
      });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: 'lax',
        path: '/',
        maxAge
      });
    }

    return response;
  } catch (error) {
    // 记录服务器错误日志
    await logger.error('用户认证', '用户登录', '登录过程发生服务器错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return errorResponse('服务器错误');
  }
}
