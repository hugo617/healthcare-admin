/**
 * 积分系统核心服务
 *
 * 功能包括：
 * - 积分添加/扣除
 * - 签到逻辑（含连续签到奖励）
 * - 等级计算和升级
 * - 积分过期处理
 */

import { db } from '@/db';
import {
  userPoints,
  pointTransactions,
  pointRewards,
  type UserPoints,
  type NewUserPoints,
  type NewPointTransaction
} from '@/db/schema';
import { eq, and, desc, gte, lt } from 'drizzle-orm';

// 等级配置
export const LEVEL_CONFIG = [
  { level: 1, name: '新手', requiredExp: 0 },
  { level: 2, name: '初级', requiredExp: 50 },
  { level: 3, name: '中级', requiredExp: 150 },
  { level: 4, name: '高级', requiredExp: 300 },
  { level: 5, name: '专家', requiredExp: 600 },
  { level: 6, name: '大师', requiredExp: 1200 },
  { level: 7, name: '宗师', requiredExp: 2500 }
];

/**
 * 获取或创建用户积分记录
 */
export async function getOrCreateUserPoints(
  userId: number,
  tenantId: number = 1
): Promise<UserPoints> {
  const existing = await db
    .select()
    .from(userPoints)
    .where(
      and(eq(userPoints.userId, userId), eq(userPoints.tenantId, tenantId))
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // 创建新用户的积分记录
  const newUserPoints: NewUserPoints = {
    userId,
    tenantId,
    points: 0,
    totalEarned: 0,
    totalSpent: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 50,
    checkInStreak: 0,
    totalCheckInDays: 0
  };

  const inserted = await db
    .insert(userPoints)
    .values(newUserPoints)
    .returning();

  return inserted[0];
}

/**
 * 计算用户当前等级
 */
export function calculateLevel(experience: number): {
  level: number;
  nextLevelExp: number;
  levelName: string;
} {
  let currentLevel = 1;
  let nextLevelExp = 50;

  for (const config of LEVEL_CONFIG) {
    if (experience >= config.requiredExp) {
      currentLevel = config.level;
      // 计算下一级所需经验
      const nextConfig = LEVEL_CONFIG.find((c) => c.level === config.level + 1);
      nextLevelExp = nextConfig
        ? nextConfig.requiredExp - config.requiredExp
        : config.requiredExp;
    } else {
      break;
    }
  }

  return {
    level: currentLevel,
    nextLevelExp,
    levelName: LEVEL_CONFIG[currentLevel - 1]?.name || '新手'
  };
}

/**
 * 添加积分和经验
 */
export async function addPoints(params: {
  userId: number;
  tenantId?: number;
  points: number;
  experience: number;
  source: string;
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}): Promise<{ userPoints: UserPoints; levelUp: boolean }> {
  const {
    userId,
    tenantId = 1,
    points,
    experience,
    source,
    description,
    referenceId,
    metadata = {}
  } = params;

  // 获取当前用户积分记录
  const currentPoints = await getOrCreateUserPoints(userId, tenantId);
  const oldLevel = currentPoints.level;

  // 计算新的积分和经验
  const newPoints = currentPoints.points + points;
  const newTotalEarned = currentPoints.totalEarned + Math.max(0, points);
  const newExperience = currentPoints.experience + experience;

  // 计算新等级
  const { level: newLevel, nextLevelExp } = calculateLevel(newExperience);
  const levelUp = newLevel > oldLevel;

  // 更新用户积分记录
  await db
    .update(userPoints)
    .set({
      points: newPoints,
      totalEarned: newTotalEarned,
      experience: newExperience,
      level: newLevel,
      nextLevelExp,
      updatedAt: new Date()
    })
    .where(eq(userPoints.userId, userId));

  // 创建积分流水记录
  const transaction: NewPointTransaction = {
    userId,
    tenantId,
    type: points >= 0 ? 'earn' : 'spend',
    amount: points,
    balance: newPoints,
    source,
    description,
    referenceId,
    experienceGained: experience,
    status: 'completed',
    metadata
  };

  await db.insert(pointTransactions).values(transaction);

  // 如果升级了，记录升级流水
  if (levelUp) {
    await db.insert(pointTransactions).values({
      userId,
      tenantId,
      type: 'level_up',
      amount: 0,
      balance: newPoints,
      source: 'level_upgrade',
      description: `恭喜升级到 Lv.${newLevel}！`,
      experienceGained: 0,
      status: 'completed',
      metadata: {
        oldLevel,
        newLevel,
        levelName: LEVEL_CONFIG[newLevel - 1]?.name
      }
    });
  }

  // 获取更新后的积分记录
  const updatedPoints = await getOrCreateUserPoints(userId, tenantId);

  return {
    userPoints: updatedPoints,
    levelUp
  };
}

/**
 * 用户签到
 */
export async function checkIn(
  userId: number,
  tenantId: number = 1
): Promise<{
  success: boolean;
  alreadyCheckedIn: boolean;
  points: number;
  experience: number;
  streak: number;
  levelUp: boolean;
  messages: string[];
}> {
  const currentPoints = await getOrCreateUserPoints(userId, tenantId);
  const today = new Date().toISOString().split('T')[0];

  // 检查今天是否已经签到
  if (currentPoints.lastCheckInDate === today) {
    return {
      success: false,
      alreadyCheckedIn: true,
      points: 0,
      experience: 0,
      streak: currentPoints.checkInStreak || 0,
      levelUp: false,
      messages: ['今天已经签到过了！']
    };
  }

  // 检查是否连续签到（昨天是否签到）
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const isConsecutive = currentPoints.lastCheckInDate === yesterdayStr;
  const currentStreak = isConsecutive
    ? (currentPoints.checkInStreak || 0) + 1
    : 1;

  let totalPoints = 10; // 基础签到积分
  let totalExperience = 10; // 基础签到经验
  const messages: string[] = ['签到成功！获得 10 积分'];

  // 连续签到额外奖励
  if (currentStreak >= 30) {
    const bonusPoints = 50;
    const bonusExp = 50;
    totalPoints += bonusPoints;
    totalExperience += bonusExp;
    messages.push(
      `连续签到 ${currentStreak} 天，额外获得 ${bonusPoints} 积分！`
    );
  } else if (currentStreak >= 7) {
    const bonusPoints = 15;
    const bonusExp = 15;
    totalPoints += bonusPoints;
    totalExperience += bonusExp;
    messages.push(
      `连续签到 ${currentStreak} 天，额外获得 ${bonusPoints} 积分！`
    );
  } else if (currentStreak >= 3) {
    const bonusPoints = 5;
    const bonusExp = 5;
    totalPoints += bonusPoints;
    totalExperience += bonusExp;
    messages.push(
      `连续签到 ${currentStreak} 天，额外获得 ${bonusPoints} 积分！`
    );
  }

  if (currentStreak > 1) {
    messages.push(`当前已连续签到 ${currentStreak} 天`);
  }

  // 更新积分
  const result = await addPoints({
    userId,
    tenantId,
    points: totalPoints,
    experience: totalExperience,
    source: 'check_in',
    description: '每日签到',
    metadata: {
      streak: currentStreak,
      checkInDate: today
    }
  });

  // 更新签到信息
  await db
    .update(userPoints)
    .set({
      checkInStreak: currentStreak,
      lastCheckInDate: today,
      totalCheckInDays: (currentPoints.totalCheckInDays || 0) + 1
    })
    .where(eq(userPoints.userId, userId));

  if (result.levelUp) {
    messages.push(`恭喜升级到 Lv.${result.userPoints.level}！`);
  }

  return {
    success: true,
    alreadyCheckedIn: false,
    points: totalPoints,
    experience: totalExperience,
    streak: currentStreak,
    levelUp: result.levelUp,
    messages
  };
}

/**
 * 获取用户积分流水
 */
export async function getPointTransactions(
  userId: number,
  tenantId: number = 1,
  page: number = 1,
  pageSize: number = 20
): Promise<{ transactions: any[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const transactions = await db
    .select()
    .from(pointTransactions)
    .where(
      and(
        eq(pointTransactions.userId, userId),
        eq(pointTransactions.tenantId, tenantId)
      )
    )
    .orderBy(desc(pointTransactions.createdAt))
    .limit(pageSize)
    .offset(offset);

  // 获取总数
  const totalResult = await db
    .select({ count: pointTransactions.id })
    .from(pointTransactions)
    .where(
      and(
        eq(pointTransactions.userId, userId),
        eq(pointTransactions.tenantId, tenantId)
      )
    );

  return {
    transactions,
    total: totalResult.length
  };
}

/**
 * 获取积分奖励配置
 */
export async function getPointRewards(
  tenantId: number = 1,
  isActive: boolean = true
): Promise<any[]> {
  return db
    .select()
    .from(pointRewards)
    .where(
      and(
        eq(pointRewards.tenantId, tenantId),
        isActive ? eq(pointRewards.isActive, true) : undefined,
        eq(pointRewards.isDeleted, false)
      )
    )
    .orderBy(pointRewards.sortOrder);
}

/**
 * 处理积分过期（定时任务）
 * 每天凌晨执行，过期超过1年的积分
 */
export async function processExpiration(tenantId: number = 1): Promise<number> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // 查找需要过期的积分流水
  const transactionsToExpire = await db
    .select()
    .from(pointTransactions)
    .where(
      and(
        eq(pointTransactions.tenantId, tenantId),
        lt(pointTransactions.createdAt, oneYearAgo),
        eq(pointTransactions.type, 'earn')
      )
    );

  let expiredCount = 0;

  for (const transaction of transactionsToExpire) {
    const userPointsRecord = await getOrCreateUserPoints(
      transaction.userId,
      tenantId
    );

    if (userPointsRecord.points >= transaction.amount) {
      // 扣除过期积分
      await addPoints({
        userId: transaction.userId,
        tenantId,
        points: -transaction.amount,
        experience: 0,
        source: 'expire',
        description: '积分过期',
        referenceId: String(transaction.id),
        metadata: {
          expireDate: oneYearAgo,
          originalTransaction: transaction
        }
      });

      expiredCount++;
    }
  }

  return expiredCount;
}

/**
 * 获取用户积分统计数据
 */
export async function getUserPointsStats(
  userId: number,
  tenantId: number = 1
): Promise<{
  points: number;
  level: number;
  levelName: string;
  experience: number;
  nextLevelExp: number;
  checkInStreak: number;
  totalCheckInDays: number;
  lastCheckInDate: string | null;
  todayCheckedIn: boolean;
}> {
  const userPointsRecord = await getOrCreateUserPoints(userId, tenantId);
  const { levelName } = calculateLevel(userPointsRecord.experience);
  const today = new Date().toISOString().split('T')[0];

  return {
    points: userPointsRecord.points,
    level: userPointsRecord.level,
    levelName,
    experience: userPointsRecord.experience,
    nextLevelExp: userPointsRecord.nextLevelExp,
    checkInStreak: userPointsRecord.checkInStreak || 0,
    totalCheckInDays: userPointsRecord.totalCheckInDays || 0,
    lastCheckInDate: userPointsRecord.lastCheckInDate,
    todayCheckedIn: userPointsRecord.lastCheckInDate === today
  };
}
