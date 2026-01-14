/**
 * 组织管理页面头部组件
 */

import { Building2, Plus, RefreshCw, List, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '../types';

interface OrganizationPageHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateOrganization: () => void;
  onRefresh: () => void;
  loading?: boolean;
  totalCount?: number;
}

export function OrganizationPageHeader({
  viewMode,
  onViewModeChange,
  onCreateOrganization,
  onRefresh,
  loading = false,
  totalCount
}: OrganizationPageHeaderProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-2'>
        <Building2 className='text-muted-foreground h-5 w-5' />
        <h1 className='text-2xl font-bold tracking-tight'>组织架构管理</h1>
        {totalCount !== undefined && (
          <span className='text-muted-foreground text-sm'>
            ({totalCount} 个组织)
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

        {/* 创建按钮 */}
        <Button size='sm' onClick={onCreateOrganization}>
          <Plus className='mr-2 h-4 w-4' />
          新建组织
        </Button>
      </div>
    </div>
  );
}
