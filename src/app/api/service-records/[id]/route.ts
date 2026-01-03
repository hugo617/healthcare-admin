import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceRecords } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateServiceRecordSchema } from '@/lib/validators/service-record';
import { auth } from '@/lib/auth';
import { serializeServiceRecord } from '@/lib/utils/serialize';

/**
 * GET /api/service-records/:id
 * 获取单个服务记录详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recordId = BigInt(id);

    const [record] = await db
      .select()
      .from(serviceRecords)
      .where(
        and(
          eq(serviceRecords.id, recordId),
          eq(serviceRecords.userId, session.user.id),
          eq(serviceRecords.isDeleted, false)
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json(
        {
          code: 404,
          message: '服务记录不存在或无权访问'
        },
        { status: 404 }
      );
    }

    const serializedRecord = serializeServiceRecord(record);
    return NextResponse.json({
      code: 0,
      data: serializedRecord,
      message: '查询成功'
    });
  } catch (error: any) {
    console.error('获取服务记录详情失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: error.message || '查询失败'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/service-records/:id
 * 更新服务记录
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recordId = BigInt(id);

    // 检查记录是否存在
    const [existingRecord] = await db
      .select()
      .from(serviceRecords)
      .where(
        and(
          eq(serviceRecords.id, recordId),
          eq(serviceRecords.userId, session.user.id),
          eq(serviceRecords.isDeleted, false)
        )
      )
      .limit(1);

    if (!existingRecord) {
      return NextResponse.json(
        {
          code: 404,
          message: '服务记录不存在或无权访问'
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateServiceRecordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          code: 400,
          message: '数据验证失败',
          errors: validatedData.error.errors
        },
        { status: 400 }
      );
    }

    const [updatedRecord] = await db
      .update(serviceRecords)
      .set({
        ...validatedData.data,
        updatedAt: new Date(),
        updatedBy: session.user.id
      })
      .where(eq(serviceRecords.id, recordId))
      .returning();

    const serializedRecord = serializeServiceRecord(updatedRecord);
    return NextResponse.json({
      code: 0,
      data: serializedRecord,
      message: '更新成功'
    });
  } catch (error: any) {
    console.error('更新服务记录失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: error.message || '更新失败'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/service-records/:id
 * 删除服务记录(软删除)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recordId = BigInt(id);

    const [existingRecord] = await db
      .select()
      .from(serviceRecords)
      .where(
        and(
          eq(serviceRecords.id, recordId),
          eq(serviceRecords.userId, session.user.id),
          eq(serviceRecords.isDeleted, false)
        )
      )
      .limit(1);

    if (!existingRecord) {
      return NextResponse.json(
        {
          code: 404,
          message: '服务记录不存在或无权访问'
        },
        { status: 404 }
      );
    }

    await db
      .update(serviceRecords)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        status: 'deleted',
        updatedAt: new Date(),
        updatedBy: session.user.id
      })
      .where(eq(serviceRecords.id, recordId));

    return NextResponse.json({
      code: 0,
      data: null,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('删除服务记录失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: error.message || '删除失败'
      },
      { status: 500 }
    );
  }
}
