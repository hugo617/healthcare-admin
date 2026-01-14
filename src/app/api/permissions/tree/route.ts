import { db } from '@/db';
import { permissions, rolePermissions } from '@/db/schema';
import { isNull, eq, and, count, asc } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/service/response';

interface PermissionTreeNode {
  id: number;
  name: string;
  code: string;
  type: 'menu' | 'page' | 'button' | 'api' | 'data';
  description?: string | null;
  parentId: number | null;
  sortOrder: number;
  isSystem: boolean;
  frontPath?: string | null;
  apiPath?: string | null;
  method?: string | null;
  status: string;
  roleUsageCount: number;
  createdAt: Date;
  updatedAt: Date | null;
  children: PermissionTreeNode[];
}

/**
 * 递归构建权限树
 */
async function buildPermissionTree(
  parentId: number | null = null
): Promise<PermissionTreeNode[]> {
  // 构建查询条件
  const whereClause =
    parentId === null
      ? and(isNull(permissions.parentId), eq(permissions.isDeleted, false))
      : and(
          eq(permissions.parentId, parentId),
          eq(permissions.isDeleted, false)
        );

  // 查询权限及其使用角色数
  const perms = await db
    .select({
      id: permissions.id,
      name: permissions.name,
      code: permissions.code,
      type: permissions.type,
      description: permissions.description,
      parentId: permissions.parentId,
      sortOrder: permissions.sortOrder,
      isSystem: permissions.isSystem,
      frontPath: permissions.frontPath,
      apiPath: permissions.apiPath,
      method: permissions.method,
      status: permissions.status,
      createdAt: permissions.createdAt,
      updatedAt: permissions.updatedAt,
      roleUsageCount: count(rolePermissions.roleId)
    })
    .from(permissions)
    .leftJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
    .where(whereClause)
    .groupBy(permissions.id)
    .orderBy(asc(permissions.sortOrder), asc(permissions.name));

  // 递归构建子节点
  const result: PermissionTreeNode[] = [];
  for (const perm of perms) {
    const node: PermissionTreeNode = {
      id: perm.id,
      name: perm.name,
      code: perm.code,
      type: perm.type as 'menu' | 'page' | 'button' | 'api' | 'data',
      description: perm.description,
      parentId: perm.parentId,
      sortOrder: perm.sortOrder || 0,
      isSystem: perm.isSystem || false,
      frontPath: perm.frontPath,
      apiPath: perm.apiPath,
      method: perm.method,
      status: perm.status || 'active',
      roleUsageCount: Number(perm.roleUsageCount) || 0,
      createdAt: perm.createdAt || new Date(),
      updatedAt: perm.updatedAt,
      children: []
    };

    // 递归获取子节点
    node.children = await buildPermissionTree(perm.id);
    result.push(node);
  }

  return result;
}

/**
 * GET /api/permissions/tree
 * 获取权限树结构，包含每个权限的角色使用数量
 */
export async function GET(request: Request) {
  try {
    const tree = await buildPermissionTree();

    // 计算总数（包括所有节点）
    const countNodes = (nodes: PermissionTreeNode[]): number => {
      let count = 0;
      for (const node of nodes) {
        count += 1;
        count += countNodes(node.children);
      }
      return count;
    };

    const total = countNodes(tree);

    return successResponse({ tree, total });
  } catch (error) {
    console.error('获取权限树失败:', error);
    return errorResponse('获取权限树失败');
  }
}
