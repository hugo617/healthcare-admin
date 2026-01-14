/**
 * 组织架构管理模块 - 常量配置
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
 * 组织状态选项
 */
export const STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' }
] as const;

/**
 * 组织状态映射
 */
export const STATUS_MAP = {
  active: {
    label: '启用',
    variant: 'default' as const,
    color: 'text-green-700 bg-green-100'
  },
  inactive: {
    label: '禁用',
    variant: 'secondary' as const,
    color: 'text-gray-700 bg-gray-100'
  }
} as const;

/**
 * 视图模式选项
 */
export const VIEW_MODE_OPTIONS = [
  { label: '树形视图', value: 'tree' },
  { label: '表格视图', value: 'table' }
] as const;

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS = {
  name: '',
  code: '',
  status: 'all' as const,
  parentId: undefined,
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
    className: 'text-center w-[80px] font-mono text-sm font-medium'
  },
  {
    key: 'name',
    title: '组织名称',
    className: 'font-medium min-w-[200px]'
  },
  {
    key: 'code',
    title: '组织编码',
    className: 'text-muted-foreground min-w-[120px]'
  },
  {
    key: 'leader',
    title: '负责人',
    className: 'min-w-[150px]'
  },
  {
    key: 'userCount',
    title: '成员数',
    className: 'text-center w-[100px]'
  },
  {
    key: 'childCount',
    title: '子组织数',
    className: 'text-center w-[100px]'
  },
  {
    key: 'status',
    title: '状态',
    className: 'text-center w-[100px]'
  },
  {
    key: 'sortOrder',
    title: '排序',
    className: 'text-center w-[80px]'
  },
  {
    key: 'actions',
    title: '操作',
    className: 'text-center w-[150px]'
  }
] as const;

/**
 * 对话框类型
 */
export const DIALOG_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete'
} as const;

/**
 * 消息文案
 */
export const MESSAGES = {
  SUCCESS: {
    CREATE: '组织创建成功',
    UPDATE: '组织更新成功',
    DELETE: '组织删除成功',
    ADD_USER: '用户添加到组织成功',
    REMOVE_USER: '用户从组织移除成功'
  },
  ERROR: {
    CREATE: '创建组织失败',
    UPDATE: '更新组织失败',
    DELETE: '删除组织失败',
    ADD_USER: '添加用户失败',
    REMOVE_USER: '移除用户失败',
    FETCH: '获取组织列表失败',
    FETCH_TREE: '获取组织树失败',
    FETCH_USERS: '获取用户列表失败'
  },
  CONFIRM: {
    DELETE: (name: string, userCount: number, childCount: number) => {
      const reasons = [];
      if (childCount > 0) reasons.push(`${childCount} 个子组织`);
      if (userCount > 0) reasons.push(`${userCount} 个成员`);
      const reasonText =
        reasons.length > 0 ? `该组织包含 ${reasons.join('、')}，` : '';
      return `确定要删除组织 "${name}" 吗？${reasonText}此操作不可撤销。`;
    },
    REMOVE_USER: (username: string) =>
      `确定要将用户 "${username}" 从该组织移除吗？`
  },
  EMPTY: {
    ORGANIZATIONS: '暂无组织数据',
    USERS: '暂无成员',
    LEADER: '未设置',
    CHILDREN: '无'
  }
} as const;

/**
 * 职位选项
 */
export const POSITION_OPTIONS = [
  '总经理',
  '副总经理',
  '部门经理',
  '副经理',
  '主管',
  '组长',
  '员工',
  '实习生',
  '顾问'
] as const;
