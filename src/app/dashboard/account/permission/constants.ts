import {
  Menu,
  FileText,
  MousePointer,
  Globe,
  Database,
  Network,
  List
} from 'lucide-react';

interface FilterField {
  key: string;
  type: string;
  label: string;
  placeholder: string;
  width: string;
}

/**
 * 默认分页配置
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
} as const;

/**
 * 分页大小选项
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS = {
  name: '',
  code: '',
  dateRange: undefined,
  page: 1,
  limit: 10
} as const;

/**
 * 筛选字段配置
 */
export const FILTER_FIELDS: FilterField[] = [
  {
    key: 'name',
    type: 'text',
    label: '权限名称',
    placeholder: '搜索权限名称...',
    width: 'w-60'
  },
  {
    key: 'code',
    type: 'text',
    label: '权限标识',
    placeholder: '搜索权限标识...',
    width: 'w-60'
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '创建时间',
    placeholder: '选择时间范围',
    width: 'w-60'
  }
];

/**
 * 表格列配置（增强）
 */
export const TABLE_COLUMNS = [
  {
    key: 'index',
    title: 'ID',
    className: 'text-center w-[60px] font-mono text-sm font-medium'
  },
  {
    key: 'type',
    title: '类型',
    className: 'w-[100px]'
  },
  {
    key: 'name',
    title: '权限名称',
    className: 'font-medium'
  },
  {
    key: 'code',
    title: '权限标识',
    className: 'font-mono text-sm min-w-[180px]'
  },
  {
    key: 'roleUsage',
    title: '使用角色',
    className: 'text-center w-[100px]'
  },
  {
    key: 'frontPath',
    title: '前端路径',
    className: 'font-mono text-xs text-muted-foreground min-w-[150px]'
  },
  {
    key: 'apiPath',
    title: 'API路径',
    className: 'font-mono text-xs text-muted-foreground min-w-[180px]'
  },
  {
    key: 'isSystem',
    title: '系统权限',
    className: 'w-[100px]'
  },
  {
    key: 'actions',
    title: '操作',
    className: 'text-center w-[120px]'
  }
] as const;

/**
 * 对话框类型
 */
export const DIALOG_TYPES = {
  CREATE: 'create',
  EDIT: 'edit'
} as const;

/**
 * 权限类型配置
 */
export const PERMISSION_TYPE_CONFIG = {
  menu: {
    label: '菜单',
    icon: Menu,
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  page: {
    label: '页面',
    icon: FileText,
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  button: {
    label: '按钮',
    icon: MousePointer,
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  api: {
    label: 'API',
    icon: Globe,
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  data: {
    label: '数据',
    icon: Database,
    color: 'bg-pink-50 text-pink-700 border-pink-200'
  }
} as const;

/**
 * HTTP 方法配置
 */
export const HTTP_METHOD_CONFIG = {
  GET: { label: 'GET', color: 'bg-green-100 text-green-700' },
  POST: { label: 'POST', color: 'bg-blue-100 text-blue-700' },
  PUT: { label: 'PUT', color: 'bg-orange-100 text-orange-700' },
  DELETE: { label: 'DELETE', color: 'bg-red-100 text-red-700' },
  PATCH: { label: 'PATCH', color: 'bg-purple-100 text-purple-700' }
} as const;

/**
 * 系统权限配置
 */
export const SYSTEM_PERMISSION_CONFIG = {
  prefixes: ['system.', 'admin.', 'account.'],
  deleteDisabledMessage: '系统权限不可删除',
  editWarningMessage: '修改系统权限可能影响系统正常运行'
} as const;

/**
 * 视图模式选项
 */
export const VIEW_MODE_OPTIONS = [
  { label: '树形视图', value: 'tree', icon: Network },
  { label: '列表视图', value: 'table', icon: List }
] as const;

/**
 * 消息文案
 */
export const MESSAGES = {
  SUCCESS: {
    CREATE: '权限创建成功',
    UPDATE: '权限更新成功',
    DELETE: '权限删除成功'
  },
  ERROR: {
    CREATE: '创建权限失败',
    UPDATE: '更新权限失败',
    DELETE: '删除权限失败',
    FETCH_PERMISSIONS: '获取权限列表失败'
  },
  EMPTY: {
    PERMISSIONS: '暂无权限数据',
    DESCRIPTION: '暂无描述'
  },
  CONFIRM: {
    DELETE: (name: string) => `确定要删除权限 "${name}" 吗？此操作不可撤销。`
  },
  SYSTEM_PERMISSION: {
    DELETE_DENIED: '系统权限不能删除',
    EDIT_WARNING: '这是系统权限,修改可能影响系统功能'
  },
  USAGE: {
    LOAD_FAILED: '加载权限使用情况失败',
    TITLE: (name: string) => `权限使用情况 - ${name}`,
    NO_USAGE: '此权限未被任何角色使用'
  },
  TEMPLATE: {
    CREATE_SUCCESS: '权限模板创建成功',
    UPDATE_SUCCESS: '权限模板更新成功',
    DELETE_SUCCESS: '权限模板删除成功',
    SYSTEM_TEMPLATE_DELETE_DENIED: '系统模板不能删除'
  }
} as const;
