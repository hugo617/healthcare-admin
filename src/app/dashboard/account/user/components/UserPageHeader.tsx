import React from 'react';
import { Plus, Download, Upload, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/table/page-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface UserPageHeaderProps {
  /** 新增用户回调 */
  onCreateUser: () => void;
  /** 导出用户回调 */
  onExportUsers?: () => void;
  /** 导入用户回调 */
  onImportUsers?: () => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 统计数据 */
  totalUsers?: number;
  activeUsers?: number;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 用户页面头部组件
 * 负责页面标题、操作按钮（批量操作已移至浮动栏）
 */
export function UserPageHeader({
  onCreateUser,
  onExportUsers,
  onImportUsers,
  onRefresh,
  totalUsers,
  activeUsers,
  loading = false
}: UserPageHeaderProps) {
  return (
    <PageHeader
      title='用户管理'
      description={`管理系统用户账户和权限${totalUsers && totalUsers > 0 ? ` (总数: ${totalUsers.toLocaleString()}${activeUsers && activeUsers > 0 ? `, 活跃: ${activeUsers.toLocaleString()}` : ''})` : ''}`}
    >
      <div className='flex items-center gap-2'>
        {/* 主要操作按钮 */}
        <Button onClick={onCreateUser} size='sm' className='cursor-pointer'>
          <Plus className='mr-2 h-4 w-4' />
          新增用户
        </Button>

        {/* 更多操作下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='cursor-pointer'>
              更多操作
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={onImportUsers}
              className='cursor-pointer'
            >
              <Upload className='mr-2 h-4 w-4' />
              导入用户
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onExportUsers}
              className='cursor-pointer'
            >
              <Download className='mr-2 h-4 w-4' />
              导出用户
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onRefresh}
              disabled={loading}
              className='cursor-pointer'
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              刷新数据
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </PageHeader>
  );
}
