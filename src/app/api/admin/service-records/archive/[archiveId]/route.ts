import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions-server';
import { PERMISSIONS } from '@/lib/permissions-server';
import { db } from '@/db';
import { serviceRecords } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ archiveId: string }>;
}

/**
 * GET /api/admin/service-records/archive/[archiveId]
 * 获取指定档案的服务记录列表(管理端)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await auth();
    if (
      !user ||
      !(await hasPermission(user, PERMISSIONS.SERVICE_RECORD.READ))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { archiveId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 查询该档案的服务记录
    const records = await db.query.serviceRecords.findMany({
      where: and(
        eq(serviceRecords.archiveId, BigInt(archiveId)),
        eq(serviceRecords.isDeleted, false)
      ),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            realName: true
          }
        }
      },
      orderBy: [desc(serviceRecords.serviceDate), desc(serviceRecords.count)],
      limit,
      offset: (page - 1) * limit
    });

    // 查询总数
    const totalResult = await db
      .select({ count: serviceRecords.id })
      .from(serviceRecords)
      .where(
        and(
          eq(serviceRecords.archiveId, BigInt(archiveId)),
          eq(serviceRecords.isDeleted, false)
        )
      );

    const total = totalResult.length;

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取档案服务记录失败:', error);
    return NextResponse.json(
      {
        error: '获取档案服务记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
