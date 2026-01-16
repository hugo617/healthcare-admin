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
      id: 'ai-analysis',
      label: 'AI智能分析',
      path: '/h5/ai-analysis',
      gradient: 'from-indigo-400 to-violet-500',
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
            d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
          />
        </svg>
      )
    }
  ];

  return (
    <div className='shadow-neumorphic-soft mx-4 mb-4 rounded-3xl bg-white p-5'>
      <h3 className='font-heading mb-4 text-base text-slate-800'>快捷功能</h3>
      <div className='grid grid-cols-2 gap-4'>
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
