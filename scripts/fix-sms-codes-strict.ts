#!/usr/bin/env tsx
/**
 * 严格清理无效验证码数据脚本
 *
 * 修复数据库中 createdAt 为未来时间的问题
 */

import { db } from '@/db';
import { verificationCodes } from '@/db/schema';
import { lt, sql } from 'drizzle-orm';
import { config } from 'dotenv';

config({ path: `.env.local` });

async function fixSmsCodes() {
  console.log('开始严格清理验证码数据...\n');

  try {
    const now = new Date();
    console.log(`当前时间: ${now.toISOString()}`);
    console.log(`当前时间戳: ${now.getTime()}\n`);

    // 使用数据库查询直接删除所有时间戳大于当前时间的记录
    const result = await db
      .delete(verificationCodes)
      .where(
        sql`${verificationCodes.createdAt} > NOW()`
      );

    console.log(`✅ 已删除 ${result.rowCount} 条 createdAt 时间异常的记录\n`);

    // 再次查询现在的数据
    const remainingCodes = await db
      .select()
      .from(verificationCodes)
      .orderBy(sql`${verificationCodes.createdAt} DESC`)
      .limit(10);

    if (remainingCodes.length > 0) {
      console.log('清理后最新的10条记录:');
      for (const code of remainingCodes) {
        const isFuture = code.createdAt > now;
        console.log(`  ${isFuture ? '⚠️' : '✓'} Phone: ${code.phone}, createdAt: ${code.createdAt.toISOString()}`);
      }
    } else {
      console.log('ℹ️  所有验证码记录已清理完毕');
    }

    console.log('\n✅ 严格清理完成');

  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixSmsCodes();