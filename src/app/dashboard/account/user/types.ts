export interface User {
  id: number;
  username: string;
  phone?: string;
  email: string;
  realName?: string;
  avatar?: string;
  roleId: number;
  tenantId?: number;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  status: 'active' | 'inactive' | 'locked';
  isSuperAdmin?: boolean;
  metadata?: Record<string, any>;
  role?: {
    id: number;
    name: string;
    code: string;
  };
  tenant?: {
    id: number;
    name: string;
    code: string;
  };
  organizations?: Array<{
    id: number;
    organizationId: number;
    position: string;
    isMain: boolean;
    organization: {
      id: number;
      name: string;
      code: string;
    };
  }>;
}

export interface Role {
  id: number;
  name: string;
  code: string;
}

export interface Tenant {
  id: number;
  name: string;
  code: string;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
}

export interface UserFilters {
  search?: string;
  username?: string;
  phone?: string;
  email?: string;
  realName?: string;
  roleId?: number;
  status?: 'all' | 'active' | 'inactive' | 'locked';
  tenantId?: number;
  organizationId?: number;
  dateRange?: { from: Date; to: Date } | undefined;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  include?: string[];
  statistics?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserFormData {
  username: string;
  phone?: string;
  email: string;
  realName?: string;
  password?: string;
  roleId: number;
  tenantId?: number;
  organizationIds?: number[];
  status?: 'active' | 'inactive' | 'locked';
  metadata?: Record<string, any>;
  sendWelcomeEmail?: boolean;
}

export interface UserStatistics {
  overview: {
    total: number;
    active: number;
    inactive: number;
    locked: number;
    activeRate: number;
  };
  engagement: {
    recentLogins: number;
    recentLoginRate: number;
  };
  growth: {
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    today: number;
    week: number;
  };
  distribution: {
    active: number;
    inactive: number;
    locked: number;
  };
}

export interface UserSession {
  id: number;
  sessionId: string;
  deviceId?: string;
  deviceType?: string;
  deviceName?: string;
  platform?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  isExpired: boolean;
  duration?: number;
  createdAt: string;
  lastAccessedAt: string;
  expiresAt: string;
}

export interface UserManagementState {
  users: User[];
  roles: Role[];
  tenants?: Tenant[];
  organizations?: Organization[];
  loading: boolean;
  pagination: PaginationInfo;
  filters: UserFilters;
  statistics?: UserStatistics;
  selectedUsers: number[];
}

export interface UserManagementActions {
  fetchUsers: (filters: UserFilters) => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchTenants?: () => Promise<void>;
  fetchOrganizations?: () => Promise<void>;
  fetchStatistics?: (tenantId?: number) => Promise<void>;
  createUser: (data: UserFormData) => Promise<boolean>;
  updateUser: (id: number, data: UserFormData) => Promise<boolean>;
  deleteUser: (id: number, reason?: string) => Promise<boolean>;
  batchOperateUsers: (
    operation: string,
    userIds: number[],
    data?: any
  ) => Promise<boolean>;
  changeUserStatus: (
    id: number,
    status: string,
    reason?: string
  ) => Promise<boolean>;
  resetUserPassword: (
    id: number,
    newPassword: string,
    sendEmail?: boolean
  ) => Promise<boolean>;
  getUserSessions: (id: number) => Promise<UserSession[]>;
  terminateUserSessions: (
    id: number,
    excludeCurrent?: boolean
  ) => Promise<boolean>;
  updateFilters: (newFilters: Partial<UserFilters>) => void;
  clearFilters: () => void;
  toggleUserSelection: (userId: number) => void;
  selectAllUsers: () => void;
  clearUserSelection: () => void;
}

export type UserDialogType = 'create' | 'edit' | null;

export interface UserDialogState {
  type: UserDialogType;
  user: User | null;
  open: boolean;
}
