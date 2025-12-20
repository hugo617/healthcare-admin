import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    console.log('用户数据:', {
      id: user[0].id,
      email: user[0].email,
      passwordHash: user[0].password.substring(0, 20) + '...',
    });

    const isValid = await bcrypt.compare(password, user[0].password);

    return NextResponse.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username,
      },
      passwordValid: isValid,
    });
  } catch (error) {
    console.error('Test password error:', error);
    return NextResponse.json(
      { error: '服务器错误', details: String(error) },
      { status: 500 }
    );
  }
}