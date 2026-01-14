#!/usr/bin/env tsx
/**
 * 清理无效的验证码数据脚本
 *
 * 解决因时间异常导致的"发送过于频繁"问题
 */

import { db } from '@/db';
import { verificationCodes } from '@/db/schema';
import { lt, gt, sql } from 'drizzle-orm';
import { config } from 'dotenv';

config({ path: `.env.local` });

async function fixSmsCodes() {
  console.log('开始清理验证码数据...\n');

  try {
    // 1. 查询未来的验证码记录
    const now = new Date();
    console.log(`当前时间: ${now.toISOString()}`);

    const futureCodes = await db
      .select()
      .from(verificationCodes)
      .where(
        gt(verificationCodes.createdAt, now)
      );

    if (futureCodes.length > 0) {
      console.log(`发现 ${futureCodes.length} 条时间异常的记录（createdAt 在未来）`);

      for (const code of futureCodes) {
        console.log(`  - ID: ${code.id}, Phone: ${code.phone}, createdAt: ${code.createdAt?.toISOString() ?? 'null'}`);
      }

      // 删除这些异常数据
      const result = await db
        .delete(verificationCodes)
        .where(
          gt(verificationCodes.createdAt, now)
        );

      console.log(`已删除 ${result.rowCount} 条异常记录\n`);
    } else {
      console.log('未发现时间异常的验证码记录\n');
    }

    // 2. 清理过期很久的验证码（超过7天）
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oldCodesResult = await db
      .delete(verificationCodes)
      .where(
        lt(verificationCodes.createdAt, weekAgo)
      );

    console.log(`已清理 ${oldCodesResult.rowCount} 条超过7天的旧验证码记录`);

    // 3. 查询最新的几条验证码记录用于验证
    const latestCodes = await db
      .select()
      .from(verificationCodes)
      .orderBy(verificationCodes.createdAt)
      .limit(5);

    if (latestCodes.length > 0) {
      console.log('\n最新的5条验证码记录:');
      for (const code of latestCodes) {
        console.log(`  - Phone: ${code.phone}, createdAt: ${code.createdAt?.toISOString() ?? 'null'}`);
      }
    }

    console.log('\n✅ 验证码数据清理完成');

  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixSmsCodes();