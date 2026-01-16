/**
 * 服务记录管理 - 常量配置
 */

import {
  FileText,
  Calendar,
  Clock,
  Thermometer,
  Activity,
  AlertTriangle
} from 'lucide-react';

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
 * 服务状态选项
 */
export const STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
] as const;

/**
 * 服务状态映射
 */
export const STATUS_MAP = {
  active: {
    label: '进行中',
    variant: 'default' as const,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  completed: {
    label: '已完成',
    variant: 'secondary' as const,
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  cancelled: {
    label: '已取消',
    variant: 'destructive' as const,
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  }
} as const;

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS = {
  search: '',
  status: 'all' as const,
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10
} as const;

/**
 * 不适症标签选项
 */
export const DISCOMFORT_TAGS = [
  { label: '无', value: 'none', icon: null },
  { label: '头晕', value: 'dizzy', icon: Activity },
  { label: '胸闷', value: 'chest_tight', icon: AlertTriangle },
  { label: '乏力', value: 'weak', icon: Activity },
  { label: '肩颈疼痛', value: 'neck_pain', icon: Activity },
  { label: '腰痛', value: 'back_pain', icon: Activity },
  { label: '失眠', value: 'insomnia', icon: Clock }
] as const;

/**
 * 血压等级定义
 */
export const BLOOD_PRESSURE_LEVELS = {
  normal: {
    label: '正常',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    condition: (systolic: number, diastolic: number) =>
      systolic < 140 && diastolic < 90
  },
  warning: {
    label: '偏高',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    condition: (systolic: number, diastolic: number) =>
      (systolic >= 140 && systolic < 160) ||
      (diastolic >= 90 && diastolic < 100)
  },
  danger: {
    label: '危险',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    condition: (systolic: number, diastolic: number) =>
      systolic >= 160 || diastolic >= 100,
    message: '血压过高，禁止理疗'
  }
} as const;

/**
 * 理疗时长选项(分钟)
 */
export const DURATION_OPTIONS = [
  { label: '30分钟', value: 30 },
  { label: '45分钟', value: 45 },
  { label: '60分钟', value: 60 },
  { label: '90分钟', value: 90 },
  { label: '120分钟', value: 120 }
] as const;

/**
 * 理疗温度选项(℃)
 */
export const TEMPERATURE_OPTIONS = [
  { label: '38℃', value: 38 },
  { label: '40℃', value: 40 },
  { label: '42℃', value: 42 },
  { label: '45℃', value: 45 },
  { label: '48℃', value: 48 },
  { label: '50℃', value: 50 }
] as const;

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
    key: 'customer',
    title: '客户信息',
    className: 'font-medium min-w-[200px] max-w-[250px]'
  },
  {
    key: 'serviceInfo',
    title: '服务信息',
    className: 'font-medium min-w-[180px] max-w-[220px]'
  },
  {
    key: 'bloodPressure',
    title: '血压',
    className: 'text-center w-[120px]'
  },
  {
    key: 'vitals',
    title: '理疗参数',
    className: 'min-w-[150px] max-w-[180px]'
  },
  {
    key: 'consultant',
    title: '顾问',
    className: 'text-center w-[100px]'
  },
  {
    key: 'status',
    title: '状态',
    className: 'text-center w-[100px]'
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
    CREATE: '服务记录创建成功',
    UPDATE: '服务记录更新成功',
    DELETE: '服务记录删除成功'
  },
  ERROR: {
    CREATE: '创建服务记录失败',
    UPDATE: '更新服务记录失败',
    DELETE: '删除服务记录失败',
    FETCH_RECORDS: '获取服务记录失败',
    HIGH_BLOOD_PRESSURE: '血压过高，禁止创建理疗记录'
  },
  EMPTY: {
    RECORDS: '暂无服务记录',
    ARCHIVE: '未关联档案',
    CONSULTANT: '未分配'
  },
  CONFIRM: {
    DELETE: (count: number) =>
      `确定要删除选中的 ${count} 条服务记录吗？此操作不可撤销。`,
    DELETE_SINGLE: (customerNo: string) =>
      `确定要删除客户 "${customerNo}" 的服务记录吗？此操作不可撤销。`
  }
} as const;

/**
 * 视图模式
 */
export type ViewMode = 'table' | 'archive-group';

export const VIEW_MODE_OPTIONS = [
  { label: '列表视图', value: 'table' as const, icon: FileText },
  { label: '档案分组', value: 'archive-group' as const, icon: Calendar }
] as const;
