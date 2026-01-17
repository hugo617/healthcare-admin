import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/service/response';
import { auth } from '@/lib/auth';
import { generateCustomerNo } from '@/lib/utils/customer-no';

/**
 * POST /api/health-archives/generate-customer-no
 * 生成新的客户编号
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取认证用户
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    // 2. 生成客户编号
    const customerNo = await generateCustomerNo(session.user.id);

    // 3. 返回结果
    return successResponse({
      customerNo,
      message: '生成成功'
    });
  } catch (error: any) {
    console.error('生成客户编号失败:', error);
    return errorResponse(error.message || '生成失败');
  }
}
