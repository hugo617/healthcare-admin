import { db } from '@/db';
import { organizations, userOrganizations } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { Logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/service/response';
import { NextResponse } from 'next/server';

// 获取组织详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = BigInt(params.id);

    // 获取组织基本信息
    const orgList = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (orgList.length === 0) {
      return errorResponse('组织不存在');
    }

    const org = orgList[0];

    // 获取组织的用户数量
    const [userCountResult] = await db
      .select({ count: count() })
      .from(userOrganizations)
      .where(eq(userOrganizations.organizationId, id));

    // 获取子组织数量
    const [childCountResult] = await db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.parentId, id));

    return successResponse({
      ...org,
      userCount: userCountResult.count,
      childCount: childCountResult.count
    });
  } catch (error) {
    console.error('获取组织详情失败:', error);
    return errorResponse('获取组织详情失败');
  }
}

// 更新组织
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = getCurrentUser(request);

  try {
    const id = BigInt(params.id);
    const body = await request.json();
    const { name, code, parentId, leaderId, status, sortOrder } = body;

    // 检查组织是否存在
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (existingOrg.length === 0) {
      return errorResponse('组织不存在');
    }

    // 验证父组织
    if (parentId && parentId !== id.toString()) {
      // 不能将自己设置为父组织
      if (parentId === id.toString()) {
        return errorResponse('不能将自己设置为父组织');
      }

      // 检查是否会形成循环引用
      const checkCircularRef = async (
        checkParentId: string
      ): Promise<boolean> => {
        if (checkParentId === id.toString()) {
          return true; // 发现循环
        }

        const parentOrg = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, BigInt(checkParentId)))
          .limit(1);

        if (parentOrg.length === 0 || !parentOrg[0].parentId) {
          return false;
        }

        return checkCircularRef(parentOrg[0].parentId.toString());
      };

      const hasCircular = await checkCircularRef(parentId);
      if (hasCircular) {
        return errorResponse('不能形成循环引用');
      }

      // 验证父组织是否存在
      const parentOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, BigInt(parentId)))
        .limit(1);

      if (parentOrg.length === 0) {
        return errorResponse('父组织不存在');
      }
    }

    // 计算新路径（仅在 parentId 变更时）
    let newPath: string | null = null;
    if (parentId !== undefined && parentId !== null) {
      const parentOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, BigInt(parentId)))
        .limit(1);

      if (parentOrg.length > 0) {
        newPath = parentOrg[0].path
          ? `${parentOrg[0].path}.${parentId}`
          : parentId;
      }
    } else if (parentId === null) {
      // 如果明确设置为 null（顶级组织），路径设为当前组织ID
      newPath = String(id);
    }

    // 更新数据
    const updateData: any = {
      updatedBy: currentUser?.id
    };

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (parentId !== undefined)
      updateData.parentId = parentId ? BigInt(parentId) : null;
    if (leaderId !== undefined) updateData.leaderId = leaderId || null;
    if (status !== undefined) updateData.status = status;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (newPath !== null) updateData.path = newPath;

    await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id));

    return successResponse({
      id: String(id),
      message: '组织更新成功'
    });
  } catch (error) {
    console.error('更新组织失败:', error);
    return errorResponse('更新组织失败');
  }
}

// 删除组织
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = getCurrentUser(request);

  try {
    const id = BigInt(params.id);

    // 检查组织是否存在
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (existingOrg.length === 0) {
      return errorResponse('组织不存在');
    }

    // 检查是否有子组织
    const [childCountResult] = await db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.parentId, id));

    if (childCountResult.count > 0) {
      return errorResponse('请先删除子组织');
    }

    // 检查是否有用户
    const [userCountResult] = await db
      .select({ count: count() })
      .from(userOrganizations)
      .where(eq(userOrganizations.organizationId, id));

    if (userCountResult.count > 0) {
      return errorResponse('请先将用户移出该组织');
    }

    // 删除组织
    await db.delete(organizations).where(eq(organizations.id, id));

    return successResponse({
      id: String(id),
      message: '组织删除成功'
    });
  } catch (error) {
    console.error('删除组织失败:', error);
    return errorResponse('删除组织失败');
  }
}
