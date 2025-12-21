import React from 'react';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Ban,
  Settings,
  Users,
  Calendar,
  Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem,
  type DeleteAction
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import type {
  Tenant,
  PaginationInfo,
  EmptyState
} from '../types';
import {
  TABLE_COLUMNS,
  TENANT_STATUS_CONFIG,
  STATUS_ACTIONS
} from '../constants';

interface TenantTableProps {
  /** 租户数据列表 */
  tenants: Tenant[];
  /** 加载状态 */
  loading: boolean;
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 编辑租户回调 */
  onEdit: (tenant: Tenant) => void;
  /** 删除租户回调 */
  onDelete: (tenant: Tenant) => void;
  /** 切换租户状态回调 */
  onToggleStatus: (tenant: Tenant, action: 'activate' | 'deactivate' | 'suspend') => void;
  /** 空状态配置 */
  emptyState?: EmptyState;
}

/**
 * 租户表格组件
 * 负责展示租户列表数据和操作按钮
 */
export function TenantTable({
  tenants,
  loading,
  pagination,
  onEdit,
  onDelete,
  onToggleStatus,
  emptyState
}: TenantTableProps) {
  // 表格列配置
  const columns = TABLE_COLUMNS.map((col) => {
    if (col.key === 'index') {
      return {
        ...col,
        render: (value: any, record: Tenant, index: number) => {
          // 计算全局序号：(当前页 - 1) * 每页大小 + 当前索引 + 1
          return (pagination.page - 1) * pagination.pageSize + index + 1;
        }
      };
    }

    if (col.key === 'name') {
      return {
        ...col,
        render: (value: string, record: Tenant) => {
          return (
            <div className='flex items-center space-x-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
                <Building2 className='h-5 w-5' />
              </div>
              <div>
                <div className='font-medium text-gray-900'>{value}</div>
                <div className='text-sm text-gray-500'>{record.code}</div>
              </div>
            </div>
          );
        }
      };
    }

    if (col.key === 'code') {
      return {
        ...col,
        render: (value: string) => (
          <code className='rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-800'>
            {value}
          </code>
        )
      };
    }

    if (col.key === 'status') {
      return {
        ...col,
        render: (value: string, record: Tenant) => {
          const statusConfig = TENANT_STATUS_CONFIG[record.status];
          return (
            <Badge
              variant='outline'
              className={`${statusConfig.color} border`}
            >
              {statusConfig.label}
            </Badge>
          );
        }
      };
    }

    if (col.key === 'userCount') {
      return {
        ...col,
        render: (value: number) => (
          <div className='flex items-center space-x-1'>
            <Users className='h-4 w-4 text-gray-400' />
            <span className='font-medium'>{value || 0}</span>
          </div>
        )
      };
    }

    if (col.key === 'createdAt') {
      return {
        ...col,
        render: (value: string) => (
          <div className='flex items-center space-x-1'>
            <Calendar className='h-4 w-4 text-gray-400' />
            <span className='font-mono text-sm'>{formatDateTime(value)}</span>
          </div>
        )
      };
    }

    if (col.key === 'actions') {
      return {
        ...col,
        render: (value: any, record: Tenant) => {
          const statusConfig = TENANT_STATUS_CONFIG[record.status];

          // 基础操作
          const actions: ActionItem[] = [
            {
              key: 'edit',
              label: '编辑',
              icon: <Edit className='mr-2 h-4 w-4' />,
              onClick: () => onEdit(record)
            }
          ];

          // 根据状态添加不同的状态操作
          if (record.status === 'active') {
            actions.push({
              key: 'deactivate',
              label: '停用',
              icon: <PowerOff className='mr-2 h-4 w-4' />,
              onClick: () => onToggleStatus(record, 'deactivate'),
              variant: 'secondary'
            });
            actions.push({
              key: 'suspend',
              label: '暂停',
              icon: <Ban className='mr-2 h-4 w-4' />,
              onClick: () => onToggleStatus(record, 'suspend'),
              variant: 'destructive'
            });
          } else if (record.status === 'inactive') {
            actions.push({
              key: 'activate',
              label: '启用',
              icon: <Power className='mr-2 h-4 w-4' />,
              onClick: () => onToggleStatus(record, 'activate')
            });
          } else if (record.status === 'suspended') {
            actions.push({
              key: 'activate',
              label: '恢复',
              icon: <Power className='mr-2 h-4 w-4' />,
              onClick: () => onToggleStatus(record, 'activate')
            });
          }

          // 添加配置操作
          actions.push({
            key: 'config',
            label: '配置',
            icon: <Settings className='mr-2 h-4 w-4' />,
            onClick: () => {
              // TODO: 实现配置对话框
              console.log('Open config dialog for tenant:', record.id);
            }
          });

          // 只有状态允许删除时才显示删除操作
          const deleteAction: DeleteAction | undefined = statusConfig.canDelete ? {
            description: `确定要删除租户 "${record.name}" 吗？此操作不可撤销。`,
            onConfirm: () => onDelete(record)
          } : undefined;

          return (
            <PermissionGuard
              permissions={[PERMISSIONS.TENANT.UPDATE]}
              fallback={<div className='text-sm text-gray-400'>无操作权限</div>}
            >
              <ActionDropdown actions={actions} deleteAction={deleteAction} />
            </PermissionGuard>
          );
        }
      };
    }

    return col;
  });

  return (
    <div className='space-y-4'>
      {/* 统计信息 */}
      {!loading && tenants.length > 0 && (
        <div className='flex items-center justify-between rounded-lg border bg-gray-50 p-4'>
          <div className='flex items-center space-x-6'>
            <div className='text-sm'>
              <span className='font-medium text-gray-900'>总租户数：</span>
              <span className='text-gray-600'>{pagination.total}</span>
            </div>
            <div className='text-sm'>
              <span className='font-medium text-green-600'>活跃：</span>
              <span className='text-green-600'>
                {tenants.filter(t => t.status === 'active').length}
              </span>
            </div>
            <div className='text-sm'>
              <span className='font-medium text-gray-600'>停用：</span>
              <span className='text-gray-600'>
                {tenants.filter(t => t.status === 'inactive').length}
              </span>
            </div>
            <div className='text-sm'>
              <span className='font-medium text-red-600'>暂停：</span>
              <span className='text-red-600'>
                {tenants.filter(t => t.status === 'suspended').length}
              </span>
            </div>
          </div>
          <div className='text-sm text-gray-500'>
            第 {pagination.page} 页，共 {pagination.totalPages} 页
          </div>
        </div>
      )}

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={tenants}
        loading={loading}
        emptyText='暂无租户数据'
        emptyState={emptyState}
        rowKey='id'
      />
    </div>
  );
}