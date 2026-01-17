/**
 * H5 签到 API
 * POST /api/h5/check-in
 *
 * 处理用户每日签到，计算连续签到奖励
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyH5Token } from '@/lib/h5-auth';
import { checkIn } from '@/lib/points';

export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const user = verifyH5Token(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '无效的登录信息' },
        { status: 401 }
      );
    }

    // 执行签到
    const result = await checkIn(user.id, Number(user.tenantId));

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check in' },
      { status: 500 }
    );
  }
}
