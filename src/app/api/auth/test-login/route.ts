import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: '用户名和密码不能为空'
        }
      }, { status: 400 });
    }

    // 查找用户
    const userRecord = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        roleId: users.roleId,
        isSuperAdmin: users.isSuperAdmin,
        status: users.status
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      }, { status: 404 });
    }

    const user = userRecord[0];

    // 检查用户状态
    if (user.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: '用户账户已被禁用'
        }
      }, { status: 403 });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: '密码错误'
        }
      }, { status: 401 });
    }

    // 获取角色信息
    const roleRecord = await db
      .select({
        id: roles.id,
        name: roles.name,
        isSuper: roles.isSuper
      })
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    const role = roleRecord[0] || null;

    // 生成JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        isSuperAdmin: user.isSuperAdmin,
        tenantId: 1, // 默认租户ID
        timestamp: Date.now()
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // 设置cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roleId: user.roleId,
          isSuperAdmin: user.isSuperAdmin,
          status: user.status,
          role: role
        },
        token,
        permissions: user.isSuperAdmin ? ['*'] : ['user:read', 'user:update'] // 简化的权限列表
      },
      message: '登录成功'
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24小时
    });

    return response;

  } catch (error) {
    console.error('Test login failed:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '登录失败'
      }
    }, { status: 500 });
  }
}