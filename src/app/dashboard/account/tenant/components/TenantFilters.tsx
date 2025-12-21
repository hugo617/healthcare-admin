import React, { useState } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { TenantFilters } from '../types';
import { TENANT_STATUS, SORT_OPTIONS } from '../constants';

interface TenantFiltersProps {
  /** 当前过滤器状态 */
  filters: TenantFilters;
  /** 搜索回调 */
  onSearch: (filters: Partial<TenantFilters>) => void;
  /** 重置过滤器回调 */
  onReset: () => void;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 租户过滤器组件
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
    // 如果选择"全部状态"，则清除status筛选
    onSearch({ status: status === 'all' ? undefined : status as any });
  };

  // 处理排序
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    onSearch({ sortBy, sortOrder });
  };

  // 清空搜索
  const handleClearSearch = () => {
    setLocalKeyword('');
    onSearch({ keyword: undefined });
  };

  // 获取当前排序显示文本
  const getCurrentSortText = () => {
    const sortOption = SORT_OPTIONS.find(option => option.value === filters.sortBy);
    if (!sortOption) return '排序方式';
    return `${sortOption.label} (${filters.sortOrder === 'asc' ? '升序' : '降序'})`;
  };

  // 获取当前状态显示文本
  const getCurrentStatusText = () => {
    if (!filters.status) return '全部状态';
    switch (filters.status) {
      case TENANT_STATUS.ACTIVE:
        return '正常';
      case TENANT_STATUS.INACTIVE:
        return '停用';
      case TENANT_STATUS.SUSPENDED:
        return '暂停';
      default:
        return '全部状态';
    }
  };

  return (
    <div className='flex flex-col space-y-4 rounded-lg border bg-white p-4 shadow-sm'>
      {/* 第一行：搜索框 */}
      <div className='flex flex-1 items-center space-x-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='搜索租户名称或代码...'
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(localKeyword);
              }
            }}
            className='pl-10'
            disabled={loading}
          />
          {localKeyword && (
            <Button
              variant='ghost'
              size='sm'
              className='absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0'
              onClick={handleClearSearch}
              disabled={loading}
            >
              <RotateCcw className='h-3 w-3' />
            </Button>
          )}
        </div>

        <Button
          onClick={() => handleSearch(localKeyword)}
          disabled={loading}
          className='shrink-0'
        >
          <Search className='mr-2 h-4 w-4' />
          搜索
        </Button>
      </div>

      {/* 第二行：筛选器和排序 */}
      <div className='flex items-center justify-between space-x-4'>
        <div className='flex items-center space-x-3'>
          {/* 状态筛选 */}
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
            disabled={loading}
          >
            <SelectTrigger className='w-32'>
              <SelectValue placeholder={getCurrentStatusText()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              <SelectItem value={TENANT_STATUS.ACTIVE}>正常</SelectItem>
              <SelectItem value={TENANT_STATUS.INACTIVE}>停用</SelectItem>
              <SelectItem value={TENANT_STATUS.SUSPENDED}>暂停</SelectItem>
            </SelectContent>
          </Select>

          {/* 排序下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={loading}>
              <Button variant='outline' className='w-40 justify-start'>
                <Filter className='mr-2 h-4 w-4' />
                {getCurrentSortText()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-48'>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSortChange(option.value, 'desc')}
                  className={filters.sortBy === option.value && filters.sortOrder === 'desc' ? 'bg-accent' : ''}
                >
                  {option.label} (降序)
                </DropdownMenuItem>
              ))}
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={`${option.value}-asc`}
                  onClick={() => handleSortChange(option.value, 'asc')}
                  className={filters.sortBy === option.value && filters.sortOrder === 'asc' ? 'bg-accent' : ''}
                >
                  {option.label} (升序)
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 重置按钮 */}
        <Button
          variant='outline'
          onClick={onReset}
          disabled={loading}
          className='shrink-0'
        >
          <RotateCcw className='mr-2 h-4 w-4' />
          重置
        </Button>
      </div>

      {/* 活跃筛选器标签 */}
      {(filters.status || filters.sortBy) && (
        <div className='flex flex-wrap gap-2'>
          {filters.status && (
            <div className='inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800'>
              状态: {getCurrentStatusText()}
            </div>
          )}
          {filters.sortBy && (
            <div className='inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800'>
              排序: {getCurrentSortText()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}