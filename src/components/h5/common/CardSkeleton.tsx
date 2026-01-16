'use client';

import React from 'react';
import { borderRadius } from './theme';

interface CardSkeletonProps {
  showAvatar?: boolean;
  showTitle?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showAvatar = false,
  showTitle = true,
  lines = 3,
  className = ''
}: CardSkeletonProps) {
  return (
    <div
      className={`shadow-neumorphic-soft rounded-3xl bg-white p-4 ${className}`}
    >
      <div className='flex items-start gap-3'>
        {/* 头像骨架 */}
        {showAvatar && (
          <div className='animate-shimmer h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
        )}

        {/* 内容骨架 */}
        <div className='flex-1 space-y-2'>
          {/* 标题骨架 */}
          {showTitle && (
            <div className='animate-shimmer h-4 w-3/4 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
          )}

          {/* 文本行骨架 */}
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`animate-shimmer h-3 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
              style={{
                backgroundSize: '200% 100%',
                animationDelay: `${i * 150}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 列表骨架（多个卡片）
interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
  lines?: number;
  className?: string;
}

export function ListSkeleton({
  count = 3,
  showAvatar = false,
  showTitle = true,
  lines = 2,
  className = ''
}: ListSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton
          key={i}
          showAvatar={showAvatar}
          showTitle={showTitle}
          lines={lines}
        />
      ))}
    </div>
  );
}

// 健康数据卡片骨架
export function HealthCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shadow-neumorphic-soft rounded-3xl bg-white p-4 ${className}`}
    >
      <div className='space-y-3'>
        {/* 图标和标题 */}
        <div className='flex items-center gap-3'>
          <div className='from-primary-200 via-primary-100 to-primary-200 animate-shimmer h-10 w-10 rounded-xl bg-gradient-to-r' />
          <div className='animate-shimmer h-4 w-20 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
        </div>

        {/* 数值 */}
        <div className='from-primary-200 via-primary-100 to-primary-200 animate-shimmer h-8 w-24 rounded-lg bg-gradient-to-r' />

        {/* 趋势 */}
        <div className='flex items-center gap-2'>
          <div className='animate-shimmer h-4 w-4 rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
          <div className='animate-shimmer h-3 w-16 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
        </div>
      </div>
    </div>
  );
}

// 网格骨架（2x2 网格）
export function GridSkeleton({
  count = 4,
  className = ''
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <HealthCardSkeleton key={i} />
      ))}
    </div>
  );
}

// 服务卡片骨架
export function ServiceCardSkeleton({
  className = ''
}: {
  className?: string;
}) {
  return (
    <div
      className={`shadow-neumorphic-soft rounded-3xl bg-white p-4 ${className}`}
    >
      <div className='space-y-3'>
        {/* 服务图标 */}
        <div className='from-primary-200 via-primary-100 to-primary-200 animate-shimmer mx-auto h-14 w-14 rounded-2xl bg-gradient-to-r' />

        {/* 服务名称 */}
        <div className='animate-shimmer mx-auto h-5 w-32 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />

        {/* 服务描述 */}
        <div className='space-y-2'>
          <div className='animate-shimmer h-3 w-full rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
          <div className='animate-shimmer mx-auto h-3 w-2/3 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
        </div>

        {/* 按钮 */}
        <div className='from-primary-200 via-primary-100 to-primary-200 animate-shimmer mt-4 h-10 w-full rounded-xl bg-gradient-to-r' />
      </div>
    </div>
  );
}

// 页面级骨架
export function PageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部骨架 */}
      <div className='flex items-center gap-4'>
        <div className='animate-shimmer h-16 w-16 rounded-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
        <div className='flex-1 space-y-2'>
          <div className='animate-shimmer h-5 w-32 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
          <div className='animate-shimmer h-4 w-24 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
        </div>
      </div>

      {/* 统计卡片骨架 */}
      <GridSkeleton count={4} />

      {/* 列表骨架 */}
      <div className='pt-4'>
        <div className='animate-shimmer mb-4 h-6 w-24 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200' />
        <ListSkeleton count={3} lines={2} />
      </div>
    </div>
  );
}
