'use client';

import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  gradient: string;
  path?: string;
  icon: React.ReactNode;
}

export function QuickActionsGrid() {
  const router = useRouter();

  const handleActionClick = (action: QuickAction) => {
    if (action.path) {
      router.push(action.path);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'checkin',
      label: '今日签到',
      gradient: 'from-sage to-emerald-400',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
    {
      id: 'profile',
      label: '个人资料',
      gradient: 'from-primary to-secondary',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      ),
    },
    {
      id: 'blood-pressure',
      label: '血压测量',
      gradient: 'from-rose-400 to-pink-400',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
    },
    {
      id: 'health-archive',
      label: '健康档案',
      path: '/service-archive',
      gradient: 'from-accent to-purple-400',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
    },
    {
      id: 'service-record',
      label: '服务记录',
      path: '/service-record',
      gradient: 'from-teal-400 to-cyan-500',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ),
    },
    {
      id: 'customer-service',
      label: '在线客服',
      gradient: 'from-amber-400 to-orange-400',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-neumorphic p-5 mx-4 mb-4">
      <h3 className="font-heading text-base text-slate-800 mb-4">快捷功能</h3>
      <div className="grid grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-neumorphic-soft flex items-center justify-center group-hover:shadow-neumorphic-hover group-hover:scale-110 transition-all duration-300`}>
              {action.icon}
            </div>
            <span className="text-xs text-slate-600 text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
