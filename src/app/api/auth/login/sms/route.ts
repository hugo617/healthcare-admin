import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, verificationCodes, roles } from '@/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

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
    const { phone, code } = await request.json();

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      await logger.warn('短信验证码登录', '验证码登录', '手机号格式错误', {
        phone,
        timestamp: new Date().toISOString()
      });

      return unauthorizedResponse('手机号格式不正确');
    }

    // 验证验证码格式
    if (!code || code.length !== 6) {
      await logger.warn('短信验证码登录', '验证码登录', '验证码格式错误', {
        phone,
        codeLength: code?.length || 0,
        timestamp: new Date().toISOString()
      });

      return unauthorizedResponse('验证码格式不正确');
    }

    // 查找有效的验证码
    const validCodes = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phone, phone),
          eq(verificationCodes.code, code),
          eq(verificationCodes.type, 'login'),
          // 使用 UTC 时间进行比较，因为 Drizzle ORM 存储时使用 toISOString() 转换为 UTC
          gt(
            verificationCodes.expiresAt,
            sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`
          ),
          sql`${verificationCodes.usedAt} IS NULL`
        )
      )
      .orderBy(verificationCodes.createdAt)
      .limit(1);

    if (!validCodes.length) {
      // 记录验证失败日志
      await logger.warn('短信验证码登录', '验证码登录', '验证码验证失败', {
        phone,
        reason: '验证码无效或已过期',
        timestamp: new Date().toISOString()
      });

      return unauthorizedResponse('验证码无效或已过期');
    }

    const verificationCode = validCodes[0];

    // 查找用户
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    // 如果用户不存在，自动注册
    let user;
    if (!userList.length) {
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

      user = (newUser as any[])[0];

      await logger.info('短信验证码登录', '自动注册成功', '用户自动注册完成', {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        roleId: user.roleId,
        timestamp: new Date().toISOString()
      });
    } else {
      user = userList[0];
    }

    // 检查用户状态
    if (user.status === 'inactive') {
      await logger.warn('短信验证码登录', '验证码登录', '用户已被禁用', {
        userId: user.id,
        username: user.username,
        phone,
        timestamp: new Date().toISOString()
      });

      return unauthorizedResponse('该账户已被禁用，请联系管理员');
    }

    // 标记验证码为已使用
    await db
      .update(verificationCodes)
      .set({ usedAt: new Date() })
      .where(eq(verificationCodes.id, verificationCode.id));

    // 更新用户最后登录时间
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // 生成 JWT token
    const token = sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
        tenantId: user.tenantId,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    // 记录登录成功日志
    await logger.info(
      '短信验证码登录',
      '验证码登录',
      '用户登录成功',
      {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        roleId: user.roleId,
        loginTime: new Date().toISOString(),
        loginType: 'sms',
        tokenExpiry: '24小时'
      },
      user.id
    );

    const response = successResponse({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        avatar: user.avatar
      },
      token
    });

    // Cookie secure 设置：优先使用环境变量，生产环境默认为 true，但可通过 COOKIE_SECURE=false 覆盖
    const cookieSecure =
      process.env.COOKIE_SECURE === 'false'
        ? false
        : process.env.NODE_ENV === 'production';

    // 设置 cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    await logger.error('短信验证码登录', '验证码登录', '登录过程发生错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return errorResponse('服务器错误');
  }
}
