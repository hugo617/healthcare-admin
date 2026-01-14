import { db } from '@/db';
import { permissions } from '@/db/schema';
import { errorResponse, successResponse } from '@/service/response';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permissionId = parseInt(id);
    const body = await request.json();

    // 检查权限是否存在
    const [existing] = await db
      .select()
      .from(permissions)
      .where(
        and(eq(permissions.id, permissionId), eq(permissions.isDeleted, false))
      )
      .limit(1);

    if (!existing) {
      return errorResponse('权限不存在');
    }

    // 系统权限不允许修改某些字段
    if (existing.isSystem) {
      // 只允许修改 description 和 sortOrder
      const { description, sortOrder } = body;
      await db
        .update(permissions)
        .set({
          ...(description !== undefined && { description }),
          ...(sortOrder !== undefined && { sortOrder })
        })
        .where(eq(permissions.id, permissionId));
    } else {
      // 非系统权限可以修改所有字段
      const {
        name,
        code,
        type,
        description,
        parentId,
        sortOrder,
        frontPath,
        apiPath,
        method,
        resourceType
      } = body;

      await db
        .update(permissions)
        .set({
          ...(name !== undefined && { name }),
          ...(code !== undefined && { code }),
          ...(type !== undefined && { type }),
          ...(description !== undefined && { description }),
          ...(parentId !== undefined && { parentId }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(frontPath !== undefined && { frontPath }),
          ...(apiPath !== undefined && { apiPath }),
          ...(method !== undefined && { method }),
          ...(resourceType !== undefined && { resourceType })
        })
        .where(eq(permissions.id, permissionId));
    }

    // 返回更新后的权限
    const [updated] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    return successResponse({ ...updated, message: '权限更新成功' });
  } catch (error) {
    console.error('更新权限失败:', error);
    return errorResponse('更新权限失败');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permissionId = parseInt(id);

    // 检查权限是否存在
    const [existing] = await db
      .select()
      .from(permissions)
      .where(
        and(eq(permissions.id, permissionId), eq(permissions.isDeleted, false))
      )
      .limit(1);

    if (!existing) {
      return errorResponse('权限不存在');
    }

    // 系统权限不允许删除
    if (existing.isSystem) {
      return errorResponse('系统权限不能删除');
    }

    // 软删除
    await db
      .update(permissions)
      .set({
        isDeleted: true,
        deletedAt: new Date()
      })
      .where(eq(permissions.id, permissionId));

    return successResponse({ message: '权限删除成功' });
  } catch (error) {
    console.error('删除权限失败:', error);
    return errorResponse('删除权限失败');
  }
}
