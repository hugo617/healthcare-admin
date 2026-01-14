/**
 * 组织架构 API 服务
 */

import { apiRequest, buildSearchParams } from './base';
import type {
  Organization,
  OrganizationTreeNode,
  UserOrganization,
  OrganizationFormData,
  AddUserToOrganizationData,
  PaginationInfo,
  ApiResponse
} from '@/app/admin/dashboard/account/organization/types';

export const OrganizationAPI = {
  /**
   * 获取组织列表
   */
  async getOrganizations(params: {
    page?: number;
    limit?: number;
    name?: string;
    code?: string;
    status?: string;
    parentId?: string | null;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Organization[]> & { pager?: PaginationInfo }> {
    const searchParams = buildSearchParams(params);
    const response = await apiRequest(`/organizations?${searchParams}`);
    return response;
  },

  /**
   * 获取组织树
   */
  async getOrganizationTree(): Promise<ApiResponse<OrganizationTreeNode[]>> {
    const response = await apiRequest('/organizations/tree');
    return response;
  },

  /**
   * 获取组织详情
   */
  async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    const response = await apiRequest(`/organizations/${id}`);
    return response;
  },

  /**
   * 创建组织
   */
  async createOrganization(
    data: OrganizationFormData
  ): Promise<ApiResponse<{ id: string; message: string }>> {
    const response = await apiRequest('/organizations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  },

  /**
   * 更新组织
   */
  async updateOrganization(
    id: string,
    data: Partial<OrganizationFormData>
  ): Promise<ApiResponse<{ id: string; message: string }>> {
    const response = await apiRequest(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response;
  },

  /**
   * 删除组织
   */
  async deleteOrganization(
    id: string
  ): Promise<ApiResponse<{ id: string; message: string }>> {
    const response = await apiRequest(`/organizations/${id}`, {
      method: 'DELETE'
    });
    return response;
  },

  /**
   * 获取组织的用户列表
   */
  async getOrganizationUsers(
    id: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<UserOrganization[]> & { pager?: PaginationInfo }> {
    const searchParams = buildSearchParams(params);
    const response = await apiRequest(
      `/organizations/${id}/users?${searchParams}`
    );
    return response;
  },

  /**
   * 添加用户到组织
   */
  async addUserToOrganization(
    id: string,
    data: AddUserToOrganizationData
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiRequest(`/organizations/${id}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  },

  /**
   * 从组织移除用户
   */
  async removeUserFromOrganization(
    id: string,
    userId: number
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiRequest(
      `/organizations/${id}/users?userId=${userId}`,
      {
        method: 'DELETE'
      }
    );
    return response;
  }
};
