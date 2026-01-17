'use client';

import { useState, useEffect } from 'react';
import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';

interface UserPointsData {
  points: number;
  level: number;
  levelName: string;
  experience: number;
  nextLevelExp: number;
  checkInStreak: number;
  totalCheckInDays: number;
  lastCheckInDate: string | null;
  todayCheckedIn: boolean;
}

interface UserProfileCardProps {
  user: {
    email?: string;
    id?: number | string;
  };
  onToast?: (message: string) => void;
}

export function UserProfileCard({ user, onToast }: UserProfileCardProps) {
  const [pointsData, setPointsData] = useState<UserPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // 获取用户积分数据
  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/h5/points');
      const result = await response.json();

      if (result.success) {
        setPointsData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch points data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 签到处理
  const handleCheckIn = async () => {
    if (checkInLoading || pointsData?.todayCheckedIn) {
      return;
    }

    try {
      setCheckInLoading(true);
      const response = await fetch('/api/h5/check-in', {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success) {
        const { success, messages, points, levelUp } = result.data;

        if (success) {
          // 显示签到成功消息
          messages.forEach((msg: string) => {
            onToast?.(msg);
          });

          // 刷新积分数据
          await fetchPointsData();
        } else if (result.data.alreadyCheckedIn) {
          onToast?.('今天已经签到过了！');
        }
      } else {
        onToast?.(result.error || '签到失败');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      onToast?.('签到失败，请重试');
    } finally {
      setCheckInLoading(false);
    }
  };

  if (loading || !pointsData) {
    return (
      <div className='relative mx-4 mb-4 h-64 animate-pulse rounded-3xl bg-gray-200' />
    );
  }

  // 计算进度条
  const healthPointsGoal = pointsData.nextLevelExp;
  const healthPointsPercent = Math.min(
    Math.round((pointsData.experience / healthPointsGoal) * 100),
    100
  );

  return (
    <div className='relative mx-4 mb-4 overflow-hidden rounded-3xl bg-white shadow-lg'>
      {/* 顶部装饰条 - 健康主题渐变 */}
      <div className='from-primary via-secondary to-sage relative h-28 bg-gradient-to-r'>
        {/* 装饰性光晕 */}
        <div className='absolute top-0 left-1/4 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl'></div>
        <div className='absolute right-1/4 bottom-0 h-24 w-24 translate-x-1/2 translate-y-1/2 rounded-full bg-white/10 blur-xl'></div>

        {/* 签到按钮 */}
        <button
          onClick={handleCheckIn}
          disabled={pointsData.todayCheckedIn || checkInLoading}
          className={`absolute top-4 right-4 flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 ${
            pointsData.todayCheckedIn
              ? 'bg-sage/40 cursor-not-allowed text-white/70'
              : 'bg-white/20 hover:bg-white/30 active:scale-95'
          }`}
        >
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span>
            {checkInLoading
              ? '签到中...'
              : pointsData.todayCheckedIn
                ? '已签到'
                : '签到'}
          </span>
        </button>

        {/* 会员徽章 */}
        <div className='absolute -bottom-6 left-6 flex items-center gap-3'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-lg'>
            <div className='from-primary to-sage flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br'>
              <span className='font-heading text-lg text-white'>
                {pointsData.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 用户信息 */}
      <div className='px-5 pt-10 pb-5'>
        <div className='mb-5 flex items-start justify-between'>
          <div>
            <p className='mb-0.5 text-lg font-semibold text-slate-800'>
              {user.email || '用户'}
            </p>
            <p className='text-xs text-slate-400'>ID: {user.id || 'Unknown'}</p>
          </div>
        </div>

        {/* 健康积分进度环 */}
        <div className='from-health-bg border-sage-light/30 mb-5 rounded-2xl border bg-gradient-to-br to-white p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='mb-1 text-sm text-slate-600'>健康积分</p>
              <p className='font-heading text-primary text-3xl font-bold'>
                {pointsData.points.toLocaleString()}
              </p>
              <p className='mt-1 text-xs text-slate-400'>
                经验: {pointsData.experience} / {pointsData.nextLevelExp}
              </p>
            </div>
            <div className='relative h-16 w-16'>
              <svg className='h-full w-full -rotate-90' viewBox='0 0 36 36'>
                <circle
                  cx='18'
                  cy='18'
                  r='15.5'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='3'
                  className='text-sage-light/30'
                />
                <circle
                  cx='18'
                  cy='18'
                  r='15.5'
                  fill='none'
                  stroke='url(#gradient)'
                  strokeWidth='3'
                  strokeLinecap='round'
                  strokeDasharray={`${healthPointsPercent} 100`}
                  className='transition-all duration-1000 ease-out'
                />
                <defs>
                  <linearGradient
                    id='gradient'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='0%'
                  >
                    <stop offset='0%' stopColor='#10B981' />
                    <stop offset='100%' stopColor='#6EE7B7' />
                  </linearGradient>
                </defs>
              </svg>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-primary text-sm font-bold'>
                  {healthPointsPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 双列数据指标 */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-center'>
            <p className='font-heading text-accent text-2xl font-bold'>
              {pointsData.checkInStreak}
              <span className='ml-0.5 text-sm'>天</span>
            </p>
            <p className='mt-1 text-xs text-slate-500'>连续签到</p>
          </div>
          <div className='border-sage-light/50 rounded-2xl border bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-center'>
            <p className='font-heading text-sage text-xl font-bold'>
              Lv.{pointsData.level}
            </p>
            <p className='mt-1 text-xs text-slate-500'>
              {pointsData.levelName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
