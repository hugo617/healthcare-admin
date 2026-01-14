'use client';

import { useEffect } from 'react';

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function MenuDropdown({ isOpen, onClose, onLogout }: MenuDropdownProps) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isOpen &&
        !target.closest('header') &&
        !target.closest('#menuDropdown')
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id='menuDropdown'
      className='shadow-neumorphic fixed top-20 right-4 left-4 z-30 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md'
    >
      <a
        href='#'
        className='hover:bg-neumorphic-light flex items-center gap-3 px-4 py-3 transition-colors'
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
            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
        <span className='text-slate-700'>设置</span>
      </a>
      <a
        href='#'
        className='hover:bg-neumorphic-light flex items-center gap-3 px-4 py-3 transition-colors'
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
            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <span className='text-slate-700'>关于</span>
      </a>
      <button
        onClick={onLogout}
        className='hover:bg-neumorphic-light flex w-full items-center gap-3 px-4 py-3 text-left transition-colors'
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
            d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
          />
        </svg>
        <span className='text-slate-700'>退出登录</span>
      </button>
    </div>
  );
}
