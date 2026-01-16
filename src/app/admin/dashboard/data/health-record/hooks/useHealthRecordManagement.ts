import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  HealthRecord,
  HealthRecordFormData,
  HealthRecordStatistics,
  PaginationInfo
} from '../types';
import { DEFAULT_PAGINATION, MESSAGES } from '../constants';
import { HealthRecordAPI } from '@/service/api/health-record';

/**
 * 健康记录管理业务逻辑 Hook
 */
export function useHealthRecordManagement() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] =
    useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [statistics, setStatistics] = useState<
    HealthRecordStatistics | undefined
  >();
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  /**
   * 获取健康记录列表
   */
  const fetchRecords = useCallback(async (filters: any) => {
    try {
      setLoading(true);

      const res = await HealthRecordAPI.getHealthRecords(filters);

      if (res.success && res.data) {
        setRecords(res.data);
        setPagination(res.pagination || DEFAULT_PAGINATION);
      } else {
        toast.error(res.message || '获取健康记录失败');
        setRecords([]);
      }
    } catch (error) {
      console.error('获取健康记录失败:', error);
      toast.error('获取健康记录失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取统计信息
   */
  const fetchStatistics = useCallback(async (params?: any) => {
    try {
      const res = await HealthRecordAPI.getHealthRecordStatistics(params);

      if (res.success && res.data) {
        setStatistics(res.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  }, []);

  /**
   * 创建健康记录
   */
  const createRecord = useCallback(
    async (data: HealthRecordFormData): Promise<boolean> => {
      try {
        const res = await HealthRecordAPI.createHealthRecord(data);

        if (res.success) {
          toast.success(MESSAGES.SUCCESS.CREATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.CREATE);
          return false;
        }
      } catch (error) {
        console.error('创建健康记录失败:', error);
        toast.error(MESSAGES.ERROR.CREATE);
        return false;
      }
    },
    []
  );

  /**
   * 更新健康记录
   */
  const updateRecord = useCallback(
    async (
      id: string,
      data: Partial<HealthRecordFormData>
    ): Promise<boolean> => {
      try {
        const res = await HealthRecordAPI.updateHealthRecord(id, data);

        if (res.success) {
          toast.success(MESSAGES.SUCCESS.UPDATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.UPDATE);
          return false;
        }
      } catch (error) {
        console.error('更新健康记录失败:', error);
        toast.error(MESSAGES.ERROR.UPDATE);
        return false;
      }
    },
    []
  );

  /**
   * 删除健康记录
   */
  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await HealthRecordAPI.deleteHealthRecord(id);

      if (res.success) {
        toast.success(MESSAGES.SUCCESS.DELETE);
        return true;
      } else {
        toast.error(res.message || MESSAGES.ERROR.DELETE);
        return false;
      }
    } catch (error) {
      console.error('删除健康记录失败:', error);
      toast.error(MESSAGES.ERROR.DELETE);
      return false;
    }
  }, []);

  /**
   * 批量删除健康记录
   */
  const batchDeleteRecords = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        const res = await HealthRecordAPI.batchDeleteHealthRecords(ids);

        if (res.success) {
          toast.success(`成功删除 ${ids.length} 条健康记录`);
          return true;
        } else {
          toast.error(res.message || '批量删除失败');
          return false;
        }
      } catch (error) {
        console.error('批量删除失败:', error);
        toast.error('批量删除失败');
        return false;
      }
    },
    []
  );

  /**
   * 切换记录选择状态
   */
  const toggleRecordSelection = useCallback((id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id)
        ? prev.filter((recordId) => recordId !== id)
        : [...prev, id]
    );
  }, []);

  /**
   * 全选/取消全选
   */
  const selectAllRecords = useCallback(() => {
    const allIds = records.map((r) => r.id);
    const allSelected =
      allIds.length > 0 && selectedRecords.length === allIds.length;
    setSelectedRecords(allSelected ? [] : allIds);
  }, [records, selectedRecords]);

  /**
   * 清空选择
   */
  const clearRecordSelection = useCallback(() => {
    setSelectedRecords([]);
  }, []);

  return {
    // 状态
    records,
    loading,
    pagination,
    statistics,
    selectedRecords,

    // 方法
    fetchRecords,
    fetchStatistics,
    createRecord,
    updateRecord,
    deleteRecord,
    batchDeleteRecords,
    toggleRecordSelection,
    selectAllRecords,
    clearRecordSelection
  };
}
