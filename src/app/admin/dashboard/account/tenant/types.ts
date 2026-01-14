/**
 * 租户管理相关类型定义
 */

/**
 * 租户状态类型
 */
export type TenantStatus = 'active' | 'inactive' | 'suspended';

/**
 * 租户信息接口
 */
export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: TenantStatus;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

/**
 * 租户设置接口
 */
export interface TenantSettings {
  maxUsers?: number;
  allowCustomBranding?: boolean;
  enableAPIAccess?: boolean;
  defaultRole?: string;
  sessionTimeout?: number;
  [key: string]: any;
}

/**
 * 租户表单数据接口
 */
export interface TenantFormData {
  name: string;
  code: string;
  status: TenantStatus;
  settings?: TenantSettings;
}

/**
 * 对话框状态接口
 */
export interface TenantDialogState {
  type: DialogType | null;
  tenant: Tenant | null;
  open: boolean;
  action?: 'activate' | 'deactivate' | 'suspend';
}

/**
 * 对话框类型
 */
export type DialogType = 'create' | 'edit' | 'delete' | 'status' | 'config';

/**
 * 过滤器接口
 */
export interface TenantFilters {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: TenantStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 分页数据响应接口
 */
export interface TenantListData {
  data: Tenant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * API 响应接口（支持分页数据、单个对象和统计数据）
 */
export interface TenantApiResponse {
  success: boolean;
  data?: TenantListData | Tenant | TenantStats;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

/**
 * 类型守卫：检查是否为分页数据
 */
export function isTenantListData(
  data: Tenant | TenantListData | TenantStats
): data is TenantListData {
  return 'data' in data && Array.isArray(data.data);
}

/**
 * 类型守卫：检查是否为单个 Tenant 对象
 */
export function isTenant(
  data: Tenant | TenantListData | TenantStats
): data is Tenant {
  return 'id' in data && typeof data.id === 'string' && !('data' in data);
}

/**
 * 类型守卫：检查是否为统计数据
 */
export function isTenantStats(
  data: Tenant | TenantListData | TenantStats
): data is TenantStats {
  return 'totalTenants' in data;
}

/**
 * 租户操作日志接口
 */
export interface TenantAuditLog {
  id: string;
  tenantId: string;
  action: string;
  details: Record<string, any>;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * 租户统计信息接口（扩展版）
 */
export interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  recentTenants: Tenant[];
}

/**
 * 租户统计数据接口（用于统计卡片组件）
 */
export interface TenantStatisticsData {
  overview: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    activeRate: number;
  };
  users: {
    total: number;
    active: number;
  };
  engagement: {
    recentActive: number;
    activeRate: number;
    avgActivity: number;
  };
  growth: {
    today: number;
    week: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
}

/**
 * 批量操作请求接口
 */
export interface BatchOperationRequest {
  operation: 'activate' | 'deactivate' | 'suspend' | 'delete';
  tenantIds: string[];
}

/**
 * 批量操作响应接口
 */
export interface BatchOperationResponse {
  success: number;
  failed: number;
  errors: Array<{ tenantId: string; error: string }>;
}

/**
 * 租户配置表单接口
 */
export interface TenantConfigForm {
  maxUsers: number;
  allowCustomBranding: boolean;
  enableAPIAccess: boolean;
  defaultRole: string;
  sessionTimeout: number;
  features: {
    analytics: boolean;
    customDomain: boolean;
    sso: boolean;
    auditLog: boolean;
  };
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'csv' | 'xlsx';

/**
 * 状态操作配置
 */
export interface StatusAction {
  type: 'activate' | 'deactivate' | 'suspend';
  label: string;
  description: string;
  variant: 'default' | 'destructive' | 'secondary';
  icon?: React.ReactNode;
  requiresConfirmation: boolean;
  confirmationMessage: string;
}

/**
 * 表格列配置
 */
export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (tenant: Tenant) => React.ReactNode;
}

/**
 * 空状态配置
 */
export interface EmptyState {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * 创建租户请求接口
 */
export interface CreateTenantRequest {
  name: string;
  code: string;
  status?: TenantStatus;
  settings?: TenantSettings;
  adminUser?: {
    email: string;
    password: string;
    name: string;
  };
}

/**
 * 更新租户请求接口
 */
export interface UpdateTenantRequest {
  name?: string;
  status?: TenantStatus;
  settings?: TenantSettings;
}

/**
 * 租户验证错误接口
 */
export interface TenantValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * 租户管理 Hook 返回类型
 */
export interface UseTenantManagementReturn {
  tenants: Tenant[];
  loading: boolean;
  pagination: PaginationInfo;
  fetchTenants: (filters: TenantFilters) => Promise<void>;
  createTenant: (data: TenantFormData) => Promise<boolean>;
  updateTenant: (id: string, data: TenantFormData) => Promise<boolean>;
  deleteTenant: (id: string) => Promise<boolean>;
  toggleTenantStatus: (id: string, status: TenantStatus) => Promise<boolean>;
  error?: string;
  // 新增返回类型
  statistics?: TenantStatisticsData;
  selectedTenants: Set<string>;
  fetchStatistics: () => Promise<void>;
  batchOperateTenants: (
    operation: 'activate' | 'deactivate' | 'suspend' | 'delete'
  ) => Promise<boolean>;
  toggleTenantSelection: (id: string) => void;
  toggleAllSelection: () => void;
  clearTenantSelection: () => void;
  exportTenants: (format?: ExportFormat) => Promise<void>;
}

/**
 * 租户过滤 Hook 返回类型
 */
export interface UseTenantFiltersReturn {
  filters: TenantFilters;
  searchFilters: (newFilters: Partial<TenantFilters>) => void;
  updatePagination: (pagination: Partial<TenantFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * 租户表单验证规则
 */
export interface TenantFormValidation {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  code: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern: RegExp;
  };
}

/**
 * 租户操作权限
 */
export interface TenantPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageStatus: boolean;
  canConfigure: boolean;
}
