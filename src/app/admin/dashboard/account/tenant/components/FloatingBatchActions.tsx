'use client';

import React from 'react';
import { Check, X, UserCheck, UserX, Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingBatchActionsProps {
  /** 选中的租户数量 */
  selectedCount: number;
  /** 批量启用回调 */
  onBatchActivate?: () => void;
  /** 批量停用回调 */
  onBatchDeactivate?: () => void;
  /** 批量暂停回调 */
  onBatchSuspend?: () => void;
  /** 批量删除回调 */
  onBatchDelete?: () => void;
  /** 取消选择回调 */
  onClearSelection: () => void;
  /** 是否显示 */
  visible?: boolean;
  /** 额外的类名 */
  className?: string;
}

/**
 * 浮动批量操作栏组件 - 现代简约风格
 * 当有租户被选中时，显示在页面底部的浮动操作栏
 */
export function FloatingBatchActions({
  selectedCount,
  onBatchActivate,
  onBatchDeactivate,
  onBatchSuspend,
  onBatchDelete,
  onClearSelection,
  visible = true,
  className
}: FloatingBatchActionsProps) {
  if (!visible || selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-8 left-1/2 z-50 -translate-x-1/2',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        'rounded-2xl bg-white/95 backdrop-blur-xl dark:bg-gray-900/95',
        'border border-gray-200/60 shadow-xl dark:border-gray-700/60',
        'px-5 py-3',
        'flex items-center gap-4',
        className
      )}
    >
      {/* 选中数量提示 */}
      <div className='flex items-center gap-3 border-r border-gray-200/60 pr-4 dark:border-gray-700/60'>
        <div className='flex rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-2 text-white shadow-sm'>
          <Check className='h-4 w-4' />
        </div>
        <div className='flex items-baseline gap-1.5'>
          <span className='font-heading text-2xl leading-none font-bold text-gray-900 dark:text-gray-100'>
            {selectedCount}
          </span>
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            {selectedCount === 1 ? '个租户' : '个租户'}
          </span>
        </div>
      </div>

      {/* 批量操作按钮 */}
      <div className='flex items-center gap-2'>
        {onBatchActivate && (
          <Button
            variant='outline'
            size='sm'
            onClick={onBatchActivate}
            className={cn(
              'h-9 gap-2 transition-all duration-200',
              'cursor-pointer border-gray-200 dark:border-gray-700',
              'hover:border-green-300 hover:bg-green-50 hover:text-green-700',
              'dark:hover:border-green-800 dark:hover:bg-green-950/30 dark:hover:text-green-400'
            )}
          >
            <UserCheck className='h-4 w-4' />
            批量启用
          </Button>
        )}

        {onBatchDeactivate && (
          <Button
            variant='outline'
            size='sm'
            onClick={onBatchDeactivate}
            className={cn(
              'h-9 gap-2 transition-all duration-200',
              'cursor-pointer border-gray-200 dark:border-gray-700',
              'hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700',
              'dark:hover:border-gray-800 dark:hover:bg-gray-950/30 dark:hover:text-gray-400'
            )}
          >
            <UserX className='h-4 w-4' />
            批量停用
          </Button>
        )}

        {onBatchSuspend && (
          <Button
            variant='outline'
            size='sm'
            onClick={onBatchSuspend}
            className={cn(
              'h-9 gap-2 transition-all duration-200',
              'cursor-pointer border-gray-200 dark:border-gray-700',
              'hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700',
              'dark:hover:border-orange-800 dark:hover:bg-orange-950/30 dark:hover:text-orange-400'
            )}
          >
            <Ban className='h-4 w-4' />
            批量暂停
          </Button>
        )}

        {onBatchDelete && (
          <Button
            variant='destructive'
            size='sm'
            onClick={onBatchDelete}
            className='h-9 cursor-pointer gap-2 transition-all duration-200'
          >
            <Trash2 className='h-4 w-4' />
            批量删除
          </Button>
        )}
      </div>

      {/* 取消选择按钮 */}
      <div className='border-l border-gray-200/60 pl-3 dark:border-gray-700/60'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClearSelection}
          className={cn(
            'h-9 w-9 transition-all duration-200',
            'cursor-pointer text-gray-500',
            'hover:bg-gray-100 hover:text-gray-700',
            'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
          )}
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
