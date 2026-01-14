/**
 * 组织筛选条件 Hook
 */

import { useState, useCallback } from 'react';
import type { OrganizationFilters } from '../types';
import { DEFAULT_FILTERS } from '../constants';

export function useOrganizationFilters() {
  const [filters, setFilters] = useState<OrganizationFilters>(DEFAULT_FILTERS);

  /**
   * 搜索/更新筛选条件
   */
  const searchFilters = useCallback(
    (newFilters: Partial<OrganizationFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
        // 如果搜索条件变化，重置到第一页
        page: newFilters.page !== undefined ? newFilters.page : 1
      }));
    },
    []
  );

  /**
   * 更新分页
   */
  const updatePagination = useCallback(
    (pagination: { page?: number; limit?: number }) => {
      setFilters((prev) => ({
        ...prev,
        ...pagination
      }));
    },
    []
  );

  /**
   * 清空筛选条件
   */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * 检查是否有激活的筛选条件
   */
  const hasActiveFilters = Boolean(
    filters.name ||
      filters.code ||
      filters.status !== 'all' ||
      filters.parentId !== undefined
  );

  return {
    filters,
    searchFilters,
    updatePagination,
    clearFilters,
    hasActiveFilters
  };
}
