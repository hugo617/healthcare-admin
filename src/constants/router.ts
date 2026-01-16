import { NavItem } from '@/types/nav';
import {
  CircleUserRound,
  SquareTerminal,
  Settings,
  ScrollText,
  Cog,
  Users,
  Shield,
  Key,
  Building,
  Building2,
  Database,
  ClipboardList,
  HeartPulse
} from 'lucide-react';

// 业务导航列表
export const businessNavList: NavItem[] = [
  {
    title: '工作台',
    url: '/admin/dashboard/overview',
    icon: SquareTerminal,
    isActive: false,
    description: '工作台',
    items: [],
    searchConfig: {
      keywords: 'dashboard overview home 仪表板 首页 工作台',
      searchShortcut: ['d'],
      searchSection: '导航',
      searchPriority: 1
    }
  }
];

// 系统导航列表
export const systemNavList: NavItem[] = [
  {
    title: '账号管理',
    url: '#',
    icon: CircleUserRound,
    isActive: false,
    items: [
      {
        title: '用户管理',
        url: '/admin/dashboard/account/user',
        description: '用户管理',
        icon: Users,
        searchConfig: {
          keywords: 'users management 用户 管理 user',
          searchShortcut: ['u'],
          searchSection: '账户管理',
          searchPriority: 2
        }
      },
      {
        title: '角色管理',
        url: '/admin/dashboard/account/role',
        description: '角色管理',
        icon: Shield,
        searchConfig: {
          keywords: 'roles permissions 角色 权限 role',
          searchShortcut: ['r'],
          searchSection: '账户管理',
          searchPriority: 3
        }
      },
      {
        title: '权限管理',
        url: '/admin/dashboard/account/permission',
        description: '权限管理',
        icon: Key,
        searchConfig: {
          keywords: 'permissions settings 权限 设置 permission',
          searchShortcut: ['p'],
          searchSection: '账户管理',
          searchPriority: 4
        }
      },
      {
        title: '租户管理',
        url: '/admin/dashboard/account/tenant',
        description: '租户管理',
        icon: Building,
        searchConfig: {
          keywords: 'tenant management 租户 管理 tenant',
          searchShortcut: ['t'],
          searchSection: '账户管理',
          searchPriority: 5
        }
      },
      {
        title: '组织架构',
        url: '/admin/dashboard/account/organization',
        description: '组织架构管理',
        icon: Building2,
        searchConfig: {
          keywords: 'organization management 组织 架构 管理 org',
          searchShortcut: ['o'],
          searchSection: '账户管理',
          searchPriority: 6
        }
      }
    ]
  },
  {
    title: '系统管理',
    url: '#',
    icon: Settings,
    isActive: false,
    items: [
      {
        title: '日志管理',
        url: '/admin/dashboard/system/logs',
        icon: ScrollText,
        description: '系统日志审计',
        searchConfig: {
          keywords: 'system logs audit 系统日志 审计 log',
          searchShortcut: ['l'],
          searchSection: '系统管理',
          searchPriority: 5
        }
      }
    ]
  },
  {
    title: '数据管理',
    url: '#',
    icon: Database,
    isActive: false,
    items: [
      {
        title: '服务记录',
        url: '/admin/dashboard/data/service-record',
        description: '服务记录管理',
        icon: ClipboardList,
        searchConfig: {
          keywords: 'service record 服务记录',
          searchShortcut: ['sr'],
          searchSection: '数据管理',
          searchPriority: 7
        }
      },
      {
        title: '健康档案',
        url: '/admin/dashboard/data/health-record',
        description: '个人健康档案管理',
        icon: HeartPulse,
        searchConfig: {
          keywords: 'health record 健康档案 记录',
          searchShortcut: ['hr'],
          searchSection: '数据管理',
          searchPriority: 8
        }
      }
    ]
  }
];

// 保持原有的navList导出以兼容现有代码
export const navList: NavItem[] = [...businessNavList, ...systemNavList];
