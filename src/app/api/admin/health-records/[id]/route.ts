import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { healthRecords } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/health-records/[id]
 * 获取健康记录详情(管理端)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await auth(request);
    if (!user || !(await hasPermission(user, PERMISSIONS.HEALTH_RECORD.READ))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const record = await db.query.healthRecords.findFirst({
      where: and(
        eq(healthRecords.id, BigInt(id)),
        eq(healthRecords.isDeleted, false)
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
        }
      }
    });

    if (!record) {
      return NextResponse.json({ error: '健康记录不存在' }, { status: 404 });
    }

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecord = {
      ...record,
      id: record.id.toString()
    };

    return NextResponse.json({
      success: true,
      data: serializedRecord
    });
  } catch (error) {
    console.error('获取健康记录详情失败:', error);
    return NextResponse.json(
      {
        error: '获取健康记录详情失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/health-records/[id]
 * 更新健康记录(管理端)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth(request);
    if (
      !session ||
      !(await hasPermission(session, PERMISSIONS.HEALTH_RECORD.UPDATE))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentUser = session.user;
    const { id } = await params;
    const body = await request.json();
    const {
      recordDate,
      bloodPressure,
      bloodSugar,
      heartRate,
      weight,
      temperature,
      notes
    } = body;

    // 检查记录是否存在
    const existingRecord = await db.query.healthRecords.findFirst({
      where: and(
        eq(healthRecords.id, BigInt(id)),
        eq(healthRecords.isDeleted, false)
      )
    });

    if (!existingRecord) {
      return NextResponse.json({ error: '健康记录不存在' }, { status: 404 });
    }

    // 如果修改了日期，检查新日期是否已有记录
    if (recordDate && recordDate !== existingRecord.recordDate) {
      const duplicateRecord = await db.query.healthRecords.findFirst({
        where: and(
          eq(healthRecords.userId, existingRecord.userId),
          eq(healthRecords.recordDate, recordDate),
          eq(healthRecords.isDeleted, false)
        )
      });

      if (duplicateRecord) {
        return NextResponse.json(
          { error: '该日期的健康记录已存在' },
          { status: 400 }
        );
      }
    }

    // 更新健康记录
    const updatedRecord = await db
      .update(healthRecords)
      .set({
        recordDate: recordDate ?? existingRecord.recordDate,
        bloodPressure: bloodPressure ?? existingRecord.bloodPressure,
        bloodSugar: bloodSugar ?? existingRecord.bloodSugar,
        heartRate: heartRate ?? existingRecord.heartRate,
        weight: weight ?? existingRecord.weight,
        temperature: temperature ?? existingRecord.temperature,
        notes: notes ?? existingRecord.notes,
        updatedBy: currentUser.id,
        updatedAt: new Date()
      })
      .where(eq(healthRecords.id, BigInt(id)))
      .returning();

    // 转换 BigInt 为字符串以支持 JSON 序列化
    const serializedRecord = {
      ...updatedRecord[0],
      id: updatedRecord[0].id.toString()
    };

    return NextResponse.json({
      success: true,
      data: serializedRecord,
      message: '健康记录更新成功'
    });
  } catch (error) {
    console.error('更新健康记录失败:', error);
    return NextResponse.json(
      {
        error: '更新健康记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/health-records/[id]
 * 删除健康记录(管理端)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth(request);
    if (
      !session ||
      !(await hasPermission(session, PERMISSIONS.HEALTH_RECORD.DELETE))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentUser = session.user;
    const { id } = await params;

    // 检查记录是否存在
    const existingRecord = await db.query.healthRecords.findFirst({
      where: and(
        eq(healthRecords.id, BigInt(id)),
        eq(healthRecords.isDeleted, false)
      )
    });

    if (!existingRecord) {
      return NextResponse.json({ error: '健康记录不存在' }, { status: 404 });
    }

    // 软删除
    await db
      .update(healthRecords)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedBy: currentUser.id
      })
      .where(eq(healthRecords.id, BigInt(id)));

    return NextResponse.json({
      success: true,
      message: '健康记录删除成功'
    });
  } catch (error) {
    console.error('删除健康记录失败:', error);
    return NextResponse.json(
      {
        error: '删除健康记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
