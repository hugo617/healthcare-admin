'use client';

import React from 'react';

type InlineLoadingSize = 'sm' | 'md' | 'lg';
type InlineLoadingVariant = 'spinner' | 'dots' | 'pulse';

interface InlineLoadingProps {
  size?: InlineLoadingSize;
  variant?: InlineLoadingVariant;
  className?: string;
  color?: 'primary' | 'neutral' | 'white';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

const dotSizeClasses = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2'
};

const colorClasses = {
  primary: 'text-primary-500',
  neutral: 'text-neutral-400',
  white: 'text-white'
};

/**
 * 内联加载指示器 - 用于按钮、卡片等组件内部
 */
export function InlineLoading({
  size = 'md',
  variant = 'spinner',
  className = '',
  color = 'primary'
}: InlineLoadingProps) {
  const colorClass = colorClasses[color];

  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${dotSizeClasses[size]} ${colorClass} animate-pulse rounded-full`}
            style={{
              animationDelay: `${i * 150}ms`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`${sizeClasses[size]} ${colorClass} animate-pulse-soft ${className}`}
      />
    );
  }

  // 默认 spinner
  return (
    <svg
      className={`${sizeClasses[size]} ${colorClass} animate-spin ${className}`}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      role='status'
      aria-label='加载中'
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
      />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  );
}

/**
 * 加载按钮 - 带加载状态的按钮
 */
interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingButton({
  loading = false,
  loadingText = '加载中...',
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-primary-500 text-white shadow-elevation-sm hover:shadow-elevation-md',
    secondary:
      'bg-secondary text-white shadow-elevation-sm hover:shadow-elevation-md',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
    ghost: 'text-primary-500 hover:bg-primary-50'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <InlineLoading size={size === 'lg' ? 'md' : 'sm'} color='white' />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * 全屏加载 - 覆盖整个内容区域
 */
interface FullScreenLoadingProps {
  message?: string;
  className?: string;
}

export function FullScreenLoading({
  message = '加载中...',
  className = ''
}: FullScreenLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 ${className}`}
    >
      <div className='mb-4'>
        <InlineLoading size='lg' />
      </div>
      <p className='text-sm text-neutral-500'>{message}</p>
    </div>
  );
}

/**
 * 进度条加载
 */
interface ProgressLoadingProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function ProgressLoading({
  progress,
  className = '',
  showLabel = false,
  color = 'primary'
}: ProgressLoadingProps) {
  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className='flex justify-between text-sm'>
          <span className='text-neutral-600'>加载进度</span>
          <span className='font-medium text-neutral-800'>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className='h-2 w-full overflow-hidden rounded-full bg-neutral-200'>
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
