'use client';

interface HeaderBarProps {
  onMenuClick: () => void;
}

export function HeaderBar({ onMenuClick }: HeaderBarProps) {
  return (
    <header className="flex items-center justify-between py-6 px-4 fixed top-0 left-0 right-0 z-20 bg-cream/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl bg-neumorphic-light shadow-neumorphic flex items-center justify-center hover:shadow-neumorphic-hover transition-all duration-300 cursor-pointer"
          aria-label="菜单"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div>
          <h1 className="font-heading text-xl text-slate-800 leading-tight">
            石墨烯<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">健康生活馆</span>
          </h1>
          <p className="text-slate-500 text-xs">享受健康美好生活</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 rounded-xl bg-neumorphic-light shadow-neumorphic flex items-center justify-center hover:shadow-neumorphic-hover transition-all duration-300 cursor-pointer relative" aria-label="消息">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full text-white text-xs flex items-center justify-center">3</span>
        </button>
      </div>
    </header>
  );
}
