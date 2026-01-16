'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  iconActive: React.ReactNode;
  iconInactive: React.ReactNode;
  badge?: number | boolean;
}

interface BottomNavigationProps {
  items?: NavItem[];
  badgeConfig?: Record<string, number | boolean>;
}

// 默认导航项
const DEFAULT_NAV_ITEMS: NavItem[] = [
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
    label: '健康',
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
    label: '服务',
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

export function BottomNavigation({
  items: customItems,
  badgeConfig
}: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const indicatorRef = useRef<HTMLDivElement>(null);

  // 合并徽章配置
  const items =
    customItems ||
    DEFAULT_NAV_ITEMS.map((item) => ({
      ...item,
      badge: badgeConfig?.[item.id]
    }));

  // 计算活动指示器位置
  const activeIndex = items.findIndex((item) => pathname === item.path);

  // 触觉反馈
  const handleNavClick = (path: string) => {
    // 触觉反馈（支持的设备）
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    router.push(path);
  };

  return (
    <nav className='shadow-elevation-lg fixed right-0 bottom-0 left-0 z-20 rounded-t-3xl border-t border-neutral-100/50 bg-white/90 backdrop-blur-md'>
      <div className='pb-safe flex items-center justify-around px-2 py-2'>
        {items.map((item, index) => {
          const isActive = pathname === item.path;
          const badgeCount =
            typeof item.badge === 'number' ? item.badge : item.badge ? 1 : 0;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className='group duration-base relative flex flex-1 cursor-pointer flex-col items-center gap-1 px-4 py-2 transition-all active:scale-95'
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* 活动指示器 */}
              {isActive && (
                <div className='bg-primary-500 animate-scale-in absolute -top-0.5 h-1 w-8 rounded-full' />
              )}

              {/* 图标容器 */}
              <div className='relative'>
                <div
                  className={`duration-base flex h-6 w-6 items-center justify-center transition-all ${
                    isActive
                      ? 'text-primary-500 scale-110'
                      : 'group-hover:text-primary-500 text-neutral-400'
                  }`}
                >
                  {isActive ? item.iconActive : item.iconInactive}
                </div>

                {/* 徽章 */}
                {badgeCount > 0 && (
                  <span
                    className={`animate-scale-in absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      badgeCount > 9 ? 'w-auto px-1' : ''
                    } ${isActive ? 'bg-error' : 'bg-error'}`}
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>

              {/* 标签 */}
              <span
                className={`duration-base text-xs transition-all ${
                  isActive
                    ? 'text-primary-500 font-semibold'
                    : 'group-hover:text-primary-500 text-neutral-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 安全区域适配 */}
      <div
        className='h-safe-bottom'
        style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
      />
    </nav>
  );
}
