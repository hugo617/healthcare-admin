import { db } from "../src/db";
import { permissionTemplates, templatePermissions, permissions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function initPermissionTemplates() {
  console.log('开始初始化权限模板...');

  // 获取所有权限
  const allPermissions = await db.select().from(permissions);
  const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

  // 模板定义
  const templates = [
    {
      name: '超级管理员模板',
      description: '包含所有系统权限的完整模板',
      isSystem: true,
      permissionCodes: allPermissions.map(p => p.code) // 包含所有权限
    },
    {
      name: '用户管理模板',
      description: '用户管理相关权限，适合用户管理员',
      isSystem: false,
      permissionCodes: [
        'account.user.read',
        'account.user.create',
        'account.user.update',
        'account.permission.read',
        'account.organization.read'
      ]
    },
    {
      name: '只读用户模板',
      description: '只读权限，适合查看数据的用户',
      isSystem: false,
      permissionCodes: [
        'account.user.read',
        'account.role.read',
        'account.permission.read',
        'account.organization.read',
        'system.log.read'
      ]
    },
    {
      name: '角色管理员模板',
      description: '角色和权限管理权限',
      isSystem: false,
      permissionCodes: [
        'account.role.read',
        'account.role.create',
        'account.role.update',
        'account.permission.read',
        'account.organization.read',
        'account.user.read'
      ]
    },
    {
      name: '系统管理员模板',
      description: '系统管理相关权限',
      isSystem: false,
      permissionCodes: [
        'account.user.read',
        'account.role.read',
        'account.permission.read',
        'account.organization.read',
        'system.log.read',
        'system.log.create',
        'system.log.update',
        'system.log.delete'
      ]
    }
  ];

  for (const template of templates) {
    // 检查模板是否已存在
    const existing = await db
      .select()
      .from(permissionTemplates)
      .where(eq(permissionTemplates.name, template.name));

    if (existing.length > 0) {
      console.log(`模板 "${template.name}" 已存在，跳过...`);
      continue;
    }

    // 创建模板
    const [createdTemplate] = await db
      .insert(permissionTemplates)
      .values({
        name: template.name,
        description: template.description,
        isSystem: template.isSystem
      })
      .returning();

    // 获取权限 ID
    const permissionIds = template.permissionCodes
      .map(code => permissionMap.get(code))
      .filter((id): id is number => id !== undefined);

    // 创建权限关联
    if (permissionIds.length > 0) {
      await db.insert(templatePermissions).values(
        permissionIds.map(permissionId => ({
          templateId: createdTemplate.id,
          permissionId
        }))
      );
    }

    console.log(`✓ 创建模板 "${template.name}" - ${permissionIds.length} 个权限`);
  }

  console.log('权限模板初始化完成！');
}

async function main() {
  try {
    await initPermissionTemplates();
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

main();
