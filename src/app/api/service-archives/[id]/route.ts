import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceArchives } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateServiceArchiveSchema } from '@/lib/validators/service-archive';
import {
  successResponse,
  errorResponse,
  notFoundResponse
} from '@/service/response';
import { auth } from '@/lib/auth';
import { serializeServiceArchive } from '@/lib/utils/serialize';

/**
 * GET /api/service-archives/:id
 * 获取单个档案详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 2. 获取档案ID
    const { id } = await params;
    const archiveId = BigInt(id);

    // 3. 查询档案 - 必须属于当前用户
    const [archive] = await db
      .select()
      .from(serviceArchives)
      .where(
        and(
          eq(serviceArchives.id, archiveId),
          eq(serviceArchives.userId, session.user.id), // 权限检查
          eq(serviceArchives.isDeleted, false)
        )
      )
      .limit(1);

    if (!archive) {
      return notFoundResponse('档案不存在或无权访问');
    }

    // 4. 序列化数据
    const serializedArchive = serializeServiceArchive(archive);

    // 5. 返回结果
    return successResponse(serializedArchive);
  } catch (error: any) {
    console.error('获取服务档案详情失败:', error);
    return errorResponse(error.message || '查询失败');
  }
}

/**
 * PUT /api/service-archives/:id
 * 更新档案
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 2. 获取档案ID
    const { id } = await params;
    const archiveId = BigInt(id);

    // 3. 检查档案是否存在且属于当前用户
    const [existingArchive] = await db
      .select()
      .from(serviceArchives)
      .where(
        and(
          eq(serviceArchives.id, archiveId),
          eq(serviceArchives.userId, session.user.id),
          eq(serviceArchives.isDeleted, false)
        )
      )
      .limit(1);

    if (!existingArchive) {
      return notFoundResponse('档案不存在或无权访问');
    }

    // 4. 解析请求体
    const body = await request.json();

    // 5. 验证数据
    const validatedData = updateServiceArchiveSchema.parse(body);

    // 6. 更新档案
    const [updatedArchive] = await db
      .update(serviceArchives)
      .set({
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: session.user.id
      })
      .where(eq(serviceArchives.id, archiveId))
      .returning();

    // 7. 序列化数据
    const serializedArchive = serializeServiceArchive(updatedArchive);

    // 8. 返回结果
    return successResponse({ ...serializedArchive, message: '更新成功' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          code: 400,
          message: '数据验证失败',
          errors: error.errors
        },
        { status: 400 }
      );
    }

    console.error('更新服务档案失败:', error);
    return errorResponse(error.message || '更新失败');
  }
}

/**
 * DELETE /api/service-archives/:id
 * 删除档案(软删除)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 2. 获取档案ID
    const { id } = await params;
    const archiveId = BigInt(id);

    // 3. 检查档案是否存在且属于当前用户
    const [existingArchive] = await db
      .select()
      .from(serviceArchives)
      .where(
        and(
          eq(serviceArchives.id, archiveId),
          eq(serviceArchives.userId, session.user.id),
          eq(serviceArchives.isDeleted, false)
        )
      )
      .limit(1);

    if (!existingArchive) {
      return notFoundResponse('档案不存在或无权访问');
    }

    // 4. 软删除档案
    await db
      .update(serviceArchives)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        status: 'deleted',
        updatedAt: new Date(),
        updatedBy: session.user.id
      })
      .where(eq(serviceArchives.id, archiveId));

    // 5. 返回结果
    return successResponse({ message: '删除成功' });
  } catch (error: any) {
    console.error('删除服务档案失败:', error);
    return errorResponse(error.message || '删除失败');
  }
}
