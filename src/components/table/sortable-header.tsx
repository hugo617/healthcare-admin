'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOrder = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  title: string;
  sortKey: string;
  currentSort: { sortBy: string; sortOrder: 'asc' | 'desc' } | null;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

/**
 * 可排序列头组件
 * 点击切换排序状态：无排序 → 升序 → 降序 → 无排序
 */
export function SortableHeader({
  title,
  sortKey,
  currentSort,
  onSort,
  className
}: SortableHeaderProps) {
  // 计算当前列的排序状态
  const isCurrentColumn = currentSort?.sortBy === sortKey;
  const sortOrder = isCurrentColumn ? currentSort?.sortOrder : null;

  /**
   * 处理点击事件，切换排序状态
   */
  const handleClick = () => {
    let newSortOrder: 'asc' | 'desc';

    if (!isCurrentColumn) {
      // 当前列无排序，设置为升序
      newSortOrder = 'asc';
    } else if (sortOrder === 'asc') {
      // 当前是升序，切换为降序
      newSortOrder = 'desc';
    } else {
      // 当前是降序，取消排序（传递 sortBy 但设置为默认降序）
      newSortOrder = 'desc';
    }

    onSort(sortKey, newSortOrder);
  };

  return (
    <div
      className={cn(
        'hover:text-foreground group flex cursor-pointer items-center gap-1 transition-colors select-none',
        className
      )}
      onClick={handleClick}
      role='button'
      tabIndex={0}
      aria-label={`Sort by ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span className='font-semibold'>{title}</span>
      <span className='flex flex-col items-center justify-center'>
        {/* 升序图标 */}
        <ChevronUp
          className={cn(
            'h-3 w-3 transition-colors',
            isCurrentColumn && sortOrder === 'asc'
              ? 'text-foreground'
              : 'text-muted-foreground group-hover:text-muted-foreground/70'
          )}
        />
        {/* 降序图标 */}
        <ChevronDown
          className={cn(
            '-mt-1.5 h-3 w-3 transition-colors',
            isCurrentColumn && sortOrder === 'desc'
              ? 'text-foreground'
              : 'text-muted-foreground group-hover:text-muted-foreground/70'
          )}
        />
      </span>
    </div>
  );
}
