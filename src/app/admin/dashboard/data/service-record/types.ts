/**
 * 服务记录管理 - 类型定义
 */

// 服务记录
export interface ServiceRecord {
  id: string;
  userId: number;
  archiveId: string;
  count: number;
  serviceDate: string; // YYYY/MM/DD
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  discomfort: {
    tags: string[];
    notes: string;
  };
  consultant: {
    name: string;
    id?: number;
  };
  duration: number; // 理疗时长(分钟)
  temperature: number; // 理疗温度(℃)
  feedback: string;
  status: 'active' | 'cancelled' | 'completed';
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
  archive?: {
    id: string;
    customerNo: string;
    basicInfo: {
      name?: string;
      age?: number;
      gender?: string;
      phone?: string;
    };
  };
}

// 服务档案(用于分组视图)
export interface ServiceArchive {
  id: string;
  customerNo: string;
  userId: number;
  basicInfo: {
    name?: string;
    age?: number;
    gender?: string;
    phone?: string;
  };
  serviceRecords: ServiceRecord[];
  recordCount: number;
  lastServiceDate?: string;
}

// 筛选条件
export interface ServiceRecordFilters {
  search?: string;
  userId?: number;
  archiveId?: string;
  customerNo?: string;
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'active' | 'cancelled' | 'completed';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 表单数据
export interface ServiceRecordFormData {
  archiveId: string;
  serviceDate: string;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  discomfort: {
    tags: string[];
    notes: string;
  };
  consultant: {
    name: string;
  };
  duration: number;
  temperature: number;
  feedback: string;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 统计信息
export interface ServiceRecordStatistics {
  overview: {
    total: number;
    thisMonth: number;
    today: number;
    completed: number;
    completionRate: number;
  };
  serviceTrends: {
    date: string;
    count: number;
  }[];
  byArchive: {
    archiveId: string;
    customerNo: string;
    userName: string;
    count: number;
    lastServiceDate: string;
  }[];
}

// 对话框状态
export type ServiceRecordDialogType = 'create' | 'edit' | null;

export interface ServiceRecordDialogState {
  type: ServiceRecordDialogType;
  record: ServiceRecord | null;
  open: boolean;
}

// 血压等级
export type BloodPressureLevel = 'normal' | 'warning' | 'danger';

export interface BloodPressureStatus {
  level: BloodPressureLevel;
  label: string;
  color: string;
  message: string;
}
