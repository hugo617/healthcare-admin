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
 * 用户状态选项
 */
export const STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'inactive' },
  { label: '锁定', value: 'locked' }
] as const;

/**
 * 用户状态映射
 */
export const STATUS_MAP = {
  active: {
    label: '正常',
    variant: 'default' as const,
    color: 'text-green-700'
  },
  inactive: {
    label: '禁用',
    variant: 'destructive' as const,
    color: 'text-red-700'
  },
  locked: {
    label: '锁定',
    variant: 'secondary' as const,
    color: 'text-orange-700'
  }
} as const;

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS = {
  username: '',
  phone: '',
  email: '',
  roleId: undefined,
  status: 'all' as const,
  dateRange: undefined,
  page: 1,
  limit: 10
} as const;

/**
 * 表格列配置
 */
export const TABLE_COLUMNS = [
  {
    key: 'index',
    title: 'ID',
    className: 'text-center w-[60px] font-mono text-sm font-medium'
  },
  {
    key: 'avatar',
    title: '头像',
    className: 'text-center w-[80px]'
  },
  {
    key: 'userInfo',
    title: '用户信息',
    className: 'font-medium min-w-[250px] max-w-[300px]'
  },
  {
    key: 'contact',
    title: '联系方式',
    className: 'font-medium min-w-[250px] max-w-[300px]'
  },
  {
    key: 'organizations',
    title: '所属组织',
    className: 'font-medium min-w-[200px] max-w-[250px]'
  },
  {
    key: 'role',
    title: '角色',
    className: 'min-w-[150px] max-w-[200px]'
  },
  {
    key: 'status',
    title: '状态',
    className: 'text-center w-[100px]'
  },
  {
    key: 'activity',
    title: '活动信息',
    className: 'font-medium min-w-[200px] max-w-[250px]'
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
 * 消息文案
 */
export const MESSAGES = {
  SUCCESS: {
    CREATE: '用户创建成功',
    UPDATE: '用户更新成功',
    DELETE: '用户删除成功',
    ENABLE: '用户启用成功',
    DISABLE: '用户禁用成功'
  },
  ERROR: {
    CREATE: '创建用户失败',
    UPDATE: '更新用户失败',
    DELETE: '删除用户失败',
    ENABLE: '启用用户失败',
    DISABLE: '禁用用户失败',
    FETCH_USERS: '获取用户列表失败',
    FETCH_ROLES: '获取角色列表失败'
  },
  EMPTY: {
    USERS: '暂无用户数据',
    ROLE: '未分配',
    LAST_LOGIN: '从未登录'
  },
  CONFIRM: {
    DELETE: (username: string) =>
      `确定要删除用户 "${username}" 吗？此操作不可撤销。`,
    ENABLE: (username: string) => `确定要启用用户 "${username}" 吗？`,
    DISABLE: (username: string) =>
      `确定要禁用用户 "${username}" 吗？禁用后该用户将无法登录系统。`
  }
} as const;
