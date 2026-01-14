/**
 * 权限管理页面头部组件
 */

import { Shield, Plus, RefreshCw, List, Network, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/app/admin/dashboard/account/permission/types';

interface PermissionPageHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreatePermission: () => void;
  onTemplateManage: () => void;
  onRefresh: () => void;
  loading?: boolean;
  totalCount?: number;
}

export function PermissionPageHeader({
  viewMode,
  onViewModeChange,
  onCreatePermission,
  onTemplateManage,
  onRefresh,
  loading = false,
  totalCount
}: PermissionPageHeaderProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-2'>
        <Shield className='text-muted-foreground h-5 w-5' />
        <h1 className='text-2xl font-bold tracking-tight'>权限管理</h1>
        {totalCount !== undefined && (
          <span className='text-muted-foreground text-sm'>
            ({totalCount} 个权限)
          </span>
        )}
      </div>

      <div className='flex items-center gap-2'>
        {/* 视图切换 */}
        <div className='flex items-center rounded-md border p-0.5'>
          <Button
            variant={viewMode === 'tree' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => onViewModeChange('tree')}
            className='h-7 px-2'
          >
            <Network className='mr-1 h-4 w-4' />
            树形
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => onViewModeChange('table')}
            className='h-7 px-2'
          >
            <List className='mr-1 h-4 w-4' />
            列表
          </Button>
        </div>

        {/* 刷新按钮 */}
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        {/* 模板按钮 */}
        <Button variant='outline' size='sm' onClick={onTemplateManage}>
          <Copy className='mr-2 h-4 w-4' />
          模板
        </Button>

        {/* 新增按钮 */}
        <Button size='sm' onClick={onCreatePermission}>
          <Plus className='mr-2 h-4 w-4' />
          新增权限
        </Button>
      </div>
    </div>
  );
}
