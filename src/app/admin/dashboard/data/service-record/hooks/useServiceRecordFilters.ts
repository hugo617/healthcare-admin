import { useState, useCallback } from 'react';
import { ServiceRecordFilters } from '../types';
import { DEFAULT_FILTERS } from '../constants';

/**
 * 服务记录筛选状态管理 Hook
 */
export function useServiceRecordFilters() {
  const [filters, setFilters] = useState<ServiceRecordFilters>(DEFAULT_FILTERS);

  /**
   * 更新筛选条件
   */
  const updateFilters = useCallback(
    (newFilters: Partial<ServiceRecordFilters>) => {
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
    (searchParams: Partial<ServiceRecordFilters>) => {
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
    filters.search ||
      filters.userId ||
      filters.archiveId ||
      filters.customerNo ||
      filters.status !== 'all' ||
      filters.startDate ||
      filters.endDate
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
