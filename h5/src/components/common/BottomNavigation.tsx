'use client';

import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  path: string;
  iconActive: React.ReactNode;
  iconInactive: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: '首页',
    path: '/',
    iconActive: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-6h3L12 3 2 14h3v6z"/>
      </svg>
    ),
    iconInactive: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    ),
  },
  {
    id: 'health',
    label: '健康数据',
    path: '/health',
    iconActive: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    iconInactive: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
  },
  {
    id: 'service',
    label: '服务预约',
    path: '/service',
    iconActive: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
    iconInactive: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: '我的',
    path: '/profile',
    iconActive: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
    iconInactive: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md rounded-t-3xl shadow-neumorphic z-20">
      <div className="flex items-center justify-around py-3 px-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer group"
          >
            <div className={`w-6 h-6 flex items-center justify-center transition-colors ${
              pathname === item.path ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
            }`}>
              {pathname === item.path ? item.iconActive : item.iconInactive}
            </div>
            <span className={`text-xs transition-colors ${
              pathname === item.path ? 'text-primary font-medium' : 'text-slate-400 group-hover:text-primary'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
