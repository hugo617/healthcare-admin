'use client';

interface HeaderBarProps {
  onMenuClick: () => void;
}

export function HeaderBar({ onMenuClick }: HeaderBarProps) {
  return (
    <header className='bg-cream/95 fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-4 py-6 backdrop-blur-sm'>
      <div className='flex items-center gap-3'>
        <button
          onClick={onMenuClick}
          className='bg-neumorphic-light shadow-neumorphic hover:shadow-neumorphic-hover flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-300'
          aria-label='菜单'
        >
          <svg
            className='h-5 w-5 text-slate-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
        <div>
          <h1 className='font-heading text-xl leading-tight text-slate-800'>
            石墨烯
            <span className='from-primary to-accent bg-gradient-to-r bg-clip-text text-transparent'>
              健康生活馆
            </span>
          </h1>
          <p className='text-xs text-slate-500'>享受健康美好生活</p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <button
          className='bg-neumorphic-light shadow-neumorphic hover:shadow-neumorphic-hover relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-300'
          aria-label='消息'
        >
          <svg
            className='h-5 w-5 text-slate-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            />
          </svg>
          <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-xs text-white'>
            3
          </span>
        </button>
      </div>
    </header>
  );
}
