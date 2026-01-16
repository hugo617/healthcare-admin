import { useState, useCallback } from 'react';
import { HealthRecordFilters } from '../types';
import { DEFAULT_FILTERS } from '../constants';

/**
 * 健康记录筛选状态管理 Hook
 */
export function useHealthRecordFilters() {
  const [filters, setFilters] = useState<HealthRecordFilters>(DEFAULT_FILTERS);

  /**
   * 更新筛选条件
   */
  const updateFilters = useCallback(
    (newFilters: Partial<HealthRecordFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
        // 如果修改了分页相关参数，重置为第一页
        ...(newFilters.page !== undefined || newFilters.limit !== undefined
          ? {}
          : { page: 1 })
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
   * 搜索
   */
  const searchFilters = useCallback(
    (searchParams: Partial<HealthRecordFilters>) => {
      setFilters({
        ...DEFAULT_FILTERS,
        ...searchParams,
        page: 1
      });
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
   * 是否有激活的筛选条件
   */
  const hasActiveFilters = Boolean(
    filters.search || filters.userId || filters.startDate || filters.endDate
  );

  return {
    filters,
    updateFilters,
    updatePagination,
    searchFilters,
    clearFilters,
    hasActiveFilters
  };
}
