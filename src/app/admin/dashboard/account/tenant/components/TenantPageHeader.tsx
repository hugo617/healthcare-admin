import React from 'react';
import {
  Building2,
  Plus,
  Download,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permission-constants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface TenantPageHeaderProps {
  /** 创建租户回调 */
  onCreateTenant: () => void;
  /** 导出租户回调 */
  onExportTenants?: () => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 统计数据 */
  totalTenants?: number;
  activeTenants?: number;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 租户页面头部组件 - 紧凑型
 * 整合标题、操作按钮，减少垂直空间占用
 */
export function TenantPageHeader({
  onCreateTenant,
  onExportTenants,
  onRefresh,
  totalTenants,
  activeTenants,
  loading = false
}: TenantPageHeaderProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <Building2 className='h-6 w-6 text-gray-700 dark:text-gray-300' />
        <div>
          <h1 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
            租户管理
          </h1>
          {totalTenants !== undefined && totalTenants > 0 && (
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              总数: {totalTenants.toLocaleString()}
              {activeTenants !== undefined && activeTenants > 0 && (
                <span> · 活跃: {activeTenants.toLocaleString()}</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <PermissionGuard permissions={[PERMISSIONS.TENANT.CREATE]}>
          <Button onClick={onCreateTenant} size='sm' className='cursor-pointer'>
            <Plus className='mr-1.5 h-4 w-4' />
            创建租户
          </Button>
        </PermissionGuard>

        {/* 更多操作下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 cursor-pointer'
            >
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {onExportTenants && (
              <DropdownMenuItem
                onClick={onExportTenants}
                className='cursor-pointer'
              >
                <Download className='mr-2 h-4 w-4' />
                导出租户
              </DropdownMenuItem>
            )}
            {onRefresh && (
              <>
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
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
