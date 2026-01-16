/**
 * H5 主题常量
 * 统一的设计系统变量
 */

// 间距系统
export const spacing = {
  xs: '8px', // 0.5rem - 紧凑图标间距、嵌套元素
  sm: '12px', // 0.75rem - 相关项目、紧凑列表
  md: '16px', // 1rem - 默认卡片内边距、标准间距
  lg: '24px', // 1.5rem - 分区块间距、分组内容
  xl: '32px', // 2rem - 页面分区、主要分隔符
  '2xl': '48px' // 3rem - 顶级页面内边距
} as const;

// 颜色系统
export const colors = {
  // 主色 - 翡翠绿
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // 主色
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b'
  },
  // 辅助色
  secondary: '#34D399',
  accent: '#F59E0B',
  sage: '#6EE7B7',
  sageLight: '#A7F3D0',
  healthBg: '#F0FDF4',
  healthText: '#064E3B',

  // 语义化颜色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // 中性色
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  },

  // 新拟态颜色
  neumorphic: {
    light: '#E8EEF5',
    shadow: '#D1D9E6',
    highlight: '#FFFFFF'
  }
} as const;

// 圆角系统
export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px'
} as const;

// 字体大小
export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px'
} as const;

// 字重
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
} as const;

// 过渡时长
export const duration = {
  fast: 150,
  base: 250,
  slow: 350,
  slower: 500
} as const;

// 缓动曲线
export const easing = {
  outQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  inOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)'
} as const;

// 断点 (容器宽度)
export const breakpoints = {
  xs: '375px', // 小屏手机 (iPhone SE)
  sm: '414px', // 标准手机 (iPhone 13)
  md: '428px', // 大屏手机 (iPhone 14 Pro Max)
  lg: '768px' // 平板 (iPad Mini)
} as const;

// Z-index 层级
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070
} as const;

// 触摸目标最小尺寸
export const touchTarget = {
  min: '44px'
} as const;
