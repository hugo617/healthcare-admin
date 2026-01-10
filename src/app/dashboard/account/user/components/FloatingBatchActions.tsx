'use client';

import React from 'react';
import { Check, X, UserCheck, UserX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingBatchActionsProps {
  /** 选中的用户数量 */
  selectedCount: number;
  /** 批量激活回调 */
  onBatchActivate?: () => void;
  /** 批量禁用回调 */
  onBatchDeactivate?: () => void;
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
 * 浮动批量操作栏组件（含暗色模式适配）
 * 当有用户被选中时，显示在页面底部的浮动操作栏
 */
export function FloatingBatchActions({
  selectedCount,
  onBatchActivate,
  onBatchDeactivate,
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
        'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
        'rounded-2xl bg-white/90 backdrop-blur-xl dark:bg-gray-800/90',
        'border border-gray-200 shadow-2xl dark:border-gray-700',
        'px-6 py-3',
        'bento-floating-bar',
        'flex items-center gap-4',
        className
      )}
    >
      {/* 选中数量提示 */}
      <div className='flex items-center gap-2 border-r border-gray-200 pr-4 dark:border-gray-700'>
        <div className='rounded-full bg-blue-100 p-1.5 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'>
          <Check className='h-4 w-4' />
        </div>
        <div className='flex items-baseline gap-1'>
          <span className='text-2xl leading-none font-bold text-gray-900 dark:text-gray-100'>
            {selectedCount}
          </span>
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            {selectedCount === 1 ? '个用户' : '个用户'}
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
            className='h-9 cursor-pointer gap-2 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:border-green-800 dark:hover:bg-green-950/30 dark:hover:text-green-400'
          >
            <UserCheck className='h-4 w-4' />
            批量激活
          </Button>
        )}

        {onBatchDeactivate && (
          <Button
            variant='outline'
            size='sm'
            onClick={onBatchDeactivate}
            className='h-9 cursor-pointer gap-2 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:hover:border-orange-800 dark:hover:bg-orange-950/30 dark:hover:text-orange-400'
          >
            <UserX className='h-4 w-4' />
            批量禁用
          </Button>
        )}

        {onBatchDelete && (
          <Button
            variant='destructive'
            size='sm'
            onClick={onBatchDelete}
            className='h-9 cursor-pointer gap-2'
          >
            <Trash2 className='h-4 w-4' />
            批量删除
          </Button>
        )}
      </div>

      {/* 取消选择按钮 */}
      <div className='border-l border-gray-200 pl-2 dark:border-gray-700'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClearSelection}
          className='h-9 w-9 cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
