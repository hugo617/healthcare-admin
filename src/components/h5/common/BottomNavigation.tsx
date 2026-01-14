'use client';

import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  path: string;
  iconActive: React.ReactNode;
  iconInactive: React.ReactNode;
}

// 保持 /h5 路由前缀，与 3003 端口的 H5 应用一致
const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: '首页',
    path: '/h5',
    iconActive: (
      <svg fill='currentColor' viewBox='0 0 24 24'>
        <path d='M10 20v-6h4v6h5v-6h3L12 3 2 14h3v6z' />
      </svg>
    ),
    iconInactive: (
      <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
        />
      </svg>
    )
  },
  {
    id: 'health',
    label: '健康数据',
    path: '/h5/health',
    iconActive: (
      <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        />
      </svg>
    ),
    iconInactive: (
      <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        />
      </svg>
    )
  },
  {
    id: 'service',
    label: '服务预约',
    path: '/h5/service',
    iconActive: (
      <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
        />
      </svg>
    ),
    iconInactive: (
      <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
        />
      </svg>
    )
  },
  {
    id: 'profile',
    label: '我的',
    path: '/h5/profile',
    iconActive: (
      <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
        />
      </svg>
    ),
    iconInactive: (
      <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
        />
      </svg>
    )
  }
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className='shadow-neumorphic fixed right-0 bottom-0 left-0 z-20 rounded-t-3xl bg-white/90 backdrop-blur-md'>
      <div className='flex items-center justify-around px-2 py-3'>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className='group flex cursor-pointer flex-col items-center gap-1 px-4 py-2'
          >
            <div
              className={`flex h-6 w-6 items-center justify-center transition-colors ${
                pathname === item.path
                  ? 'text-primary'
                  : 'group-hover:text-primary text-slate-400'
              }`}
            >
              {pathname === item.path ? item.iconActive : item.iconInactive}
            </div>
            <span
              className={`text-xs transition-colors ${
                pathname === item.path
                  ? 'text-primary font-medium'
                  : 'group-hover:text-primary text-slate-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
