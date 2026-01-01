import { db } from '@/db';
import { organizations, userOrganizations, users } from '@/db/schema';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/service/response';

interface OrgTreeNode {
  id: bigint;
  tenantId: bigint;
  name: string;
  code: string | null;
  path: string | null;
  parentId: bigint | null;
  leaderId: number | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  userCount?: number;
  leader?: {
    id: number;
    username: string;
    realName: string | null;
    email: string;
  };
  children: OrgTreeNode[];
}

// 递归构建组织树
async function buildTree(parentId: bigint | null): Promise<OrgTreeNode[]> {
  // 获取当前层级的组织
  const whereClause =
    parentId === null
      ? isNull(organizations.parentId)
      : eq(organizations.parentId, parentId);

  const orgs = await db
    .select({
      id: organizations.id,
      tenantId: organizations.tenantId,
      name: organizations.name,
      code: organizations.code,
      path: organizations.path,
      parentId: organizations.parentId,
      leaderId: organizations.leaderId,
      status: organizations.status,
      sortOrder: organizations.sortOrder,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      createdBy: organizations.createdBy,
      updatedBy: organizations.updatedBy,
      userCount: sql<number>`count(DISTINCT ${userOrganizations.userId})`.as(
        'userCount'
      )
    })
    .from(organizations)
    .leftJoin(
      userOrganizations,
      eq(organizations.id, userOrganizations.organizationId)
    )
    .where(whereClause)
    .groupBy(organizations.id)
    .orderBy(organizations.sortOrder, organizations.name);

  // 为每个组织递归获取子节点和负责人信息
  const result: OrgTreeNode[] = [];

  for (const org of orgs) {
    const node: OrgTreeNode = {
      ...org,
      children: []
    };

    // 获取负责人信息
    if (org.leaderId) {
      const leaderList = await db
        .select({
          id: users.id,
          username: users.username,
          realName: users.realName,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, org.leaderId))
        .limit(1);

      if (leaderList.length > 0) {
        node.leader = leaderList[0];
      }
    }

    // 递归获取子组织
    node.children = await buildTree(org.id);

    result.push(node);
  }

  return result;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeUserCount = searchParams.get('includeUserCount') === 'true';

    // 从根节点开始构建树
    const tree = await buildTree(null);

    return successResponse(tree);
  } catch (error) {
    console.error('获取组织树失败:', error);
    return errorResponse('获取组织树失败');
  }
}
