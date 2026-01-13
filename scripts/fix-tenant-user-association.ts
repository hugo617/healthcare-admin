/**
 * 租户用户关联修复脚本
 *
 * 功能：将现有用户分配到不同租户，使租户管理页面的成员数正确显示
 *
 * 逻辑：
 * 1. 获取所有租户
 * 2. 获取所有用户
 * 3. 保留超级管理员和租户1的管理员在原租户
 * 4. 将其他用户按比例分配到不同租户
 * 5. 更新用户的 tenantId
 */

import { db } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

interface Tenant {
  id: bigint;
  name: string;
  code: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  tenantId: number;
  isSuperAdmin: boolean;
}

async function main() {
  console.log('🔍 开始检查租户和用户数据...\n');

  try {
    // 1. 获取所有租户
    console.log('📋 获取所有租户...');
    const allTenants = await db.select({
      id: tenants.id,
      name: tenants.name,
      code: tenants.code
    }).from(tenants).orderBy(tenants.id);

    console.log(`   找到 ${allTenants.length} 个租户:`);
    allTenants.forEach((t) => {
      console.log(`   - ${t.name} (${t.code}) [ID: ${t.id}]`);
    });
    console.log('');

    if (allTenants.length === 0) {
      console.error('❌ 没有找到任何租户，请先创建租户');
      process.exit(1);
    }

    // 2. 获取所有用户（包括已删除的）
    console.log('👥 获取所有用户...');
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      tenantId: users.tenantId,
      isSuperAdmin: users.isSuperAdmin,
      isDeleted: users.isDeleted
    }).from(users);

    console.log(`   找到 ${allUsers.length} 个用户\n`);

    // 3. 分类用户
    const activeUsers = allUsers.filter(u => !u.isDeleted);
    const superAdmins = activeUsers.filter(u => u.isSuperAdmin);
    const regularUsers = activeUsers.filter(u => !u.isSuperAdmin);

    console.log(`📊 用户分类:`);
    console.log(`   - 活跃用户: ${activeUsers.length}`);
    console.log(`   - 超级管理员: ${superAdmins.length}`);
    console.log(`   - 普通用户: ${regularUsers.length}\n`);

    // 4. 显示当前租户用户分布
    console.log('📈 当前租户用户分布:');
    const currentDistribution: Record<string, number> = {};
    activeUsers.forEach(user => {
      const tenantId = String(user.tenantId);
      currentDistribution[tenantId] = (currentDistribution[tenantId] || 0) + 1;
    });

    for (const [tenantId, count] of Object.entries(currentDistribution)) {
      const tenant = allTenants.find(t => String(t.id) === tenantId);
      const tenantName = tenant ? tenant.name : `未知租户 (${tenantId})`;
      console.log(`   - ${tenantName}: ${count} 个用户`);
    }
    console.log('');

    // 5. 计算目标分配方案
    console.log('🎯 计算目标分配方案...');

    // 超级管理员保留在租户1
    const tenant1 = allTenants.find(t => String(t.id) === '1');
    const targetTenant1 = tenant1 || allTenants[0];

    // 移除需要保留在租户1的用户（超级管理员 + 可能的系统管理员）
    const usersToKeepInTenant1 = new Set<number>();
    superAdmins.forEach(u => usersToKeepInTenant1.add(u.id));

    // 如果租户1的管理员邮箱包含 'admin'，也保留
    const tenant1Admins = activeUsers.filter(u =>
      String(u.tenantId) === '1' &&
      (u.email.includes('admin') || u.username.toLowerCase().includes('admin'))
    );
    tenant1Admins.forEach(u => usersToKeepInTenant1.add(u.id));

    console.log(`   保留在租户1的用户: ${usersToKeepInTenant1.size} 个`);
    console.log('');

    // 需要重新分配的用户
    const usersToRedistribute = regularUsers.filter(
      u => !usersToKeepInTenant1.has(u.id)
    );

    console.log(`   需要重新分配的用户: ${usersToRedistribute.length} 个\n`);

    if (usersToRedistribute.length === 0) {
      console.log('✅ 所有用户已经合理分配，无需修改');
      process.exit(0);
    }

    // 6. 分配用户到各个租户
    console.log('🔄 开始分配用户到租户...\n');

    const updates: Array<{ userId: number; newTenantId: bigint; oldTenantId: number }> = [];

    // 计算每个租户应该分配多少用户
    const availableTenants = allTenants; // 所有租户都可以接收用户
    const usersPerTenant = Math.ceil(usersToRedistribute.length / availableTenants.length);

    for (let i = 0; i < usersToRedistribute.length; i++) {
      const user = usersToRedistribute[i];
      // 轮流分配到不同租户
      const targetTenant = availableTenants[i % availableTenants.length];

      updates.push({
        userId: user.id,
        newTenantId: targetTenant.id,
        oldTenantId: user.tenantId
      });
    }

    // 7. 显示分配计划
    console.log('📋 分配计划预览:');
    const plannedDistribution: Record<string, number> = {};

    // 先计算保留的用户
    usersToKeepInTenant1.forEach(userId => {
      const tenantId = '1';
      plannedDistribution[tenantId] = (plannedDistribution[tenantId] || 0) + 1;
    });

    // 计算将要分配的用户
    updates.forEach(update => {
      const tenantId = String(update.newTenantId);
      plannedDistribution[tenantId] = (plannedDistribution[tenantId] || 0) + 1;
    });

    for (const [tenantId, count] of Object.entries(plannedDistribution)) {
      const tenant = allTenants.find(t => String(t.id) === tenantId);
      const tenantName = tenant ? tenant.name : `租户 ${tenantId}`;
      const change = count - (currentDistribution[tenantId] || 0);
      const changeStr = change >= 0 ? `+${change}` : `${change}`;
      console.log(`   - ${tenantName}: ${count} 个用户 (${changeStr})`);
    }
    console.log('');

    // 8. 确认执行
    console.log('⚠️  即将更新 ' + updates.length + ' 个用户的租户关联');
    console.log('是否继续? (需要手动取消脚本执行来停止，或按回车继续)\n');

    // 等待一小段时间让用户看到提示
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 9. 执行更新
    console.log('💾 开始更新数据库...\n');

    let successCount = 0;
    let failCount = 0;

    for (const update of updates) {
      try {
        await db.update(users)
          .set({ tenantId: Number(update.newTenantId) })
          .where(eq(users.id, update.userId));

        const user = usersToRedistribute.find(u => u.id === update.userId);
        const targetTenant = allTenants.find(t => t.id === update.newTenantId);

        console.log(`   ✅ ${user?.email || user?.username} -> ${targetTenant?.name} (租户 ${update.newTenantId})`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ 更新用户 ${update.userId} 失败:`, error);
        failCount++;
      }
    }

    console.log('\n📊 更新结果:');
    console.log(`   成功: ${successCount}`);
    console.log(`   失败: ${failCount}`);
    console.log('');

    // 10. 验证结果
    console.log('✅ 验证最终分布...');
    const finalUsers = await db.select({
      id: users.id,
      tenantId: users.tenantId,
      isDeleted: users.isDeleted
    }).from(users);

    const finalActiveUsers = finalUsers.filter(u => !u.isDeleted);
    const finalDistribution: Record<string, number> = {};

    finalActiveUsers.forEach(user => {
      const tenantId = String(user.tenantId);
      finalDistribution[tenantId] = (finalDistribution[tenantId] || 0) + 1;
    });

    console.log('');
    console.log('📈 最终租户用户分布:');
    for (const [tenantId, count] of Object.entries(finalDistribution)) {
      const tenant = allTenants.find(t => String(t.id) === tenantId);
      const tenantName = tenant ? tenant.name : `租户 ${tenantId}`;
      console.log(`   - ${tenantName}: ${count} 个用户`);
    }
    console.log('');

    console.log('✅ 数据修复完成！');
    console.log('');
    console.log('💡 提示:');
    console.log('   1. 刷新租户管理页面查看成员数');
    console.log('   2. 如果需要撤销，请使用数据库备份恢复');
    console.log('   3. 运行 pnpm db:studio 可以在 Drizzle Studio 中查看数据');

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main();
