'use client';

import { NeumorphicCard } from '@/components/common/NeumorphicCard';

interface UserProfileCardProps {
  user: {
    email?: string;
    id?: number | string;
  };
  onCheckIn: () => void;
  hasCheckedIn: boolean;
}

export function UserProfileCard({ user, onCheckIn, hasCheckedIn }: UserProfileCardProps) {
  // 模拟数据
  const healthPoints = 2580;
  const checkInStreak = 15;
  const membershipLevel = '黄金';

  return (
    <div className="relative bg-white rounded-3xl shadow-neumorphic overflow-hidden mx-4 mb-4">
      {/* 顶部装饰条 */}
      <div className="h-24 bg-gradient-to-r from-primary to-accent relative">
        {/* 签到按钮 */}
        <button
          onClick={onCheckIn}
          className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-all duration-300 cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>签到</span>
        </button>
        {/* 徽章 */}
        <div className="absolute -bottom-6 left-6 w-14 h-14 rounded-2xl bg-white shadow-neumorphic flex items-center justify-center border-4 border-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-heading text-lg">1</span>
          </div>
        </div>
        {/* 装饰性光晕 */}
        <div className="absolute top-4 left-1/2 w-20 h-20 bg-white/10 rounded-full blur-xl -translate-x-1/2"></div>
      </div>

      {/* 用户信息 */}
      <div className="pt-10 px-6 pb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-slate-800 font-semibold text-lg mb-1">{user.email || '用户'}</p>
            <p className="text-slate-500 text-sm">ID: {user.id || 'Unknown'}</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-neumorphic-light shadow-neumorphic-inset text-xs text-slate-600 hover:text-primary transition-colors cursor-pointer">
            编辑资料
          </button>
        </div>

        {/* 三列数据指标 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-2xl bg-neumorphic-light shadow-neumorphic-inset">
            <p className="text-2xl font-heading text-primary">{healthPoints.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">健康积分</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-neumorphic-light shadow-neumorphic-inset">
            <p className="text-2xl font-heading text-accent">{checkInStreak}<span className="text-sm">天</span></p>
            <p className="text-xs text-slate-500 mt-1">连续签到</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-neumorphic-light shadow-neumorphic-inset">
            <p className="text-lg font-heading text-sage">{membershipLevel}</p>
            <p className="text-xs text-slate-500 mt-1">会员等级</p>
          </div>
        </div>
      </div>
    </div>
  );
}
