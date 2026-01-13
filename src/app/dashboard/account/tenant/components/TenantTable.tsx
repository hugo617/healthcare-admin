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
import { cn } from '@/lib/utils';
import type { Tenant, PaginationInfo, EmptyState } from '../types';
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
  onToggleStatus: (
    tenant: Tenant,
    action: 'activate' | 'deactivate' | 'suspend'
  ) => void;
  /** 空状态配置 */
  emptyState?: EmptyState;
  /** 选中的租户 ID 集合 */
  selectedTenants?: Set<string>;
  /** 切换选中状态回调 */
  onToggleSelection?: (id: string) => void;
  /** 全选/取消全选回调 */
  onToggleAll?: () => void;
  /** 打开配置对话框回调 */
  onOpenConfig?: (tenant: Tenant) => void;
}

/**
 * 租户状态徽章组件 - 现代简约风格
 */
function TenantStatusBadge({ status }: { status: string }) {
  const config =
    TENANT_STATUS_CONFIG[status as keyof typeof TENANT_STATUS_CONFIG];

  if (!config) {
    return <Badge variant='outline'>{status}</Badge>;
  }

  return (
    <Badge
      variant='outline'
      className={cn(
        'font-medium transition-colors duration-200',
        'border px-2.5 py-0.5 text-xs',
        config.color
      )}
    >
      {config.label}
    </Badge>
  );
}

/**
 * 租户表格组件 - 现代简约风格
 * 负责展示租户列表数据和操作按钮
 */
export function TenantTable({
  tenants,
  loading,
  pagination,
  onEdit,
  onDelete,
  onToggleStatus,
  emptyState,
  selectedTenants = new Set(),
  onToggleSelection,
  onToggleAll,
  onOpenConfig
}: TenantTableProps) {
  // 表格列配置
  const columns = TABLE_COLUMNS.map((col) => {
    if (col.key === 'name') {
      return {
        ...col,
        render: (value: string, record: Tenant) => {
          return (
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105'>
                <Building2 className='h-5 w-5' />
              </div>
              <div>
                <div className='font-heading font-semibold text-gray-900 dark:text-gray-100'>
                  {value}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  {record.code}
                </div>
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
          <code className='rounded-md bg-gray-100 px-2.5 py-1 font-mono text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
            {value}
          </code>
        )
      };
    }

    if (col.key === 'status') {
      return {
        ...col,
        render: (value: string, record: Tenant) => (
          <TenantStatusBadge status={record.status} />
        )
      };
    }

    if (col.key === 'userCount') {
      return {
        ...col,
        render: (value: number) => (
          <div className='flex items-center gap-2'>
            <div className='flex rounded-lg bg-purple-50 p-1.5 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'>
              <Users className='h-3.5 w-3.5' />
            </div>
            <span className='font-heading font-semibold text-gray-900 dark:text-gray-100'>
              {value || 0}
            </span>
          </div>
        )
      };
    }

    if (col.key === 'maxUsers') {
      return {
        ...col,
        render: (value: number, record: Tenant) => {
          const maxUsers = record.settings?.maxUsers;
          const userCount = record.userCount || 0;
          const usagePercent = maxUsers
            ? Math.round((userCount / maxUsers) * 100)
            : 0;

          return (
            <div className='flex items-center gap-2'>
              <span className='font-heading font-semibold text-gray-900 dark:text-gray-100'>
                {maxUsers || '-'}
              </span>
              {maxUsers && (
                <Badge
                  variant='outline'
                  className={cn(
                    'font-medium transition-colors duration-200',
                    'border px-2 py-0.5 text-xs',
                    usagePercent > 80
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                      : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400'
                  )}
                >
                  {usagePercent}%
                </Badge>
              )}
            </div>
          );
        }
      };
    }

    if (col.key === 'sessionTimeout') {
      return {
        ...col,
        render: (value: number, record: Tenant) => {
          const timeout = record.settings?.sessionTimeout;
          if (!timeout) return <span className='text-gray-400'>-</span>;

          const hours = Math.floor(timeout / 3600);
          const minutes = Math.floor((timeout % 3600) / 60);

          if (hours > 0) {
            return (
              <span className='font-mono text-sm text-gray-700 dark:text-gray-300'>
                {hours}小时{minutes > 0 ? `${minutes}分` : ''}
              </span>
            );
          }
          return (
            <span className='font-mono text-sm text-gray-700 dark:text-gray-300'>
              {minutes}分钟
            </span>
          );
        }
      };
    }

    if (col.key === 'createdAt') {
      return {
        ...col,
        render: (value: string) => (
          <div className='flex items-center gap-2'>
            <div className='flex rounded-lg bg-gray-50 p-1.5 text-gray-500 dark:bg-gray-950/30 dark:text-gray-400'>
              <Calendar className='h-3.5 w-3.5' />
            </div>
            <span className='font-mono text-sm text-gray-700 dark:text-gray-300'>
              {formatDateTime(value)}
            </span>
          </div>
        )
      };
    }

    if (col.key === 'actions') {
      return {
        ...col,
        render: (value: any, record: Tenant) => {
          const statusConfig = TENANT_STATUS_CONFIG[record.status];

          const actions: ActionItem[] = [
            {
              key: 'edit',
              label: '编辑',
              icon: <Edit className='mr-2 h-4 w-4' />,
              onClick: () => onEdit(record)
            }
          ];

          if (record.status === 'active') {
            actions.push({
              key: 'deactivate',
              label: '停用',
              icon: <PowerOff className='mr-2 h-4 w-4' />,
              onClick: () => onToggleStatus(record, 'deactivate')
            });
            actions.push({
              key: 'suspend',
              label: '暂停',
              icon: <Ban className='mr-2 h-4 w-4' />,
              onClick: () => onToggleStatus(record, 'suspend')
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

          actions.push({
            key: 'config',
            label: '配置',
            icon: <Settings className='mr-2 h-4 w-4' />,
            onClick: () => onOpenConfig?.(record)
          });

          const deleteAction: DeleteAction | undefined = statusConfig.canDelete
            ? {
                description: `确定要删除租户 "${record.name}" 吗？此操作不可撤销。`,
                onConfirm: () => onDelete(record)
              }
            : undefined;

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
    <DataTable
      columns={columns}
      data={tenants}
      loading={loading}
      emptyText='暂无租户数据'
      emptyState={emptyState}
      rowKey='id'
      selectable={true}
      selectedKeys={Array.from(selectedTenants)}
      onSelect={(key) => onToggleSelection?.(key)}
      onSelectAll={onToggleAll}
    />
  );
}
