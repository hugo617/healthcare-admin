import { useState, useCallback, useMemo } from 'react';
import type { TenantFilters, UseTenantFiltersReturn } from '../types';
import { DEFAULT_PAGINATION, SEARCH_DEBOUNCE_DELAY } from '../constants';

/**
 * 租户过滤器 Hook
 */
export function useTenantFilters(): UseTenantFiltersReturn {
  // 过滤器状态
  const [filters, setFilters] = useState<TenantFilters>(DEFAULT_PAGINATION);

  // 搜索防抖定时器
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout>();

  /**
   * 搜索过滤器
   */
  const searchFilters = useCallback((newFilters: Partial<TenantFilters>) => {
    // 清除之前的防抖定时器
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // 如果有关键词搜索，使用防抖
    if (newFilters.keyword !== undefined) {
      const timer = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          ...newFilters,
          page: 1 // 搜索时重置到第一页
        }));
      }, SEARCH_DEBOUNCE_DELAY);
      setSearchTimer(timer);
    } else {
      // 非搜索过滤器立即生效
      setFilters(prev => ({
        ...prev,
        ...newFilters,
        page: 1
      }));
    }
  }, [searchTimer]);

  /**
   * 更新分页
   */
  const updatePagination = useCallback((pagination: Partial<TenantFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...pagination
    }));
  }, []);

  /**
   * 清除过滤器
   */
  const clearFilters = useCallback(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    setFilters(DEFAULT_PAGINATION);
  }, [searchTimer]);

  /**
   * 检查是否有活跃的过滤器
   */
  const hasActiveFilters = useMemo(() => {
    return (
      !!filters.keyword ||
      !!filters.status ||
      filters.page !== DEFAULT_PAGINATION.page ||
      filters.pageSize !== DEFAULT_PAGINATION.pageSize ||
      !!filters.sortBy ||
      !!filters.sortOrder
    );
  }, [filters]);

  return {
    filters,
    searchFilters,
    updatePagination,
    clearFilters,
    hasActiveFilters
  };
}