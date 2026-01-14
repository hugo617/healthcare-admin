'use client';

import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';

interface UserProfileCardProps {
  user: {
    email?: string;
    id?: number | string;
  };
  onCheckIn: () => void;
  hasCheckedIn: boolean;
}

export function UserProfileCard({
  user,
  onCheckIn,
  hasCheckedIn
}: UserProfileCardProps) {
  // 模拟数据
  const healthPoints = 2580;
  const healthPointsGoal = 5000;
  const healthPointsPercent = Math.round(
    (healthPoints / healthPointsGoal) * 100
  );
  const checkInStreak = 15;
  const membershipLevel = '黄金';

  // 签到成功动画
  const handleCheckIn = () => {
    if (!hasCheckedIn) {
      onCheckIn();
    }
  };

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
          disabled={hasCheckedIn}
          className={`absolute top-4 right-4 flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 ${
            hasCheckedIn
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
          <span>{hasCheckedIn ? '已签到' : '签到'}</span>
        </button>

        {/* 会员徽章 */}
        <div className='absolute -bottom-6 left-6 flex items-center gap-3'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-lg'>
            <div className='from-primary to-sage flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br'>
              <span className='font-heading text-lg text-white'>1</span>
            </div>
          </div>
          <div className='rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm'>
            <span className='text-primary text-sm font-semibold'>
              {membershipLevel}会员
            </span>
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
          <button className='bg-health-bg text-primary hover:bg-sage-light cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-95'>
            编辑资料
          </button>
        </div>

        {/* 健康积分进度环 */}
        <div className='from-health-bg border-sage-light/30 mb-5 rounded-2xl border bg-gradient-to-br to-white p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='mb-1 text-sm text-slate-600'>健康积分</p>
              <p className='font-heading text-primary text-3xl font-bold'>
                {healthPoints.toLocaleString()}
              </p>
              <p className='mt-1 text-xs text-slate-400'>
                目标: {healthPointsGoal.toLocaleString()}
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
              {checkInStreak}
              <span className='ml-0.5 text-sm'>天</span>
            </p>
            <p className='mt-1 text-xs text-slate-500'>连续签到</p>
          </div>
          <div className='border-sage-light/50 rounded-2xl border bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-center'>
            <p className='font-heading text-sage text-xl font-bold'>Lv.3</p>
            <p className='mt-1 text-xs text-slate-500'>健康等级</p>
          </div>
        </div>
      </div>
    </div>
  );
}
