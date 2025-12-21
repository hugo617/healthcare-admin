import { apiRequest, buildSearchParams } from './base';

// 租户相关 API
export class TenantAPI {
  // 获取租户列表
  static async getTenants(params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = buildSearchParams(params || {});
    return apiRequest(`/tenants${searchParams ? `?${searchParams}` : ''}`);
  }

  // 获取租户详情
  static async getTenant(id: string) {
    return apiRequest(`/tenants/${id}`);
  }

  // 创建租户
  static async createTenant(tenantData: {
    name: string;
    code: string;
    status?: string;
    settings?: any;
  }) {
    return apiRequest('/tenants', {
      method: 'POST',
      body: JSON.stringify(tenantData)
    });
  }

  // 更新租户
  static async updateTenant(id: string, tenantData: {
    name: string;
    status: string;
    settings?: any;
  }) {
    return apiRequest(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tenantData)
    });
  }

  // 删除租户
  static async deleteTenant(id: string) {
    return apiRequest(`/tenants/${id}`, {
      method: 'DELETE'
    });
  }

  // 更新租户状态
  static async updateTenantStatus(id: string, status: string) {
    return apiRequest(`/tenants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // 获取租户统计信息
  static async getTenantStats() {
    return apiRequest('/tenants/stats');
  }

  // 获取租户用户数量
  static async getTenantUserCount(id: string) {
    return apiRequest(`/tenants/${id}/users/count`);
  }
}