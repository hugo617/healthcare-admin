/**
 * 健康记录管理 - 常量配置
 */

import {
  Activity,
  TrendingUp,
  Thermometer,
  Scale,
  Heart,
  Droplet
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
 * 血糖类型选项
 */
export const BLOOD_SUGAR_TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '空腹血糖', value: 'fasting' },
  { label: '餐后血糖', value: 'postprandial' },
  { label: '随机血糖', value: 'random' }
] as const;

/**
 * 血糖类型映射
 */
export const BLOOD_SUGAR_TYPE_MAP = {
  fasting: {
    label: '空腹',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  postprandial: {
    label: '餐后',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  random: {
    label: '随机',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
} as const;

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS = {
  search: '',
  bloodSugarType: 'all' as const,
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10
} as const;

/**
 * 血压等级定义
 */
export const BLOOD_PRESSURE_LEVELS = {
  normal: {
    label: '正常',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    condition: (systolic: number, diastolic: number) =>
      systolic < 120 && diastolic < 80
  },
  elevated: {
    label: '偏高',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    condition: (systolic: number, diastolic: number) =>
      systolic >= 120 && systolic < 140 && diastolic < 90
  },
  high1: {
    label: '高血压I级',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    condition: (systolic: number, diastolic: number) =>
      (systolic >= 140 && systolic < 160) ||
      (diastolic >= 90 && diastolic < 100)
  },
  high2: {
    label: '高血压II级',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    condition: (systolic: number, diastolic: number) =>
      (systolic >= 160 && systolic < 180) ||
      (diastolic >= 100 && diastolic < 110)
  },
  high3: {
    label: '高血压III级',
    color: 'text-red-800',
    bgColor: 'bg-red-200',
    condition: (systolic: number, diastolic: number) =>
      systolic >= 180 || diastolic >= 110
  }
} as const;

/**
 * 血糖等级定义(mmol/L)
 */
export const BLOOD_SUGAR_LEVELS = {
  low: {
    label: '低血糖',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    condition: (value: number, type: string) => {
      if (type === 'fasting') return value < 3.9;
      return value < 2.8;
    }
  },
  normal: {
    label: '正常',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    condition: (value: number, type: string) => {
      if (type === 'fasting') return value >= 3.9 && value <= 6.1;
      if (type === 'postprandial') return value >= 4.4 && value <= 7.8;
      return value >= 3.9 && value <= 7.8;
    }
  },
  impaired: {
    label: '糖耐量受损',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    condition: (value: number, type: string) => {
      if (type === 'fasting') return value > 6.1 && value < 7.0;
      if (type === 'postprandial') return value > 7.8 && value < 11.1;
      return false;
    }
  },
  high: {
    label: '高血糖',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    condition: (value: number, type: string) => {
      if (type === 'fasting') return value >= 7.0;
      if (type === 'postprandial') return value >= 11.1;
      return value >= 11.1;
    }
  }
} as const;

/**
 * 心率等级定义(bpm)
 */
export const HEART_RATE_LEVELS = {
  low: {
    label: '心动过缓',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    condition: (value: number) => value < 60
  },
  normal: {
    label: '正常',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    condition: (value: number) => value >= 60 && value <= 100
  },
  high: {
    label: '心动过速',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    condition: (value: number) => value > 100
  }
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
    key: 'user',
    title: '用户',
    className: 'font-medium min-w-[150px] max-w-[200px]'
  },
  {
    key: 'recordDate',
    title: '记录日期',
    className: 'text-center w-[120px]'
  },
  {
    key: 'bloodPressure',
    title: '血压',
    className: 'text-center w-[120px]'
  },
  {
    key: 'bloodSugar',
    title: '血糖',
    className: 'text-center w-[120px]'
  },
  {
    key: 'vitals',
    title: '其他指标',
    className: 'min-w-[150px] max-w-[200px]'
  },
  {
    key: 'notes',
    title: '备注',
    className: 'min-w-[150px] max-w-[250px]'
  },
  {
    key: 'actions',
    title: '操作',
    className: 'text-center w-[120px]'
  }
] as const;

/**
 * 时间范围选项
 */
export const TIME_RANGE_OPTIONS = [
  { label: '最近一周', value: 'week' as const, days: 7 },
  { label: '最近一月', value: 'month' as const, days: 30 },
  { label: '最近三月', value: 'quarter' as const, days: 90 },
  { label: '最近一年', value: 'year' as const, days: 365 }
] as const;

/**
 * 趋势图表类型选项
 */
export const TREND_TYPE_OPTIONS = [
  { label: '全部指标', value: 'all' as const, icon: Activity },
  { label: '血压趋势', value: 'bloodPressure' as const, icon: Heart },
  { label: '血糖趋势', value: 'bloodSugar' as const, icon: Droplet },
  { label: '心率趋势', value: 'heartRate' as const, icon: Activity },
  { label: '体重趋势', value: 'weight' as const, icon: Scale }
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
    CREATE: '健康记录创建成功',
    UPDATE: '健康记录更新成功',
    DELETE: '健康记录删除成功'
  },
  ERROR: {
    CREATE: '创建健康记录失败',
    UPDATE: '更新健康记录失败',
    DELETE: '删除健康记录失败',
    FETCH_RECORDS: '获取健康记录失败',
    DUPLICATE_DATE: '该日期的健康记录已存在，请选择编辑'
  },
  EMPTY: {
    RECORDS: '暂无健康记录',
    USER: '未关联用户'
  },
  CONFIRM: {
    DELETE: (count: number) =>
      `确定要删除选中的 ${count} 条健康记录吗？此操作不可撤销。`,
    DELETE_SINGLE: (userName: string, date: string) =>
      `确定要删除用户 "${userName}" 在 ${date} 的健康记录吗？此操作不可撤销。`
  }
} as const;

/**
 * 单位选项
 */
export const UNIT_OPTIONS = {
  weight: [
    { label: 'kg', value: 'kg' },
    { label: 'lb', value: 'lb' }
  ],
  temperature: [
    { label: '℃', value: 'celsius' },
    { label: '℉', value: 'fahrenheit' }
  ],
  bloodSugar: [
    { label: 'mmol/L', value: 'mmol/L' },
    { label: 'mg/dL', value: 'mg/dL' }
  ]
} as const;

/**
 * 视图模式
 */
export type ViewMode = 'table' | 'chart';

export const VIEW_MODE_OPTIONS = [
  { label: '列表视图', value: 'table' as const },
  { label: '趋势图表', value: 'chart' as const }
] as const;
