'use client';

import React from 'react';
import { Table, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ViewMode } from '../hooks/useViewMode';

interface ViewToggleProps {
  /** 当前视图模式 */
  viewMode: ViewMode;
  /** 视图切换回调 */
  onViewChange: (mode: ViewMode) => void;
  /** 额外的类名 */
  className?: string;
}

/**
 * 视图切换器组件（含暗色模式适配）
 * 提供表格视图和卡片视图的切换功能
 */
export function ViewToggle({
  viewMode,
  onViewChange,
  className
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800',
        className
      )}
    >
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => onViewChange('table')}
        className={cn(
          'h-8 cursor-pointer gap-2',
          viewMode === 'table'
            ? 'bg-white text-gray-900 shadow-sm hover:bg-white dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
        )}
      >
        <Table className='h-4 w-4' />
        <span className='text-sm font-medium'>表格</span>
      </Button>
      <Button
        variant={viewMode === 'card' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => onViewChange('card')}
        className={cn(
          'h-8 cursor-pointer gap-2',
          viewMode === 'card'
            ? 'bg-white text-gray-900 shadow-sm hover:bg-white dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
        )}
      >
        <LayoutGrid className='h-4 w-4' />
        <span className='text-sm font-medium'>卡片</span>
      </Button>
    </div>
  );
}
