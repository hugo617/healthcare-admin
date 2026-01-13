import { db } from '@/db';
import { permissionTemplates, templatePermissions } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/permission-templates/:id
 * 获取权限模板详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse('未授权');
    }

    const { id } = await params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return errorResponse('无效的模板 ID');
    }

    // 获取模板信息
    const [template] = await db
      .select()
      .from(permissionTemplates)
      .where(
        and(
          eq(permissionTemplates.id, templateId),
          eq(permissionTemplates.isDeleted, false),
          eq(permissionTemplates.tenantId, user.tenantId)
        )
      )
      .limit(1);

    if (!template) {
      return errorResponse('模板不存在');
    }

    // 获取模板关联的权限
    const permissions = await db
      .select({
        permissionId: templatePermissions.permissionId
      })
      .from(templatePermissions)
      .where(eq(templatePermissions.templateId, templateId));

    return successResponse({
      ...template,
      permissionIds: permissions.map((p) => p.permissionId)
    });
  } catch (error) {
    console.error('获取权限模板详情失败:', error);
    return errorResponse('获取权限模板详情失败');
  }
}

/**
 * PUT /api/permission-templates/:id
 * 更新权限模板
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse('未授权');
    }

    const { id } = await params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return errorResponse('无效的模板 ID');
    }

    const body = await request.json();
    const { name, description, permissionIds } = body;

    // 检查模板是否存在
    const [existingTemplate] = await db
      .select()
      .from(permissionTemplates)
      .where(
        and(
          eq(permissionTemplates.id, templateId),
          eq(permissionTemplates.isDeleted, false),
          eq(permissionTemplates.tenantId, user.tenantId)
        )
      )
      .limit(1);

    if (!existingTemplate) {
      return errorResponse('模板不存在');
    }

    // 系统模板不能修改
    if (existingTemplate.isSystem) {
      return errorResponse('系统模板不能修改');
    }

    // 更新模板基本信息
    await db
      .update(permissionTemplates)
      .set({
        name: name || existingTemplate.name,
        description:
          description !== undefined
            ? description
            : existingTemplate.description,
        updatedAt: new Date(),
        updatedBy: user.id
      })
      .where(eq(permissionTemplates.id, templateId));

    // 如果提供了新的权限列表，更新关联
    if (permissionIds && Array.isArray(permissionIds)) {
      // 删除旧的关联
      await db
        .delete(templatePermissions)
        .where(eq(templatePermissions.templateId, templateId));

      // 添加新的关联
      if (permissionIds.length > 0) {
        const values = permissionIds.map((permissionId: number) => ({
          templateId,
          permissionId,
          tenantId: user.tenantId
        }));
        await db.insert(templatePermissions).values(values);
      }
    }

    return successResponse(null, '权限模板更新成功');
  } catch (error) {
    console.error('更新权限模板失败:', error);
    return errorResponse('更新权限模板失败');
  }
}

/**
 * DELETE /api/permission-templates/:id
 * 删除权限模板
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse('未授权');
    }

    const { id } = await params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return errorResponse('无效的模板 ID');
    }

    // 检查模板是否存在
    const [existingTemplate] = await db
      .select()
      .from(permissionTemplates)
      .where(
        and(
          eq(permissionTemplates.id, templateId),
          eq(permissionTemplates.isDeleted, false),
          eq(permissionTemplates.tenantId, user.tenantId)
        )
      )
      .limit(1);

    if (!existingTemplate) {
      return errorResponse('模板不存在');
    }

    // 系统模板不能删除
    if (existingTemplate.isSystem) {
      return errorResponse('系统模板不能删除');
    }

    // 软删除模板
    await db
      .update(permissionTemplates)
      .set({
        isDeleted: true,
        deletedAt: new Date()
      })
      .where(eq(permissionTemplates.id, templateId));

    return successResponse(null, '权限模板删除成功');
  } catch (error) {
    console.error('删除权限模板失败:', error);
    return errorResponse('删除权限模板失败');
  }
}
