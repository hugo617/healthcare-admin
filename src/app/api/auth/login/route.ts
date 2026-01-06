import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { logger } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { account, email, password } = body;

    // 兼容旧接口（email 字段）
    const loginAccount = account || email;

    if (!loginAccount || !password) {
      return unauthorizedResponse('账号和密码不能为空');
    }

    // 识别账号类型
    const accountType = identifyAccountType(loginAccount);

    // 根据账号类型查询用户
    let user;
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
        timestamp: new Date().toISOString()
      });

      return unauthorizedResponse('账号或密码错误');
    }

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
          timestamp: new Date().toISOString()
        },
        user[0].id
      );

      return unauthorizedResponse('账号或密码错误');
    }

    // 更新最后登录时间
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user[0].id));

    const token = sign(
      {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username,
        roleId: user[0].roleId,
        tenantId: user[0].tenantId,
        avatar: user[0].avatar,
        isSuperAdmin: user[0].isSuperAdmin
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

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
        loginType: 'password',
        loginTime: new Date().toISOString(),
        tokenExpiry: '24小时'
      },
      user[0].id
    );

    const response = successResponse({
      message: '登录成功',
      user: {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username,
        phone: user[0].phone,
        avatar: user[0].avatar
      },
      token
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    });

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
