import { db } from '@/db';
import { healthArchives } from '@/db/schema';
import { eq, gte, lte, sql, and } from 'drizzle-orm';

/**
 * 生成客户编号
 * 格式: C + YYYYMMDD + 4位序号
 * 示例: C202512300001
 * @param userId 用户ID
 * @returns 客户编号
 */
export async function generateCustomerNo(userId: number): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // 查询当天该用户已创建的档案数量
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(healthArchives)
    .where(
      and(
        eq(healthArchives.userId, userId),
        gte(healthArchives.createdAt, todayStart),
        lte(healthArchives.createdAt, todayEnd),
        eq(healthArchives.isDeleted, false)
      )
    );

  const count = Number(result[0]?.count || 0);

  // 生成序号(从1开始,补0到4位)
  const sequence = (count + 1).toString().padStart(4, '0');

  return `C${dateStr}${sequence}`;
}
