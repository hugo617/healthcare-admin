import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/client-logger';
import type {
  Tenant,
  TenantFormData,
  TenantFilters,
  PaginationInfo,
  UseTenantManagementReturn,
  TenantApiResponse,
  TenantStatisticsData,
  BatchOperationRequest,
  ExportFormat
} from '../types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { tenantService } from '../services/tenantService';

/**
 * 租户管理 Hook
 */
export function useTenantManagement(): UseTenantManagementReturn {
  // 状态管理
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [error, setError] = useState<string>();

  // 新增状态：统计数据和选择状态
  const [statistics, setStatistics] = useState<TenantStatisticsData>();
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(
    new Set()
  );

  // 用于取消请求的 ref
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 获取租户列表
   */
  const fetchTenants = useCallback(async (filters: TenantFilters) => {
    try {
      setLoading(true);
      setError(undefined);

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建新的 abort controller
      abortControllerRef.current = new AbortController();

      clientLogger.info(
        'useTenantManagement',
        'fetchTenants',
        'Fetching tenants with filters:',
        { filters }
      );

      const response = await tenantService.getTenants(filters, {
        signal: abortControllerRef.current.signal
      });

      if (response.success && response.data) {
        setTenants(response.data.data);
        setPagination({
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
          totalPages: response.data.totalPages,
          hasNext: response.data.hasNext,
          hasPrev: response.data.hasPrev
        });

        clientLogger.info(
          'useTenantManagement',
          'fetchTenants',
          'Tenants fetched successfully',
          {
            count: response.data.data.length,
            total: response.data.total
          }
        );
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tenants');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        clientLogger.debug(
          'useTenantManagement',
          'fetchTenants',
          'Request aborted'
        );
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : ERROR_MESSAGES.LOAD_FAILED;
      setError(errorMessage);

      clientLogger.error(
        'useTenantManagement',
        'fetchTenants',
        'Failed to fetch tenants:',
        { error: err.message }
      );

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 创建租户
   */
  const createTenant = useCallback(
    async (data: TenantFormData): Promise<boolean> => {
      try {
        setLoading(true);
        setError(undefined);

        clientLogger.info(
          'useTenantManagement',
          'createTenant',
          'Creating tenant:',
          { name: data.name, code: data.code }
        );

        const response = await tenantService.createTenant(data);

        if (response.success && response.data) {
          clientLogger.info(
            'useTenantManagement',
            'createTenant',
            'Tenant created successfully',
            {
              tenantId: response.data.id,
              tenantCode: response.data.code
            }
          );

          toast.success(SUCCESS_MESSAGES.CREATE);

          return true;
        } else {
          throw new Error(response.error?.message || 'Failed to create tenant');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : ERROR_MESSAGES.CREATE_FAILED;
        setError(errorMessage);

        clientLogger.error(
          'useTenantManagement',
          'createTenant',
          'Failed to create tenant:',
          { error: err.message }
        );

        toast.error(errorMessage);

        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 更新租户
   */
  const updateTenant = useCallback(
    async (id: string, data: TenantFormData): Promise<boolean> => {
      try {
        setLoading(true);
        setError(undefined);

        clientLogger.info(
          'useTenantManagement',
          'updateTenant',
          'Updating tenant:',
          { tenantId: id, data }
        );

        const response = await tenantService.updateTenant(id, data);

        if (response.success && response.data) {
          clientLogger.info(
            'useTenantManagement',
            'updateTenant',
            'Tenant updated successfully',
            {
              tenantId: id,
              tenantCode: response.data.code
            }
          );

          toast.success(SUCCESS_MESSAGES.UPDATE);

          // 不更新本地状态，让调用方通过 fetchTenants 刷新数据
          // 这样可以确保获取完整的 tenant 数据（包括 userCount 等计算字段）

          return true;
        } else {
          throw new Error(response.error?.message || 'Failed to update tenant');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : ERROR_MESSAGES.UPDATE_FAILED;
        setError(errorMessage);

        clientLogger.error(
          'useTenantManagement',
          'updateTenant',
          'Failed to update tenant:',
          { error: err.message }
        );

        toast.error(errorMessage);

        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 删除租户
   */
  const deleteTenant = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(undefined);

      clientLogger.info(
        'useTenantManagement',
        'deleteTenant',
        'Deleting tenant:',
        { tenantId: id }
      );

      const response = await tenantService.deleteTenant(id);

      if (response.success) {
        clientLogger.info(
          'useTenantManagement',
          'deleteTenant',
          'Tenant deleted successfully',
          { tenantId: id }
        );

        toast.success(SUCCESS_MESSAGES.DELETE);

        // 从本地状态中移除
        setTenants((prev) => prev.filter((tenant) => tenant.id !== id));

        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to delete tenant');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ERROR_MESSAGES.DELETE_FAILED;
      setError(errorMessage);

      clientLogger.error(
        'useTenantManagement',
        'deleteTenant',
        'Failed to delete tenant:',
        { error: err.message }
      );

      toast.error(errorMessage);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 切换租户状态
   */
  const toggleTenantStatus = useCallback(
    async (
      id: string,
      status: 'active' | 'inactive' | 'suspended'
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(undefined);

        clientLogger.info(
          'useTenantManagement',
          'toggleTenantStatus',
          'Toggling tenant status:',
          { tenantId: id, newStatus: status }
        );

        const response = await tenantService.updateTenantStatus(id, status);

        if (response.success && response.data) {
          const successMessage =
            status === 'active'
              ? SUCCESS_MESSAGES.ACTIVATE
              : status === 'inactive'
                ? SUCCESS_MESSAGES.DEACTIVATE
                : SUCCESS_MESSAGES.SUSPEND;

          clientLogger.info(
            'useTenantManagement',
            'toggleTenantStatus',
            'Tenant status updated successfully',
            {
              tenantId: id,
              newStatus: status
            }
          );

          toast.success(successMessage);

          // 更新本地状态
          setTenants((prev) =>
            prev.map((tenant) =>
              tenant.id === id
                ? { ...tenant, status: response.data!.status }
                : tenant
            )
          );

          return true;
        } else {
          throw new Error(
            response.error?.message || 'Failed to toggle tenant status'
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : ERROR_MESSAGES.STATUS_TOGGLE_FAILED;
        setError(errorMessage);

        clientLogger.error(
          'useTenantManagement',
          'toggleTenantStatus',
          'Failed to toggle tenant status:',
          { error: err.message }
        );

        toast.error(errorMessage);

        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 获取统计数据
   */
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      clientLogger.info(
        'useTenantManagement',
        'fetchStatistics',
        'Fetching tenant statistics'
      );

      const response = await tenantService.getTenantStats();

      if (response.success && response.data) {
        // 转换 API 返回的数据为统计卡片需要的格式
        const statsData: TenantStatisticsData = {
          overview: {
            total: response.data.totalTenants || 0,
            active: response.data.activeTenants || 0,
            inactive: response.data.inactiveTenants || 0,
            suspended: response.data.suspendedTenants || 0,
            activeRate:
              response.data.totalTenants > 0
                ? Math.round(
                    (response.data.activeTenants / response.data.totalTenants) *
                      100
                  )
                : 0
          },
          users: {
            total: response.data.totalUsers || 0,
            active: Math.round((response.data.totalUsers || 0) * 0.8) // 估算值
          },
          engagement: {
            recentActive: Math.round((response.data.totalUsers || 0) * 0.7),
            activeRate: 70,
            avgActivity: 50
          },
          growth: {
            today: 0,
            week: 0,
            thisMonth: 0,
            lastMonth: 0,
            growthRate: 0
          }
        };

        setStatistics(statsData);

        clientLogger.info(
          'useTenantManagement',
          'fetchStatistics',
          'Statistics fetched successfully',
          statsData
        );
      } else {
        throw new Error(
          response.message ||
            response.error?.message ||
            'Failed to fetch statistics'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '获取统计数据失败';
      setError(errorMessage);

      clientLogger.error(
        'useTenantManagement',
        'fetchStatistics',
        'Failed to fetch statistics:',
        { error: err.message }
      );

      // 统计数据加载失败不影响主要功能，不显示 toast
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 批量操作租户
   */
  const batchOperateTenants = useCallback(
    async (
      operation: 'activate' | 'deactivate' | 'suspend' | 'delete'
    ): Promise<boolean> => {
      if (selectedTenants.size === 0) {
        toast.error('请先选择要操作的租户');
        return false;
      }

      try {
        setLoading(true);
        setError(undefined);

        const tenantIds = Array.from(selectedTenants);

        clientLogger.info(
          'useTenantManagement',
          'batchOperateTenants',
          'Batch operation:',
          { operation, tenantIds }
        );

        const request: BatchOperationRequest = { operation, tenantIds };
        const response = await tenantService.batchOperateTenants(request);

        if (response.success) {
          const messages = {
            activate: '批量启用成功',
            deactivate: '批量停用成功',
            suspend: '批量暂停成功',
            delete: '批量删除成功'
          };

          toast.success(messages[operation]);

          // 清除选择
          clearTenantSelection();

          return true;
        } else {
          throw new Error(response.error?.message || '批量操作失败');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '批量操作失败';
        setError(errorMessage);

        clientLogger.error(
          'useTenantManagement',
          'batchOperateTenants',
          'Failed to batch operate:',
          { error: err.message }
        );

        toast.error(errorMessage);

        return false;
      } finally {
        setLoading(false);
      }
    },
    [selectedTenants]
  );

  /**
   * 切换租户选中状态
   */
  const toggleTenantSelection = useCallback((id: string) => {
    setSelectedTenants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        clientLogger.debug(
          'useTenantManagement',
          'toggleTenantSelection',
          'Deselected tenant:',
          { tenantId: id }
        );
      } else {
        next.add(id);
        clientLogger.debug(
          'useTenantManagement',
          'toggleTenantSelection',
          'Selected tenant:',
          { tenantId: id }
        );
      }
      return next;
    });
  }, []);

  /**
   * 全选/取消全选
   */
  const toggleAllSelection = useCallback(() => {
    setSelectedTenants((prev) => {
      if (prev.size === tenants.length) {
        // 当前已全选，取消全选
        clientLogger.debug(
          'useTenantManagement',
          'toggleAllSelection',
          'Deselected all tenants'
        );
        return new Set();
      } else {
        // 全选
        const allIds = new Set(tenants.map((t) => t.id));
        clientLogger.debug(
          'useTenantManagement',
          'toggleAllSelection',
          'Selected all tenants:',
          { count: allIds.size }
        );
        return allIds;
      }
    });
  }, [tenants]);

  /**
   * 清除选择
   */
  const clearTenantSelection = useCallback(() => {
    setSelectedTenants(new Set());
    clientLogger.debug(
      'useTenantManagement',
      'clearTenantSelection',
      'Cleared all selections'
    );
  }, []);

  /**
   * 导出租户数据
   */
  const exportTenants = useCallback(
    async (format: ExportFormat = 'csv'): Promise<void> => {
      try {
        setLoading(true);

        clientLogger.info(
          'useTenantManagement',
          'exportTenants',
          'Exporting tenants:',
          { format }
        );

        await tenantService.exportTenants(format);

        toast.success('导出成功');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '导出失败';

        clientLogger.error(
          'useTenantManagement',
          'exportTenants',
          'Failed to export:',
          { error: err.message }
        );

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 组件卸载时取消正在进行的请求
  const handleCleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 在组件卸载时清理
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleCleanup);
    setTimeout(() => {
      window.removeEventListener('beforeunload', handleCleanup);
    }, 0);
  }

  return {
    tenants,
    loading,
    pagination,
    error,
    fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    toggleTenantStatus,
    // 新增返回值
    statistics,
    selectedTenants,
    fetchStatistics,
    batchOperateTenants,
    toggleTenantSelection,
    toggleAllSelection,
    clearTenantSelection,
    exportTenants
  };
}
