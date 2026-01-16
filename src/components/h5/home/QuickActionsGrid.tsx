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
        <svg
          className='h-7 w-7 text-white'
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
      )
    },
    {
      id: 'profile',
      label: '个人资料',
      path: '/h5/profile',
      gradient: 'from-primary-500 to-secondary',
      icon: (
        <svg
          className='h-7 w-7 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
          />
        </svg>
      )
    },
    {
      id: 'blood-pressure',
      label: '血压测量',
      path: '/h5/health',
      gradient: 'from-rose-400 to-pink-400',
      icon: (
        <svg
          className='h-7 w-7 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
          />
        </svg>
      )
    },
    {
      id: 'health-archive',
      label: '健康档案',
      path: '/h5/service-archive',
      gradient: 'from-accent to-orange-400',
      icon: (
        <svg
          className='h-7 w-7 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      )
    },
    {
      id: 'service-record',
      label: '服务记录',
      path: '/h5/service-record',
      gradient: 'from-teal-400 to-cyan-500',
      icon: (
        <svg
          className='h-7 w-7 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
          />
        </svg>
      )
    },
    {
      id: 'customer-service',
      label: '在线客服',
      gradient: 'from-violet-400 to-purple-400',
      icon: (
        <svg
          className='h-7 w-7 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
          />
        </svg>
      )
    }
  ];

  return (
    <div className='shadow-neumorphic-soft mx-4 mb-4 rounded-3xl bg-white p-5'>
      <h3 className='font-heading mb-4 text-base text-slate-800'>快捷功能</h3>
      <div className='grid grid-cols-3 gap-4'>
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className='group flex cursor-pointer flex-col items-center gap-2'
          >
            <div
              className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-elevation-sm group-hover:shadow-elevation-md duration-base flex items-center justify-center transition-all group-hover:scale-110 active:scale-95`}
            >
              {action.icon}
            </div>
            <span className='text-center text-xs text-slate-600'>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
