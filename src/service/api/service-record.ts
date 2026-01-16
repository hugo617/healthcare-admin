/**
 * 服务记录API服务
 */
import { apiRequest, buildSearchParams } from './base';

export class ServiceRecordAPI {
  /**
   * 获取服务记录列表
   */
  static async getServiceRecords(params?: {
    page?: number;
    limit?: number;
    userId?: number;
    archiveId?: string;
    customerNo?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/service-records${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 获取服务记录详情
   */
  static async getServiceRecord(id: string) {
    return apiRequest(`/admin/service-records/${id}`);
  }

  /**
   * 创建服务记录
   */
  static async createServiceRecord(data: {
    archiveId: string;
    serviceDate: string;
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    discomfort?: {
      tags: string[];
      notes: string;
    };
    consultant?: {
      name: string;
    };
    duration?: number;
    temperature?: number;
    feedback?: string;
  }) {
    return apiRequest('/admin/service-records', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * 更新服务记录
   */
  static async updateServiceRecord(
    id: string,
    data: {
      serviceDate?: string;
      bloodPressure?: {
        systolic: number;
        diastolic: number;
      };
      discomfort?: {
        tags: string[];
        notes: string;
      };
      consultant?: {
        name: string;
      };
      duration?: number;
      temperature?: number;
      feedback?: string;
      status?: string;
    }
  ) {
    return apiRequest(`/admin/service-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * 删除服务记录
   */
  static async deleteServiceRecord(id: string) {
    return apiRequest(`/admin/service-records/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * 获取指定档案的服务记录
   */
  static async getServiceRecordsByArchive(
    archiveId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/service-records/archive/${archiveId}${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 获取服务记录统计信息
   */
  static async getServiceRecordStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/service-records/statistics${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 导出服务记录
   */
  static async exportServiceRecords(params?: {
    format?: 'csv' | 'excel';
    startDate?: string;
    endDate?: string;
    archiveId?: string;
  }) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/service-records/export${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 批量删除服务记录
   */
  static async batchDeleteServiceRecords(ids: string[]) {
    return apiRequest('/admin/service-records/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
  }
}
