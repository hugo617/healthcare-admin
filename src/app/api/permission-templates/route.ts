import { db } from '@/db';
import { permissionTemplates, templatePermissions } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/service/response';

/**
 * GET /api/permission-templates
 * 获取权限模板列表
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // 构建查询条件
    const templates = await db
      .select({
        id: permissionTemplates.id,
        name: permissionTemplates.name,
        description: permissionTemplates.description,
        isSystem: permissionTemplates.isSystem,
        createdAt: permissionTemplates.createdAt,
        updatedAt: permissionTemplates.updatedAt
      })
      .from(permissionTemplates)
      .where(eq(permissionTemplates.isDeleted, false))
      .orderBy(
        desc(permissionTemplates.isSystem),
        asc(permissionTemplates.createdAt)
      );

    // 获取每个模板的权限数量
    const templatesWithPermissionCount = await Promise.all(
      templates.map(async (template) => {
        const [permissionCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(templatePermissions)
          .where(eq(templatePermissions.templateId, template.id));

        return {
          ...template,
          permissionCount: permissionCount?.count || 0
        };
      })
    );

    // 如果有搜索关键词，过滤结果
    let filteredTemplates = templatesWithPermissionCount;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredTemplates = templatesWithPermissionCount.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerSearch) ||
          (t.description?.toLowerCase().includes(lowerSearch) ?? false)
      );
    }

    return successResponse(filteredTemplates);
  } catch (error) {
    console.error('获取权限模板列表失败:', error);
    return errorResponse('获取权限模板列表失败');
  }
}

/**
 * POST /api/permission-templates
 * 创建权限模板
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return errorResponse('模板名称不能为空');
    }

    // 创建模板
    const [newTemplate] = await db
      .insert(permissionTemplates)
      .values({
        name,
        description: description || null,
        isSystem: false
      })
      .returning();

    // 如果有权限 ID，关联权限
    if (
      permissionIds &&
      Array.isArray(permissionIds) &&
      permissionIds.length > 0
    ) {
      const values = permissionIds.map((permissionId: number) => ({
        templateId: newTemplate.id,
        permissionId
      }));

      await db.insert(templatePermissions).values(values);
    }

    return successResponse(
      {
        ...newTemplate,
        permissionCount: permissionIds?.length || 0
      },
      '权限模板创建成功'
    );
  } catch (error) {
    console.error('创建权限模板失败:', error);
    return errorResponse('创建权限模板失败');
  }
}
