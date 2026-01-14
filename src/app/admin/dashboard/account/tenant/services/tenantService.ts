import { clientLogger } from '@/lib/client-logger';
import { TenantAPI } from '@/service/request';
import type {
  Tenant,
  TenantFormData,
  TenantFilters,
  TenantApiResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
  BatchOperationRequest,
  ExportFormat
} from '../types';

/**
 * 租户 API 服务类
 */
export class TenantService {
  /**
   * 获取租户列表
   */
  async getTenants(
    filters: TenantFilters,
    options?: RequestInit
  ): Promise<TenantApiResponse> {
    try {
      clientLogger.debug(
        'TenantService',
        'getTenants',
        'Fetching tenants with filters',
        filters
      );

      const params = {
        page: filters.page,
        pageSize: filters.pageSize,
        keyword: filters.keyword,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      // 注意：options 中的 signal 参数暂时被忽略，因为 TenantAPI.getTenants 不支持
      const response = await TenantAPI.getTenants(params);
      clientLogger.debug(
        'TenantService',
        'getTenants',
        'Received response:',
        response
      );

      return response;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'getTenants',
        'Error in getTenants:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * 创建租户
   */
  async createTenant(data: TenantFormData): Promise<TenantApiResponse> {
    try {
      clientLogger.debug(
        'TenantService',
        'createTenant',
        'Creating tenant:',
        data
      );

      const createRequest: CreateTenantRequest = {
        name: data.name,
        code: data.code,
        status: data.status,
        settings: data.settings || {}
      };

      const response = await TenantAPI.createTenant(createRequest);
      clientLogger.debug(
        'TenantService',
        'createTenant',
        'Create tenant response:',
        response
      );

      return response;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'createTenant',
        'Error in createTenant:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * 更新租户
   */
  async updateTenant(
    id: string,
    data: TenantFormData
  ): Promise<TenantApiResponse> {
    try {
      clientLogger.debug('TenantService', 'updateTenant', 'Updating tenant:', {
        id,
        data
      });

      const updateRequest: UpdateTenantRequest = {
        name: data.name,
        status: data.status,
        settings: data.settings
      };

      // 确保 API 调用使用正确的参数格式（必需字段）
      const response = await TenantAPI.updateTenant(id, {
        name: data.name,
        status: data.status,
        settings: data.settings
      });
      clientLogger.debug(
        'TenantService',
        'updateTenant',
        'Update tenant response:',
        response
      );

      return response;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'updateTenant',
        'Error in updateTenant:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * 删除租户
   */
  async deleteTenant(id: string): Promise<TenantApiResponse> {
    try {
      clientLogger.debug('TenantService', 'deleteTenant', 'Deleting tenant:', {
        id
      });

      const response = await TenantAPI.deleteTenant(id);
      clientLogger.debug(
        'TenantService',
        'deleteTenant',
        'Delete tenant response:',
        response
      );

      return response;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'deleteTenant',
        'Error in deleteTenant:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * 更新租户状态
   */
  async updateTenantStatus(
    id: string,
    status: 'active' | 'inactive' | 'suspended'
  ): Promise<TenantApiResponse> {
    try {
      clientLogger.debug(
        'TenantService',
        'updateTenantStatus',
        'Updating tenant status:',
        { id, status }
      );

      const response = await TenantAPI.updateTenantStatus(id, status);
      clientLogger.debug(
        'TenantService',
        'updateTenantStatus',
        'Update tenant status response:',
        response
      );

      return response;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'updateTenantStatus',
        'Error in updateTenantStatus:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * 获取租户详情
   */
  async getTenant(id: string): Promise<TenantApiResponse> {
    try {
      clientLogger.debug(
        'TenantService',
        'getTenant',
        'Getting tenant details:',
        { id }
      );

      const response = await TenantAPI.getTenant(id);
      clientLogger.debug(
        'TenantService',
        'getTenant',
        'Get tenant response:',
        response
      );

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'getTenant', 'Error in getTenant:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 获取租户统计信息
   */
  async getTenantStats(): Promise<TenantApiResponse> {
    try {
      clientLogger.debug(
        'TenantService',
        'getTenantStats',
        'Getting tenant stats'
      );

      const response = await TenantAPI.getTenantStats();
      clientLogger.debug(
        'TenantService',
        'getTenantStats',
        'Get tenant stats response:',
        response
      );

      return response;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'getTenantStats',
        'Error in getTenantStats:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * 获取租户用户数量
   */
  async getTenantUserCount(id: string): Promise<number> {
    try {
      clientLogger.debug(
        'TenantService',
        'getTenantUserCount',
        'Getting tenant user count:',
        { id }
      );

      const response = await TenantAPI.getTenantUserCount(id);
      clientLogger.debug(
        'TenantService',
        'getTenantUserCount',
        'Get tenant user count response:',
        response
      );

      return response.data?.count || 0;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'getTenantUserCount',
        'Error in getTenantUserCount:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      return 0;
    }
  }

  /**
   * 批量操作租户
   */
  async batchOperateTenants(
    request: BatchOperationRequest
  ): Promise<TenantApiResponse> {
    try {
      clientLogger.debug(
        'TenantService',
        'batchOperateTenants',
        'Batch operating tenants:',
        request
      );

      const response = await fetch('/api/tenants/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || '批量操作失败');
      }

      clientLogger.debug(
        'TenantService',
        'batchOperateTenants',
        'Batch operate response:',
        data
      );

      return data;
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'batchOperateTenants',
        'Error in batchOperateTenants:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * 导出租户数据
   */
  async exportTenants(format: ExportFormat = 'csv'): Promise<void> {
    try {
      clientLogger.debug(
        'TenantService',
        'exportTenants',
        'Exporting tenants:',
        { format }
      );

      const response = await fetch('/api/tenants/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '导出失败');
      }

      // 获取文件内容
      const blob = await response.blob();

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants_${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      clientLogger.debug('TenantService', 'exportTenants', 'Export completed');
    } catch (error) {
      clientLogger.error(
        'TenantService',
        'exportTenants',
        'Error in exportTenants:',
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }
}

// 导出单例实例
export const tenantService = new TenantService();
