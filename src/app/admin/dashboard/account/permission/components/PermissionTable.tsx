import React from 'react';
import { Edit, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem,
  type DeleteAction
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';
import { Permission, PaginationInfo, PermissionType } from '../types';
import {
  TABLE_COLUMNS,
  MESSAGES,
  PERMISSION_TYPE_CONFIG,
  HTTP_METHOD_CONFIG
} from '../constants';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

interface PermissionTableProps {
  /** 权限数据列表 */
  permissions: Permission[];
  /** 加载状态 */
  loading: boolean;
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 编辑权限回调 */
  onEdit: (permission: Permission) => void;
  /** 删除权限回调 */
  onDelete: (permission: Permission) => void | Promise<void>;
  /** 查看使用情况回调 */
  onViewUsage?: (permission: Permission) => void;
  /** 空状态配置 */
  emptyState?: EmptyStateProps;
}

/**
 * 权限表格组件
 * 负责展示权限列表数据和操作按钮
 */
export function PermissionTable({
  permissions,
  loading,
  pagination,
  onEdit,
  onDelete,
  onViewUsage,
  emptyState
}: PermissionTableProps) {
  // 表格列配置
  const columns = TABLE_COLUMNS.map((col) => {
    if (col.key === 'index') {
      return {
        ...col,
        render: (value: any, record: Permission, index: number) => {
          // 计算全局序号：(当前页 - 1) * 每页大小 + 当前索引 + 1
          return (pagination.page - 1) * pagination.limit + index + 1;
        }
      };
    }

    if (col.key === 'type') {
      return {
        ...col,
        render: (value: PermissionType) => {
          const config = PERMISSION_TYPE_CONFIG[value];
          if (!config) return value;
          return (
            <Badge
              variant='outline'
              className={`gap-1.5 text-xs ${config.color}`}
            >
              <config.icon className='h-3 w-3' />
              {config.label}
            </Badge>
          );
        }
      };
    }

    if (col.key === 'code') {
      return {
        ...col,
        render: (value: string, record: Permission) => {
          const method = record.method;
          const methodConfig = method
            ? HTTP_METHOD_CONFIG[method as keyof typeof HTTP_METHOD_CONFIG]
            : null;
          return (
            <div className='flex items-center gap-2'>
              {methodConfig && (
                <Badge className={`text-xs ${methodConfig.color}`}>
                  {methodConfig.label}
                </Badge>
              )}
              <span className='font-mono text-sm'>{value}</span>
            </div>
          );
        }
      };
    }

    if (col.key === 'roleUsage') {
      return {
        ...col,
        render: (value: number, record: Permission) => {
          const count = record.roleUsageCount || 0;
          if (count === 0)
            return <span className='text-muted-foreground text-sm'>-</span>;
          return (
            <Badge variant='secondary' className='text-xs'>
              {count} 个角色
            </Badge>
          );
        }
      };
    }

    if (col.key === 'frontPath') {
      return {
        ...col,
        render: (value: string | undefined) => {
          if (!value)
            return <span className='text-muted-foreground text-sm'>-</span>;
          return <span className='font-mono text-xs'>{value}</span>;
        }
      };
    }

    if (col.key === 'apiPath') {
      return {
        ...col,
        render: (value: string | undefined, record: Permission) => {
          if (!value)
            return <span className='text-muted-foreground text-sm'>-</span>;
          return (
            <div className='flex items-center gap-1.5'>
              {record.method && (
                <span className='text-muted-foreground font-mono text-xs'>
                  [{record.method}]
                </span>
              )}
              <span className='font-mono text-xs'>{value}</span>
            </div>
          );
        }
      };
    }

    if (col.key === 'isSystem') {
      return {
        ...col,
        render: (value: boolean) => {
          return value ? (
            <Badge variant='default' className='text-xs'>
              系统权限
            </Badge>
          ) : (
            <span className='text-muted-foreground text-sm'>-</span>
          );
        }
      };
    }

    if (col.key === 'actions') {
      return {
        ...col,
        render: (value: any, record: Permission) => {
          const actions: ActionItem[] = [];

          // 查看使用情况
          if (onViewUsage) {
            actions.push({
              key: 'usage',
              label: '使用情况',
              icon: <Eye className='mr-2 h-4 w-4' />,
              onClick: () => onViewUsage(record)
            });
          }

          // 编辑
          actions.push({
            key: 'edit',
            label: '编辑',
            icon: <Edit className='mr-2 h-4 w-4' />,
            onClick: () => onEdit(record)
          });

          // 系统权限不允许删除
          if (record.isSystem) {
            return <ActionDropdown actions={actions} />;
          }

          const deleteAction: DeleteAction = {
            description: MESSAGES.CONFIRM.DELETE(record.name),
            onConfirm: () => onDelete(record)
          };

          return (
            <ActionDropdown actions={actions} deleteAction={deleteAction} />
          );
        }
      };
    }

    return col;
  });

  return (
    <DataTable
      columns={columns}
      data={permissions}
      loading={loading}
      emptyText={MESSAGES.EMPTY.PERMISSIONS}
      emptyState={emptyState}
      rowKey='id'
    />
  );
}
