/**
 * 组织架构管理模块 - 类型定义
 */

/**
 * 组织实体
 */
export interface Organization {
  id: string;
  tenantId: number;
  name: string;
  code: string | null;
  path: string | null;
  parentId: string | null;
  leaderId: number | null;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  userCount: string | number;
  childCount?: number;
}

/**
 * 组织树节点（带子节点）
 */
export interface OrganizationTreeNode extends Organization {
  children: OrganizationTreeNode[];
  leader?: {
    id: number;
    username: string;
    realName: string | null;
    email: string;
  };
}

/**
 * 组织用户关联
 */
export interface UserOrganization {
  id: number;
  username: string;
  realName: string | null;
  email: string;
  phone: string | null;
  avatar: string;
  status: string;
  position: string | null;
  isMain: boolean;
  joinedAt: string;
}

/**
 * 用户信息（用于选择负责人）
 */
export interface User {
  id: number;
  username: string;
  realName: string | null;
  email: string;
  avatar?: string;
}

/**
 * 组织筛选条件
 */
export interface OrganizationFilters {
  search?: string;
  name?: string;
  code?: string;
  status?: 'all' | 'active' | 'inactive';
  parentId?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 组织表单数据
 */
export interface OrganizationFormData {
  name: string;
  code?: string;
  parentId?: string | null;
  leaderId?: number | null;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

/**
 * 添加用户到组织表单数据
 */
export interface AddUserToOrganizationData {
  userId: number;
  position?: string;
  isMain?: boolean;
}

/**
 * 对话框状态
 */
export type OrganizationDialogType = 'create' | 'edit' | 'delete' | null;

export interface OrganizationDialogState {
  type: OrganizationDialogType;
  organization: Organization | null;
  open: boolean;
}

/**
 * 用户分配对话框状态
 */
export interface UserAssignDialogState {
  open: boolean;
  organizationId: string | null;
  organizationName: string | null;
}

/**
 * 视图模式
 */
export type ViewMode = 'tree' | 'table';

/**
 * 组织管理状态
 */
export interface OrganizationManagementState {
  organizations: Organization[];
  tree: OrganizationTreeNode[];
  users: User[];
  loading: boolean;
  pagination: PaginationInfo;
  filters: OrganizationFilters;
  viewMode: ViewMode;
}

/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  message?: string;
  pager?: PaginationInfo;
  success?: boolean;
  error?: {
    message?: string;
  };
}
