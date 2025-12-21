import { clientLogger } from '@/lib/client-logger';
import { TenantAPI } from '@/service/request';
import type {
  Tenant,
  TenantFormData,
  TenantFilters,
  TenantApiResponse,
  CreateTenantRequest,
  UpdateTenantRequest
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
      clientLogger.debug('TenantService', 'getTenants', 'Fetching tenants with filters', filters);

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
      clientLogger.debug('TenantService', 'getTenants', 'Received response:', response);

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'getTenants', 'Error in getTenants:', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建租户
   */
  async createTenant(data: TenantFormData): Promise<TenantApiResponse> {
    try {
      clientLogger.debug('TenantService', 'createTenant', 'Creating tenant:', data);

      const createRequest: CreateTenantRequest = {
        name: data.name,
        code: data.code,
        status: data.status,
        settings: data.settings || {}
      };

      const response = await TenantAPI.createTenant(createRequest);
      clientLogger.debug('TenantService', 'createTenant', 'Create tenant response:', response);

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'createTenant', 'Error in createTenant:', { error: error.message });
      throw error;
    }
  }

  /**
   * 更新租户
   */
  async updateTenant(id: string, data: TenantFormData): Promise<TenantApiResponse> {
    try {
      clientLogger.debug('TenantService', 'updateTenant', 'Updating tenant:', { id, data });

      const updateRequest: UpdateTenantRequest = {
        name: data.name,
        status: data.status,
        settings: data.settings
      };

      const response = await TenantAPI.updateTenant(id, updateRequest);
      clientLogger.debug('TenantService', 'updateTenant', 'Update tenant response:', response);

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'updateTenant', 'Error in updateTenant:', { error: error.message });
      throw error;
    }
  }

  /**
   * 删除租户
   */
  async deleteTenant(id: string): Promise<TenantApiResponse> {
    try {
      clientLogger.debug('TenantService', 'deleteTenant', 'Deleting tenant:', { id });

      const response = await TenantAPI.deleteTenant(id);
      clientLogger.debug('TenantService', 'deleteTenant', 'Delete tenant response:', response);

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'deleteTenant', 'Error in deleteTenant:', { error: error.message });
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
      clientLogger.debug('TenantService', 'updateTenantStatus', 'Updating tenant status:', { id, status });

      const response = await TenantAPI.updateTenantStatus(id, status);
      clientLogger.debug('TenantService', 'updateTenantStatus', 'Update tenant status response:', response);

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'updateTenantStatus', 'Error in updateTenantStatus:', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取租户详情
   */
  async getTenant(id: string): Promise<TenantApiResponse> {
    try {
      clientLogger.debug('TenantService', 'getTenant', 'Getting tenant details:', { id });

      const response = await TenantAPI.getTenant(id);
      clientLogger.debug('TenantService', 'getTenant', 'Get tenant response:', response);

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'getTenant', 'Error in getTenant:', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取租户统计信息
   */
  async getTenantStats(): Promise<TenantApiResponse> {
    try {
      clientLogger.debug('TenantService', 'getTenantStats', 'Getting tenant stats');

      const response = await TenantAPI.getTenantStats();
      clientLogger.debug('TenantService', 'getTenantStats', 'Get tenant stats response:', response);

      return response;
    } catch (error) {
      clientLogger.error('TenantService', 'getTenantStats', 'Error in getTenantStats:', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取租户用户数量
   */
  async getTenantUserCount(id: string): Promise<number> {
    try {
      clientLogger.debug('TenantService', 'getTenantUserCount', 'Getting tenant user count:', { id });

      const response = await TenantAPI.getTenantUserCount(id);
      clientLogger.debug('TenantService', 'getTenantUserCount', 'Get tenant user count response:', response);

      return response.data?.count || 0;
    } catch (error) {
      clientLogger.error('TenantService', 'getTenantUserCount', 'Error in getTenantUserCount:', { error: error.message });
      return 0;
    }
  }
}

// 导出单例实例
export const tenantService = new TenantService();