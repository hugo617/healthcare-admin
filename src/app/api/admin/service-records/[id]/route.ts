import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { serviceRecords } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/service-records/[id]
 * 获取服务记录详情(管理端)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await auth(request);
    if (
      !user ||
      !(await hasPermission(user, PERMISSIONS.SERVICE_RECORD.READ))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const record = await db.query.serviceRecords.findFirst({
      where: and(
        eq(serviceRecords.id, BigInt(id)),
        eq(serviceRecords.isDeleted, false)
      ),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            realName: true,
            phone: true,
            avatar: true
          }
        },
        archive: {
          columns: {
            id: true,
            customerNo: true,
            basicInfo: true
          }
        }
      }
    });

    if (!record) {
      return NextResponse.json({ error: '服务记录不存在' }, { status: 404 });
    }

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecord = {
      ...record,
      id: record.id.toString(),
      archiveId: record.archiveId.toString(),
      archive:
        record.archive && typeof record.archive.id === 'bigint'
          ? {
              ...record.archive,
              id: record.archive.id.toString()
            }
          : record.archive
    };

    return NextResponse.json({
      success: true,
      data: serializedRecord
    });
  } catch (error) {
    console.error('获取服务记录详情失败:', error);
    return NextResponse.json(
      {
        error: '获取服务记录详情失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/service-records/[id]
 * 更新服务记录(管理端)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth(request);
    if (
      !session ||
      !(await hasPermission(session, PERMISSIONS.SERVICE_RECORD.UPDATE))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentUser = session.user;
    const { id } = await params;
    const body = await request.json();
    const {
      serviceDate,
      bloodPressure,
      discomfort,
      consultant,
      duration,
      temperature,
      feedback,
      status
    } = body;

    // 检查记录是否存在
    const existingRecord = await db.query.serviceRecords.findFirst({
      where: and(
        eq(serviceRecords.id, BigInt(id)),
        eq(serviceRecords.isDeleted, false)
      )
    });

    if (!existingRecord) {
      return NextResponse.json({ error: '服务记录不存在' }, { status: 404 });
    }

    // 检查血压是否过高
    if (bloodPressure) {
      const { systolic, diastolic } = bloodPressure;
      if (systolic >= 160 || diastolic >= 100) {
        return NextResponse.json(
          { error: '血压过高，建议禁止理疗' },
          { status: 400 }
        );
      }
    }

    // 更新服务记录
    const updatedRecord = await db
      .update(serviceRecords)
      .set({
        serviceDate: serviceDate ?? existingRecord.serviceDate,
        bloodPressure: bloodPressure ?? existingRecord.bloodPressure,
        discomfort: discomfort ?? existingRecord.discomfort,
        consultant: consultant ?? existingRecord.consultant,
        duration: duration ?? existingRecord.duration,
        temperature: temperature ?? existingRecord.temperature,
        feedback: feedback ?? existingRecord.feedback,
        status: status ?? existingRecord.status,
        updatedBy: currentUser.id,
        updatedAt: new Date()
      })
      .where(eq(serviceRecords.id, BigInt(id)))
      .returning();

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecord = {
      ...updatedRecord[0],
      id: updatedRecord[0].id.toString(),
      archiveId: updatedRecord[0].archiveId.toString()
    };

    return NextResponse.json({
      success: true,
      data: serializedRecord,
      message: '服务记录更新成功'
    });
  } catch (error) {
    console.error('更新服务记录失败:', error);
    return NextResponse.json(
      {
        error: '更新服务记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/service-records/[id]
 * 删除服务记录(管理端)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth(request);
    if (
      !session ||
      !(await hasPermission(session, PERMISSIONS.SERVICE_RECORD.DELETE))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentUser = session.user;
    const { id } = await params;

    // 检查记录是否存在
    const existingRecord = await db.query.serviceRecords.findFirst({
      where: and(
        eq(serviceRecords.id, BigInt(id)),
        eq(serviceRecords.isDeleted, false)
      )
    });

    if (!existingRecord) {
      return NextResponse.json({ error: '服务记录不存在' }, { status: 404 });
    }

    // 软删除
    await db
      .update(serviceRecords)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedBy: currentUser.id
      })
      .where(eq(serviceRecords.id, BigInt(id)));

    return NextResponse.json({
      success: true,
      message: '服务记录删除成功'
    });
  } catch (error) {
    console.error('删除服务记录失败:', error);
    return NextResponse.json(
      {
        error: '删除服务记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
