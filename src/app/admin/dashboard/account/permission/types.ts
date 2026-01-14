// 权限类型枚举
export type PermissionType = 'menu' | 'page' | 'button' | 'api' | 'data';

// 视图模式
export type ViewMode = 'tree' | 'table';

// 增强的权限实体
export interface Permission {
  id: number;
  name: string;
  code: string;
  type: PermissionType;
  description?: string;
  parentId?: number | null;
  sortOrder: number;
  isSystem: boolean;
  status: 'active' | 'inactive' | 'deleted';
  frontPath?: string;
  apiPath?: string;
  method?: string;
  resourceType?: string;
  roleUsageCount?: number; // 使用此权限的角色数
  createdAt: string;
  updatedAt?: string;
}

// 权限树节点
export interface PermissionTreeNode extends Permission {
  children: PermissionTreeNode[];
  path?: string; // 层级路径 (如: 系统管理 > 用户管理)
}

export interface PermissionFilters {
  name?: string;
  code?: string;
  type?: PermissionType | 'all';
  isSystem?: boolean | 'all';
  parentId?: number | 'all';
  dateRange?: { from: Date; to: Date } | undefined;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PermissionFormData {
  name: string;
  code: string;
  type: PermissionType;
  description?: string;
  parentId?: number | null;
  sortOrder?: number;
  frontPath?: string;
  apiPath?: string;
  method?: string;
  resourceType?: string;
}

export interface PermissionManagementState {
  permissions: Permission[];
  loading: boolean;
  pagination: PaginationInfo;
  filters: PermissionFilters;
}

export interface PermissionManagementActions {
  fetchPermissions: (filters: PermissionFilters) => Promise<void>;
  createPermission: (data: PermissionFormData) => Promise<boolean>;
  updatePermission: (id: number, data: PermissionFormData) => Promise<boolean>;
  deletePermission: (id: number) => Promise<boolean>;
  updateFilters: (newFilters: Partial<PermissionFilters>) => void;
  clearFilters: () => void;
}

export type PermissionDialogType = 'create' | 'edit' | null;

export interface PermissionDialogState {
  type: PermissionDialogType;
  permission: Permission | null;
  open: boolean;
  parentPermission?: Permission | null; // 创建子权限时的父权限
}

// 权限使用情况
export interface PermissionUsage {
  permissionId: number;
  permissionName: string;
  permissionCode: string;
  roles: Array<{
    id: number;
    name: string;
    code: string;
    userCount: number;
  }>;
  totalRoles: number;
  totalUsers: number;
}

// 权限模板
export interface PermissionTemplate {
  id: number;
  name: string;
  description?: string;
  permissionIds: number[];
  permissionCount?: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// 权限模板对话框状态
export interface PermissionTemplateDialogState {
  open: boolean;
  mode: 'manage' | 'select' | 'preview';
  template?: PermissionTemplate;
  targetRoleId?: number; // 应用模板的目标角色
}
