/**
 * 租户管理相关常量定义
 */

/**
 * 对话框类型常量
 */
export const DIALOG_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  STATUS: 'status',
  CONFIG: 'config'
} as const;

/**
 * 租户状态常量
 */
export const TENANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const;

/**
 * 租户状态配置
 */
export const TENANT_STATUS_CONFIG = {
  [TENANT_STATUS.ACTIVE]: {
    label: '正常',
    color: 'text-green-600 bg-green-50 border-green-200',
    description: '租户正常运行中',
    canEdit: true,
    canDelete: true
  },
  [TENANT_STATUS.INACTIVE]: {
    label: '停用',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: '租户已停用，新用户无法注册',
    canEdit: true,
    canDelete: true
  },
  [TENANT_STATUS.SUSPENDED]: {
    label: '暂停',
    color: 'text-red-600 bg-red-50 border-red-200',
    description: '租户已暂停，所有用户无法登录',
    canEdit: true,
    canDelete: false
  }
} as const;

/**
 * 分页配置
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
  keyword: undefined,
  status: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const
} as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * 排序选项
 */
export const SORT_OPTIONS = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'name', label: '租户名称' },
  { value: 'code', label: '租户代码' },
  { value: 'status', label: '状态' }
] as const;

/**
 * 表格列配置
 */
export const TABLE_COLUMNS = [
  { key: 'name', title: '租户名称', sortable: true },
  { key: 'code', title: '租户代码', sortable: true },
  { key: 'status', title: '状态', sortable: true },
  { key: 'userCount', title: '用户数量', sortable: false },
  { key: 'createdAt', title: '创建时间', sortable: true },
  { key: 'actions', title: '操作', sortable: false }
] as const;

/**
 * 状态操作配置
 */
export const STATUS_ACTIONS = {
  activate: {
    type: 'activate' as const,
    label: '启用',
    description: '确定要启用此租户吗？启用后租户可以正常使用。',
    variant: 'default' as const,
    requiresConfirmation: true,
    confirmationMessage: '启用后，该租户的所有用户将恢复正常访问权限。'
  },
  deactivate: {
    type: 'deactivate' as const,
    label: '停用',
    description: '确定要停用此租户吗？停用后新用户无法注册。',
    variant: 'secondary' as const,
    requiresConfirmation: true,
    confirmationMessage: '停用后，该租户的新用户将无法注册，但现有用户仍可登录。'
  },
  suspend: {
    type: 'suspend' as const,
    label: '暂停',
    description: '确定要暂停此租户吗？暂停后将立即踢出所有用户。',
    variant: 'destructive' as const,
    requiresConfirmation: true,
    confirmationMessage: '暂停后，该租户的所有用户将被立即踢出系统且无法重新登录。'
  }
} as const;

/**
 * 表单验证规则
 */
export const FORM_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 200,
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+$/
  },
  code: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  maxUsers: {
    min: 1,
    max: 1000000
  },
  sessionTimeout: {
    min: 300, // 5分钟
    max: 86400 // 24小时
  }
} as const;

/**
 * 表单验证错误消息
 */
export const VALIDATION_MESSAGES = {
  name: {
    required: '租户名称不能为空',
    minLength: '租户名称至少需要2个字符',
    maxLength: '租户名称不能超过200个字符',
    pattern: '租户名称只能包含中文、英文、数字、空格和常用符号'
  },
  code: {
    required: '租户代码不能为空',
    minLength: '租户代码至少需要2个字符',
    maxLength: '租户代码不能超过100个字符',
    pattern: '租户代码只能包含字母、数字、下划线和横线',
    unique: '租户代码已存在'
  },
  maxUsers: {
    min: '最大用户数至少为1',
    max: '最大用户数不能超过100万'
  },
  sessionTimeout: {
    min: '会话超时时间至少为5分钟',
    max: '会话超时时间不能超过24小时'
  }
} as const;

/**
 * API 端点
 */
export const API_ENDPOINTS = {
  TENANTS: '/api/tenants',
  TENANT_STATS: '/api/tenants/stats',
  TENANT_USERS: '/api/tenants/:id/users',
  TENANT_CONFIG: '/api/tenants/:id/config'
} as const;

/**
 * 错误码
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_CODE_EXISTS: 'TENANT_CODE_EXISTS',
  TENANT_HAS_USERS: 'TENANT_HAS_USERS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  CREATE: '租户创建成功',
  UPDATE: '租户更新成功',
  DELETE: '租户删除成功',
  ACTIVATE: '租户启用成功',
  DEACTIVATE: '租户停用成功',
  SUSPEND: '租户暂停成功'
} as const;

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  CREATE_FAILED: '创建租户失败',
  UPDATE_FAILED: '更新租户失败',
  DELETE_FAILED: '删除租户失败',
  STATUS_TOGGLE_FAILED: '切换租户状态失败',
  LOAD_FAILED: '加载租户列表失败',
  NETWORK_ERROR: '网络连接错误，请稍后重试',
  PERMISSION_DENIED: '权限不足，无法执行此操作'
} as const;

/**
 * 默认租户设置
 */
export const DEFAULT_TENANT_SETTINGS = {
  maxUsers: 100,
  allowCustomBranding: true,
  enableAPIAccess: false,
  defaultRole: 'user',
  sessionTimeout: 3600, // 1小时
  features: {
    analytics: true,
    customDomain: false,
    sso: false,
    auditLog: true
  }
} as const;

/**
 * 搜索防抖延迟（毫秒）
 */
export const SEARCH_DEBOUNCE_DELAY = 500;

/**
 * 表格加载状态配置
 */
export const TABLE_LOADING_CONFIG = {
  skeletonRows: 5,
  animationDuration: 1500
} as const;

/**
 * 导出配置
 */
export const EXPORT_CONFIG = {
  supportedFormats: ['csv', 'xlsx', 'json'],
  maxExportRows: 10000,
  defaultFormat: 'csv'
} as const;