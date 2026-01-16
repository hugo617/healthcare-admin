/**
 * 健康记录管理 - 类型定义
 */

// 健康记录
export interface HealthRecord {
  id: string;
  userId: number;
  recordDate: string; // YYYY-MM-DD
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar: {
    value: number;
    unit: string;
    type: 'fasting' | 'postprandial' | 'random';
  };
  heartRate?: number; // bpm
  weight: {
    value: number;
    unit: string;
  };
  temperature: {
    value: number;
    unit: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  user?: {
    id: number;
    username: string;
    realName?: string;
    phone?: string;
    avatar?: string;
  };
}

// 筛选条件
export interface HealthRecordFilters {
  search?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  bloodSugarType?: 'all' | 'fasting' | 'postprandial' | 'random';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 表单数据
export interface HealthRecordFormData {
  userId: number;
  recordDate: string;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar: {
    value: number;
    unit: string;
    type: 'fasting' | 'postprandial' | 'random';
  };
  heartRate?: number;
  weight: {
    value: number;
    unit: string;
  };
  temperature: {
    value: number;
    unit: string;
  };
  notes: string;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 统计信息
export interface HealthRecordStatistics {
  overview: {
    totalRecords: number;
    thisMonthRecords: number;
    avgBloodPressure: {
      systolic: number;
      diastolic: number;
    };
    avgBloodSugar: number;
    avgHeartRate: number;
    avgWeight: number;
  };
  latestRecord?: HealthRecord;
  byUser: {
    userId: number;
    userName: string;
    recordCount: number;
    lastRecordDate: string;
  }[];
}

// 趋势数据
export interface HealthTrendData {
  dates: string[];
  bloodPressure: {
    systolic: number[];
    diastolic: number[];
  };
  bloodSugar: {
    fasting: number[];
    postprandial: number[];
  };
  heartRate: number[];
  weight: number[];
}

// 对话框状态
export type HealthRecordDialogType = 'create' | 'edit' | null;

export interface HealthRecordDialogState {
  type: HealthRecordDialogType;
  record: HealthRecord | null;
  open: boolean;
}

// 健康指标状态
export type HealthIndicatorStatus = 'normal' | 'warning' | 'danger' | 'low';

export interface HealthIndicatorLevel {
  status: HealthIndicatorStatus;
  label: string;
  color: string;
  bgColor: string;
}

// 时间范围选项
export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

// 趋势图表配置
export interface TrendChartConfig {
  type: 'bloodPressure' | 'bloodSugar' | 'heartRate' | 'weight' | 'all';
  timeRange: TimeRange;
}
