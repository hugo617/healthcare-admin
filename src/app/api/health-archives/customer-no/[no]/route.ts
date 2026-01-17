import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { healthArchives } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { successResponse, notFoundResponse } from '@/service/response';
import { auth } from '@/lib/auth';

/**
 * GET /api/health-archives/customer-no/:no
 * 根据客户编号查询档案
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ no: string }> }
) {
  try {
    // 1. 获取认证用户
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    // 2. 获取客户编号
    const { no } = await params;

    if (!no) {
      return NextResponse.json(
        { code: 400, message: '客户编号不能为空' },
        { status: 400 }
      );
    }

    // 3. 查询档案 - 必须属于当前用户
    const [archive] = await db
      .select()
      .from(healthArchives)
      .where(
        and(
          eq(healthArchives.customerNo, no),
          eq(healthArchives.userId, session.user.id), // 权限检查
          eq(healthArchives.isDeleted, false)
        )
      )
      .limit(1);

    if (!archive) {
      return notFoundResponse('档案不存在或无权访问');
    }

    // 4. 返回结果
    return successResponse(archive);
  } catch (error: any) {
    console.error('根据客户编号查询健康档案失败:', error);
    return NextResponse.json(
      {
        code: -1,
        message: error.message || '查询失败'
      },
      { status: 500 }
    );
  }
}
