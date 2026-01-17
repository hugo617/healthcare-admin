/**
 * H5 积分查询 API
 * GET /api/h5/points
 *
 * 返回当前用户的积分统计信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyH5Token } from '@/lib/h5-auth';
import { getUserPointsStats } from '@/lib/points';

export async function GET(request: NextRequest) {
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

    // 获取用户积分统计
    const stats = await getUserPointsStats(user.id, Number(user.tenantId));

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user points' },
      { status: 500 }
    );
  }
}
