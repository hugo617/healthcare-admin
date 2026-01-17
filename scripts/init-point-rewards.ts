/**
 * 初始化积分奖励配置
 *并为现有用户创建积分记录
 */

import { db } from '@/db';
import { users, pointRewards, userPoints } from '@/db/schema';

// 积分奖励配置
const REWARD_CONFIGS = [
  {
    code: 'daily_check_in',
    name: '每日签到',
    type: 'daily' as const,
    points: 10,
    experience: 10,
    maxDailyTimes: 1,
    maxTotalTimes: 0,
    streakDays: 0,
    sortOrder: 1
  },
  {
    code: 'streak_3_days',
    name: '连续签到3天奖励',
    type: 'streak' as const,
    points: 5,
    experience: 5,
    maxDailyTimes: 1,
    maxTotalTimes: 0,
    streakDays: 3,
    sortOrder: 2
  },
  {
    code: 'streak_7_days',
    name: '连续签到7天奖励',
    type: 'streak' as const,
    points: 15,
    experience: 15,
    maxDailyTimes: 1,
    maxTotalTimes: 0,
    streakDays: 7,
    sortOrder: 3
  },
  {
    code: 'streak_30_days',
    name: '连续签到30天奖励',
    type: 'streak' as const,
    points: 50,
    experience: 50,
    maxDailyTimes: 1,
    maxTotalTimes: 0,
    streakDays: 30,
    sortOrder: 4
  },
  {
    code: 'complete_health_profile',
    name: '完善健康档案',
    type: 'one_time' as const,
    points: 50,
    experience: 30,
    maxDailyTimes: 0,
    maxTotalTimes: 1,
    streakDays: 0,
    sortOrder: 5
  },
  {
    code: 'daily_health_record',
    name: '每日健康记录',
    type: 'daily' as const,
    points: 5,
    experience: 5,
    maxDailyTimes: 2, // 每天最多记录2次
    maxTotalTimes: 0,
    streakDays: 0,
    sortOrder: 6
  },
  {
    code: 'service_appointment',
    name: '服务预约',
    type: 'one_time' as const,
    points: 20,
    experience: 10,
    maxDailyTimes: 0,
    maxTotalTimes: 0, // 不限制次数
    streakDays: 0,
    sortOrder: 7
  },
  {
    code: 'service_review',
    name: '服务评价',
    type: 'one_time' as const,
    points: 10,
    experience: 5,
    maxDailyTimes: 0,
    maxTotalTimes: 0, // 不限制次数
    streakDays: 0,
    sortOrder: 8
  },
  {
    code: 'invite_friend',
    name: '邀请好友',
    type: 'one_time' as const,
    points: 100,
    experience: 50,
    maxDailyTimes: 0,
    maxTotalTimes: 0, // 不限制次数
    streakDays: 0,
    sortOrder: 9
  }
];

async function initPointRewards() {
  console.log('开始初始化积分奖励配置...');

  try {
    // 插入奖励配置
    for (const config of REWARD_CONFIGS) {
      // 检查是否已存在
      const existing = await db
        .select()
        .from(pointRewards)
        .where(eq(pointRewards.code, config.code))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(pointRewards).values({
          ...config,
          tenantId: 1,
          isActive: true,
          metadata: {},
          isDeleted: false
        });
        console.log(`✓ 创建奖励配置: ${config.name}`);
      } else {
        console.log(`- 奖励配置已存在: ${config.name}`);
      }
    }

    console.log('积分奖励配置初始化完成！');
  } catch (error) {
    console.error('初始化积分奖励配置失败:', error);
  }
}

async function initUserPoints() {
  console.log('开始为现有用户创建积分记录...');

  try {
    // 获取所有现有用户
    const allUsers = await db
      .select({
        id: users.id,
        tenantId: users.tenantId
      })
      .from(users)
      .where(eq(users.isDeleted, false));

    console.log(`找到 ${allUsers.length} 个用户`);

    for (const user of allUsers) {
      // 检查用户是否已有积分记录
      const existing = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, user.id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(userPoints).values({
          userId: user.id,
          tenantId: Number(user.tenantId),
          points: 0,
          totalEarned: 0,
          totalSpent: 0,
          level: 1,
          experience: 0,
          nextLevelExp: 50,
          checkInStreak: 0,
          totalCheckInDays: 0,
          metadata: {},
          isDeleted: false
        });
        console.log(`✓ 为用户 ${user.id} 创建积分记录`);
      } else {
        console.log(`- 用户 ${user.id} 已有积分记录`);
      }
    }

    console.log('用户积分记录初始化完成！');
  } catch (error) {
    console.error('初始化用户积分记录失败:', error);
  }
}

async function main() {
  console.log('========================================');
  console.log('积分系统初始化脚本');
  console.log('========================================\n');

  await initPointRewards();
  console.log('');
  await initUserPoints();

  console.log('\n========================================');
  console.log('初始化完成！');
  console.log('========================================');

  process.exit(0);
}

// 导入 eq 函数
import { eq } from 'drizzle-orm';

// 运行脚本
main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
