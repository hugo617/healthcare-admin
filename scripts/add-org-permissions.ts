import { db } from "../src/db";
import { permissions, roles, rolePermissions } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function addOrganizationPermissions() {
  console.log('开始添加组织架构权限...');

  // 检查组织架构权限是否已存在
  const existingOrgPermission = await db.select().from(permissions).where(
    eq(permissions.code, 'account.organization')
  );

  if (existingOrgPermission.length > 0) {
    console.log('组织架构权限已存在，无需添加');
    return;
  }

  // 添加组织架构权限
  const orgPermissions = [
    { id: 14, name: '组织架构', code: 'account.organization', description: '组织架构管理权限', parentId: 1, sortOrder: 140 },
    { id: 141, name: '查看组织', code: 'account.organization.read', description: '查看组织列表和详情', parentId: 14, sortOrder: 141 },
    { id: 142, name: '新增组织', code: 'account.organization.create', description: '创建新组织', parentId: 14, sortOrder: 142 },
    { id: 143, name: '编辑组织', code: 'account.organization.update', description: '编辑组织信息', parentId: 14, sortOrder: 143 },
    { id: 144, name: '删除组织', code: 'account.organization.delete', description: '删除组织', parentId: 14, sortOrder: 144 },
  ];

  // 获取超级管理员角色
  const superAdminRoles = await db.select().from(roles).where(eq(roles.isSuper, true));

  if (superAdminRoles.length === 0) {
    console.log('未找到超级管理员角色');
    return;
  }

  const superAdminRole = superAdminRoles[0];

  // 插入权限并关联到超级管理员角色
  for (const permission of orgPermissions) {
    const [result] = await db.insert(permissions).values(permission).returning();

    // 将权限关联到超级管理员角色
    await db.insert(rolePermissions).values({
      roleId: superAdminRole.id,
      permissionId: result.id
    });

    console.log(`已添加权限: ${permission.name} (${permission.code})`);
  }

  console.log('组织架构权限添加完成！');
  process.exit(0);
}

addOrganizationPermissions().catch((error) => {
  console.error('添加权限失败:', error);
  process.exit(1);
});
