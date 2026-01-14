'use client';

import React, { useState } from 'react';
import { Search, X, ChevronDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { TenantFilters as FiltersType } from '../types';
import { TENANT_STATUS, SORT_OPTIONS } from '../constants';

interface TenantFiltersProps {
  /** 当前过滤器状态 */
  filters: FiltersType;
  /** 搜索回调 */
  onSearch: (filters: Partial<FiltersType>) => void;
  /** 重置过滤器回调 */
  onReset: () => void;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 租户过滤器组件 - 现代简约风格
 * 提供搜索、状态筛选、排序等功能
 */
export function TenantFilters({
  filters,
  onSearch,
  onReset,
  loading
}: TenantFiltersProps) {
  const [localKeyword, setLocalKeyword] = useState(filters.keyword || '');

  // 处理搜索
  const handleSearch = (keyword: string) => {
    setLocalKeyword(keyword);
    onSearch({ keyword: keyword.trim() });
  };

  // 处理状态筛选
  const handleStatusChange = (status: string) => {
    onSearch({ status: status === 'all' ? undefined : (status as any) });
  };

  // 处理排序
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc'];
    onSearch({ sortBy, sortOrder });
  };

  // 清空搜索
  const handleClearSearch = () => {
    setLocalKeyword('');
    onSearch({ keyword: undefined });
  };

  // 构建排序值
  const getSortValue = () => {
    return `${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`;
  };

  // 是否有活动筛选
  const hasActiveFilters = !!filters.keyword || !!filters.status;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-gray-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/80'
      )}
    >
      {/* 主筛选行：搜索 + 筛选器 + 操作 */}
      <div className='flex flex-wrap items-center gap-3'>
        {/* 筛选器图标和标签 */}
        <div className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
          <Filter className='h-4 w-4' />
          <span className='text-sm font-medium'>筛选</span>
        </div>

        {/* 搜索框 */}
        <div className='relative max-w-sm min-w-[200px] flex-1'>
          <Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500' />
          <Input
            placeholder='搜索租户名称或代码...'
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(localKeyword);
              }
            }}
            className={cn(
              'h-9 pr-8 pl-9',
              'bg-white/80 dark:bg-gray-800/80',
              'border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus-visible:border-blue-500 focus-visible:ring-blue-500',
              'transition-all duration-200'
            )}
            disabled={loading}
          />
          {localKeyword && (
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                'absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'transition-colors duration-150'
              )}
              onClick={handleClearSearch}
              disabled={loading}
            >
              <X className='h-3.5 w-3.5 text-gray-400' />
            </Button>
          )}
        </div>

        {/* 状态筛选 */}
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
          disabled={loading}
        >
          <SelectTrigger
            className={cn(
              'h-9 w-[140px]',
              'bg-white/80 dark:bg-gray-800/80',
              'border-gray-200 dark:border-gray-700',
              'transition-all duration-200'
            )}
          >
            <SelectValue placeholder='全部状态' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部状态</SelectItem>
            <SelectItem value={TENANT_STATUS.ACTIVE}>正常</SelectItem>
            <SelectItem value={TENANT_STATUS.INACTIVE}>停用</SelectItem>
            <SelectItem value={TENANT_STATUS.SUSPENDED}>暂停</SelectItem>
          </SelectContent>
        </Select>

        {/* 排序选择 */}
        <Select
          value={getSortValue()}
          onValueChange={handleSortChange}
          disabled={loading}
        >
          <SelectTrigger
            className={cn(
              'h-9 w-[160px]',
              'bg-white/80 dark:bg-gray-800/80',
              'border-gray-200 dark:border-gray-700',
              'transition-all duration-200'
            )}
          >
            <SelectValue placeholder='排序方式' />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem
                key={`${option.value}-desc`}
                value={`${option.value}-desc`}
              >
                {option.label} ↓
              </SelectItem>
            ))}
            {SORT_OPTIONS.map((option) => (
              <SelectItem
                key={`${option.value}-asc`}
                value={`${option.value}-asc`}
              >
                {option.label} ↑
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 重置按钮 */}
        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onReset}
            disabled={loading}
            className={cn(
              'h-9 gap-1.5',
              'text-gray-600 hover:text-gray-900',
              'dark:text-gray-400 dark:hover:text-gray-200',
              'transition-colors duration-200'
            )}
          >
            <X className='h-4 w-4' />
            重置
          </Button>
        )}
      </div>

      {/* 活跃筛选器标签 */}
      {hasActiveFilters && (
        <div className='flex flex-wrap items-center gap-2 text-sm'>
          <span className='text-gray-500 dark:text-gray-400'>当前筛选:</span>
          {filters.keyword && (
            <Badge
              variant='secondary'
              className={cn(
                'gap-1.5 px-2.5 py-1',
                'border-blue-200 bg-blue-50 text-blue-800',
                'dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
                'font-medium',
                'transition-all duration-200'
              )}
            >
              搜索: {filters.keyword}
              <button
                onClick={() => onSearch({ keyword: undefined })}
                className={cn(
                  'ml-1 rounded-sm hover:bg-blue-200/50',
                  'dark:hover:bg-blue-800/50',
                  'transition-colors duration-150'
                )}
                disabled={loading}
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge
              variant='secondary'
              className={cn(
                'gap-1.5 px-2.5 py-1',
                'border-green-200 bg-green-50 text-green-800',
                'dark:border-green-800 dark:bg-green-900/40 dark:text-green-400',
                'font-medium',
                'transition-all duration-200'
              )}
            >
              状态:{' '}
              {filters.status === TENANT_STATUS.ACTIVE
                ? '正常'
                : filters.status === TENANT_STATUS.INACTIVE
                  ? '停用'
                  : '暂停'}
              <button
                onClick={() => onSearch({ status: undefined })}
                className={cn(
                  'ml-1 rounded-sm hover:bg-green-200/50',
                  'dark:hover:bg-green-800/50',
                  'transition-colors duration-150'
                )}
                disabled={loading}
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
