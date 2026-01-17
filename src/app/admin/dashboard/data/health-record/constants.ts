/**
 * 健康档案管理 - 常量配置
 */

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
 * 档案状态选项
 */
export const ARCHIVE_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '活跃', value: 'active' },
  { label: '未激活', value: 'inactive' },
  { label: '待审核', value: 'pending' }
] as const;

/**
 * 档案状态映射
 */
export const ARCHIVE_STATUS_MAP = {
  active: {
    label: '活跃',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  inactive: {
    label: '未激活',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  pending: {
    label: '待审核',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  }
} as const;

/**
 * 性别选项
 */
export const GENDER_OPTIONS = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
] as const;

/**
 * 性别映射
 */
export const GENDER_MAP = {
  male: {
    label: '男',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '♂'
  },
  female: {
    label: '女',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    icon: '♀'
  }
} as const;

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS = {
  search: '',
  status: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10
} as const;

/**
 * 表格列配置
 */
export const TABLE_COLUMNS = [
  {
    key: 'customerNo',
    title: '客户编号',
    className: 'text-center w-[130px] font-mono text-sm font-medium'
  },
  {
    key: 'name',
    title: '姓名',
    className: 'font-medium min-w-[100px]'
  },
  {
    key: 'gender',
    title: '性别',
    className: 'text-center w-[60px]'
  },
  {
    key: 'age',
    title: '年龄',
    className: 'text-center w-[60px]'
  },
  {
    key: 'contact',
    title: '联系电话',
    className: 'text-center min-w-[120px]'
  },
  {
    key: 'status',
    title: '状态',
    className: 'text-center w-[80px]'
  },
  {
    key: 'createdAt',
    title: '创建时间',
    className: 'text-center w-[160px]'
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
    CREATE: '健康档案创建成功',
    UPDATE: '健康档案更新成功',
    DELETE: '健康档案删除成功'
  },
  ERROR: {
    CREATE: '创建健康档案失败',
    UPDATE: '更新健康档案失败',
    DELETE: '删除健康档案失败',
    FETCH_ARCHIVES: '获取健康档案失败',
    DUPLICATE_CUSTOMER_NO: '该客户编号已存在'
  },
  EMPTY: {
    ARCHIVES: '暂无健康档案',
    USER: '未关联用户'
  },
  CONFIRM: {
    DELETE: (count: number) =>
      `确定要删除选中的 ${count} 条健康档案吗？此操作不可撤销。`,
    DELETE_SINGLE: (name: string) =>
      `确定要删除 "${name}" 的健康档案吗？此操作不可撤销。`
  }
} as const;
