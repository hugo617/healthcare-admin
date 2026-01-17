import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceRecords, healthArchives } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { serializeServiceRecordList } from '@/lib/utils/serialize';

/**
 * GET /api/service-records/archive/:archiveId
 * 获取指定档案的所有服务记录
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { archiveId } = await params;
    const archiveIdBigInt = BigInt(archiveId);

    // 验证档案是否存在且属于当前用户
    const [archive] = await db
      .select()
      .from(healthArchives)
      .where(
        and(
          eq(healthArchives.id, archiveIdBigInt),
          eq(healthArchives.userId, session.user.id),
          eq(healthArchives.isDeleted, false)
        )
      )
      .limit(1);

    if (!archive) {
      return NextResponse.json(
        {
          code: 404,
          message: '健康档案不存在或无权访问'
        },
        { status: 404 }
      );
    }

    // 查询该档案的所有服务记录
    const records = await db
      .select()
      .from(serviceRecords)
      .where(
        and(
          eq(serviceRecords.archiveId, archiveIdBigInt),
          eq(serviceRecords.isDeleted, false)
        )
      )
      .orderBy(
        desc(serviceRecords.serviceDate),
        desc(serviceRecords.createdAt)
      );

    const serializedRecords = serializeServiceRecordList(records);

    return NextResponse.json({
      code: 0,
      data: {
        archiveId: archiveId,
        records: serializedRecords,
        total: serializedRecords.length
      },
      message: '查询成功'
    });
  } catch (error: any) {
    console.error('查询档案服务记录失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: error.message || '查询失败'
      },
      { status: 500 }
    );
  }
}
