/**
 * H5 积分流水 API
 * GET /api/h5/point-transactions?page=1&pageSize=20
 *
 * 返回当前用户的积分变动历史
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyH5Token } from '@/lib/h5-auth';
import { getPointTransactions } from '@/lib/points';

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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 获取积分流水
    const { transactions, total } = await getPointTransactions(
      user.id,
      Number(user.tenantId),
      page,
      pageSize
    );

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          pageSize,
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching point transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch point transactions' },
      { status: 500 }
    );
  }
}
