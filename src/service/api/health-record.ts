/**
 * 健康记录API服务
 */
import { apiRequest, buildSearchParams } from './base';

export class HealthRecordAPI {
  /**
   * 获取健康记录列表
   */
  static async getHealthRecords(params?: {
    page?: number;
    limit?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/health-records${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 获取健康记录详情
   */
  static async getHealthRecord(id: string) {
    return apiRequest(`/admin/health-records/${id}`);
  }

  /**
   * 创建健康记录
   */
  static async createHealthRecord(data: {
    userId: number;
    recordDate: string;
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    bloodSugar?: {
      value: number;
      unit: string;
      type: 'fasting' | 'postprandial' | 'random';
    };
    heartRate?: number;
    weight?: {
      value: number;
      unit: string;
    };
    temperature?: {
      value: number;
      unit: string;
    };
    notes?: string;
  }) {
    return apiRequest('/admin/health-records', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * 更新健康记录
   */
  static async updateHealthRecord(
    id: string,
    data: {
      recordDate?: string;
      bloodPressure?: {
        systolic: number;
        diastolic: number;
      };
      bloodSugar?: {
        value: number;
        unit: string;
        type: 'fasting' | 'postprandial' | 'random';
      };
      heartRate?: number;
      weight?: {
        value: number;
        unit: string;
      };
      temperature?: {
        value: number;
        unit: string;
      };
      notes?: string;
    }
  ) {
    return apiRequest(`/admin/health-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * 删除健康记录
   */
  static async deleteHealthRecord(id: string) {
    return apiRequest(`/admin/health-records/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * 获取用户健康趋势数据
   */
  static async getHealthTrendData(
    userId: number,
    params?: {
      startDate?: string;
      endDate?: string;
      type?: 'bloodPressure' | 'bloodSugar' | 'heartRate' | 'weight' | 'all';
    }
  ) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/health-records/${userId}/trends${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 获取健康记录统计信息
   */
  static async getHealthRecordStatistics(params?: {
    startDate?: string;
    endDate?: string;
    userId?: number;
  }) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/health-records/statistics${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 导出健康记录
   */
  static async exportHealthRecords(params?: {
    format?: 'csv' | 'excel';
    userId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = buildSearchParams(params || {});
    const url = `/admin/health-records/export${searchParams ? `?${searchParams}` : ''}`;
    return apiRequest(url);
  }

  /**
   * 批量删除健康记录
   */
  static async batchDeleteHealthRecords(ids: string[]) {
    return apiRequest('/admin/health-records/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
  }
}
