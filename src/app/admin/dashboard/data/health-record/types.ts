/**
 * 健康档案管理 - 类型定义
 */

// 基本信息 (从 basicInfo JSONB)
export interface BasicInfo {
  name: string;
  age: string;
  sex: 'male' | 'female';
  height: string;
  weight: string;
  contact: string;
}

// 健康史 (从 healthHistory JSONB)
export interface HealthHistory {
  allergy: string;
  allergyText: string;
  medication: string;
  medicalDevice: string;
  recentCheckup: {
    time: string;
    result: string;
  };
  chronicDisease: string;
  surgeryHistory: {
    time: string;
    location: string;
  };
  pregnancyPeriod: string;
}

// 健康档案
export interface HealthArchive {
  id: string;
  userId: number;
  customerNo: string;
  channels: Record<string, any>;
  basicInfo: BasicInfo;
  healthHistory: HealthHistory;
  subjectiveDemand: string;
  signature1: Record<string, any>;
  signature2: Record<string, any>;
  footer: Record<string, any>;
  status: string;
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
export interface HealthArchiveFilters {
  search?: string;
  userId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 统计信息
export interface HealthArchiveStatistics {
  overview: {
    totalArchives: number;
    thisMonthArchives: number;
    activeArchives: number;
  };
  byUser: {
    userId: number;
    userName: string;
    archiveCount: number;
    lastCreatedDate: string;
  }[];
}

// 表单数据
export interface HealthArchiveFormData {
  userId: number;
  customerNo: string;
  basicInfo: BasicInfo;
  healthHistory: HealthHistory;
  subjectiveDemand: string;
  status: string;
}

// 对话框状态
export type HealthArchiveDialogType = 'create' | 'edit' | null;

export interface HealthArchiveDialogState {
  type: HealthArchiveDialogType;
  archive: HealthArchive | null;
  open: boolean;
}

// 档案状态
export type ArchiveStatus = 'active' | 'inactive' | 'pending';

export interface ArchiveStatusInfo {
  status: ArchiveStatus;
  label: string;
  color: string;
}

// 导出选项
export interface ExportOptions {
  format?: 'csv' | 'excel';
  userId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}
