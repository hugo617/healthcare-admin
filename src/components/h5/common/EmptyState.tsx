'use client';

import React from 'react';
import {
  FileX,
  SearchX,
  WifiOff,
  RefreshCw,
  Plus,
  ArrowRight
} from 'lucide-react';
import { borderRadius, duration } from './theme';

type EmptyStateType = 'no-data' | 'no-results' | 'error' | 'network' | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  illustration?: React.ReactNode;
  className?: string;
}

const defaultConfig = {
  'no-data': {
    icon: FileX,
    defaultTitle: '暂无数据',
    defaultDescription: '这里还没有任何内容'
  },
  'no-results': {
    icon: SearchX,
    defaultTitle: '未找到结果',
    defaultDescription: '尝试调整搜索条件或筛选器'
  },
  error: {
    icon: RefreshCw,
    defaultTitle: '出错了',
    defaultDescription: '加载失败，请稍后重试'
  },
  network: {
    icon: WifiOff,
    defaultTitle: '网络连接失败',
    defaultDescription: '检查网络连接后重试'
  },
  custom: {
    icon: null,
    defaultTitle: '',
    defaultDescription: ''
  }
};

export function EmptyState({
  type = 'no-data',
  title,
  description,
  action,
  illustration,
  className = ''
}: EmptyStateProps) {
  const config = defaultConfig[type];
  const Icon = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      {/* 插图或图标 */}
      {illustration ? (
        <div className='mb-6 text-neutral-400'>{illustration}</div>
      ) : Icon ? (
        <div className='mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100'>
          <Icon className='h-12 w-12 text-neutral-400' strokeWidth={1.5} />
        </div>
      ) : null}

      {/* 标题 */}
      {displayTitle && (
        <h3 className='mb-2 text-lg font-semibold text-neutral-800'>
          {displayTitle}
        </h3>
      )}

      {/* 描述 */}
      {displayDescription && (
        <p className='mb-6 max-w-sm text-sm text-neutral-500'>
          {displayDescription}
        </p>
      )}

      {/* 操作按钮 */}
      {action && (
        <button
          onClick={action.onClick}
          className='bg-primary-500 shadow-elevation-sm active:shadow-elevation-xs inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-all active:scale-95'
        >
          {action.icon || <Plus className='h-4 w-4' />}
          {action.label}
          <ArrowRight className='h-4 w-4' />
        </button>
      )}
    </div>
  );
}

// 预设的空状态组件
export function NoData({
  action,
  className
}: {
  action?: EmptyStateProps['action'];
  className?: string;
}) {
  return <EmptyState type='no-data' action={action} className={className} />;
}

export function NoResults({
  action,
  className
}: {
  action?: EmptyStateProps['action'];
  className?: string;
}) {
  return <EmptyState type='no-results' action={action} className={className} />;
}

export function ErrorState({
  onRetry,
  className
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type='error'
      action={
        onRetry
          ? {
              label: '重试',
              onClick: onRetry,
              icon: <RefreshCw className='h-4 w-4' />
            }
          : undefined
      }
      className={className}
    />
  );
}

export function NetworkError({
  onRetry,
  className
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type='network'
      action={onRetry ? { label: '重试', onClick: onRetry } : undefined}
      className={className}
    />
  );
}
