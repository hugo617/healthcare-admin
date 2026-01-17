import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, roles } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // 检查是否已有角色，如果没有则创建
    let defaultRole;
    const existingRoles = await db.select().from(roles).limit(1);

    if (existingRoles.length > 0) {
      defaultRole = existingRoles[0];
    } else {
      const roleResult = await db
        .insert(roles)
        .values({
          name: '测试角色',
          code: 'test-role',
          description: '测试用角色',
          isSuper: true,
          isSystem: false
        })
        .returning();
      defaultRole = (roleResult as any[])[0];
    }

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('Test@123456', 12);

    const testUserResult = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        username: 'TestUser',
        password: hashedPassword,
        roleId: defaultRole.id,
        isSuperAdmin: true,
        status: 'active',
        tenantId: 1
      })
      .returning();
    const testUser = (testUserResult as any[])[0];

    // 创建管理员用户
    const adminPassword = await bcrypt.hash('Admin@123456', 12);

    const adminUserResult = await db
      .insert(users)
      .values({
        email: 'admin@example.com',
        username: 'Administrator',
        password: adminPassword,
        roleId: defaultRole.id,
        isSuperAdmin: true,
        status: 'active',
        tenantId: 1
      })
      .returning();
    const adminUser = (adminUserResult as any[])[0];

    return NextResponse.json({
      success: true,
      data: {
        testUser: {
          id: testUser.id,
          email: testUser.email,
          username: testUser.username
        },
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          username: adminUser.username
        },
        role: {
          id: defaultRole.id,
          name: defaultRole.name
        }
      },
      message: '测试用户创建成功！'
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '创建用户失败',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
