import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/client-logger';
import type {
  Tenant,
  TenantFormData,
  TenantFilters,
  PaginationInfo,
  UseTenantManagementReturn,
  TenantApiResponse
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

      clientLogger.info('useTenantManagement', 'fetchTenants', 'Fetching tenants with filters:', { filters });

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

        clientLogger.info('useTenantManagement', 'fetchTenants', 'Tenants fetched successfully', {
          count: response.data.data.length,
          total: response.data.total
        });
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tenants');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        clientLogger.debug('useTenantManagement', 'fetchTenants', 'Request aborted');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.LOAD_FAILED;
      setError(errorMessage);

      clientLogger.error('useTenantManagement', 'fetchTenants', 'Failed to fetch tenants:', { error: err.message });

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 创建租户
   */
  const createTenant = useCallback(async (data: TenantFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(undefined);

      clientLogger.info('useTenantManagement', 'createTenant', 'Creating tenant:', { name: data.name, code: data.code });

      const response = await tenantService.createTenant(data);

      if (response.success && response.data) {
        clientLogger.info('useTenantManagement', 'createTenant', 'Tenant created successfully', {
          tenantId: response.data.id,
          tenantCode: response.data.code
        });

        toast.success(SUCCESS_MESSAGES.CREATE);

        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to create tenant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.CREATE_FAILED;
      setError(errorMessage);

      clientLogger.error('useTenantManagement', 'createTenant', 'Failed to create tenant:', { error: err.message });

      toast.error(errorMessage);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 更新租户
   */
  const updateTenant = useCallback(async (id: string, data: TenantFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(undefined);

      clientLogger.info('useTenantManagement', 'updateTenant', 'Updating tenant:', { tenantId: id, data });

      const response = await tenantService.updateTenant(id, data);

      if (response.success && response.data) {
        clientLogger.info('useTenantManagement', 'updateTenant', 'Tenant updated successfully', {
          tenantId: id,
          tenantCode: response.data.code
        });

        toast.success(SUCCESS_MESSAGES.UPDATE);

        // 更新本地状态
        setTenants(prev => prev.map(tenant =>
          tenant.id === id ? { ...response.data! } : tenant
        ));

        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to update tenant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.UPDATE_FAILED;
      setError(errorMessage);

      clientLogger.error('useTenantManagement', 'updateTenant', 'Failed to update tenant:', { error: err.message });

      toast.error(errorMessage);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 删除租户
   */
  const deleteTenant = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(undefined);

      clientLogger.info('useTenantManagement', 'deleteTenant', 'Deleting tenant:', { tenantId: id });

      const response = await tenantService.deleteTenant(id);

      if (response.success) {
        clientLogger.info('useTenantManagement', 'deleteTenant', 'Tenant deleted successfully', { tenantId: id });

        toast.success(SUCCESS_MESSAGES.DELETE);

        // 从本地状态中移除
        setTenants(prev => prev.filter(tenant => tenant.id !== id));

        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to delete tenant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.DELETE_FAILED;
      setError(errorMessage);

      clientLogger.error('useTenantManagement', 'deleteTenant', 'Failed to delete tenant:', { error: err.message });

      toast.error(errorMessage);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 切换租户状态
   */
  const toggleTenantStatus = useCallback(async (id: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> => {
    try {
      setLoading(true);
      setError(undefined);

      clientLogger.info('useTenantManagement', 'toggleTenantStatus', 'Toggling tenant status:', { tenantId: id, newStatus: status });

      const response = await tenantService.updateTenantStatus(id, status);

      if (response.success && response.data) {
        const successMessage = status === 'active' ? SUCCESS_MESSAGES.ACTIVATE :
                              status === 'inactive' ? SUCCESS_MESSAGES.DEACTIVATE :
                              SUCCESS_MESSAGES.SUSPEND;

        clientLogger.info('useTenantManagement', 'toggleTenantStatus', 'Tenant status updated successfully', {
          tenantId: id,
          newStatus: status
        });

        toast.success(successMessage);

        // 更新本地状态
        setTenants(prev => prev.map(tenant =>
          tenant.id === id ? { ...tenant, status: response.data!.status } : tenant
        ));

        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to toggle tenant status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.STATUS_TOGGLE_FAILED;
      setError(errorMessage);

      clientLogger.error('useTenantManagement', 'toggleTenantStatus', 'Failed to toggle tenant status:', { error: err.message });

      toast.error(errorMessage);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

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
    toggleTenantStatus
  };
}