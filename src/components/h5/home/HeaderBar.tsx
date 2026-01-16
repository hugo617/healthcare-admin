'use client';

interface HeaderBarProps {
  onMenuClick: () => void;
}

export function HeaderBar({ onMenuClick }: HeaderBarProps) {
  return (
    <header className='bg-cream/95 fixed top-0 right-0 left-0 z-20 flex items-center px-4 py-6 backdrop-blur-sm'>
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
    </header>
  );
}
