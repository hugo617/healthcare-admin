import React from 'react';
import {
  Edit,
  UserCheck,
  UserX,
  Crown,
  MoreHorizontal,
  Key,
  Shield,
  Activity,
  Users,
  LogOut
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem,
  type DeleteAction
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';
import { User, PaginationInfo } from '../types';
import { TABLE_COLUMNS, MESSAGES, STATUS_MAP } from '../constants';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

interface UserTableProps {
  /** 用户数据列表 */
  users: User[];
  /** 加载状态 */
  loading: boolean;
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 选中的用户ID列表 */
  selectedUsers?: number[];
  /** 表格选择回调 */
  onSelectUser?: (userId: number) => void;
  /** 全选回调 */
  onSelectAll?: () => void;
  /** 编辑用户回调 */
  onEdit: (user: User) => void;
  /** 删除用户回调 */
  onDelete: (user: User) => void;
  /** 启用用户回调 */
  onEnable?: (user: User) => void;
  /** 禁用用户回调 */
  onDisable?: (user: User) => void;
  /** 重置密码回调 */
  onResetPassword?: (user: User) => void;
  /** 查看会话回调 */
  onViewSessions?: (user: User) => void;
  /** 终止会话回调 */
  onTerminateSessions?: (user: User) => void;
  /** 空状态配置 */
  emptyState?: EmptyStateProps;
  /** 排序配置 */
  sortConfig?: { sortBy: string; sortOrder: 'asc' | 'desc' } | null;
  /** 排序回调 */
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

/**
 * 用户表格组件
 * 负责展示用户列表数据和操作按钮
 */
export function UserTable({
  users,
  loading,
  pagination,
  selectedUsers = [],
  onSelectUser,
  onSelectAll,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onResetPassword,
  onViewSessions,
  onTerminateSessions,
  emptyState,
  sortConfig,
  onSort
}: UserTableProps) {
  // 表格列配置
  const columns = TABLE_COLUMNS.map((col) => {
    if (col.key === 'index') {
      return {
        ...col,
        render: (value: any, record: User, index: number) => {
          // 计算全局序号：(当前页 - 1) * 每页大小 + 当前索引 + 1
          return (pagination.page - 1) * pagination.limit + index + 1;
        }
      };
    }

    if (col.key === 'avatar') {
      return {
        ...col,
        render: (value: any, record: User) => (
          <div className='flex justify-center'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={record.avatar} alt={record.username} />
              <AvatarFallback className='text-xs'>
                {record.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )
      };
    }

    if (col.key === 'userInfo') {
      return {
        ...col,
        render: (value: any, record: User) => (
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <span className='font-medium'>{record.username}</span>
              {record.isSuperAdmin && (
                <Crown className='h-3 w-3 text-amber-500' />
              )}
            </div>
            {record.realName && (
              <div className='text-muted-foreground text-sm'>
                {record.realName}
              </div>
            )}
            <div className='text-muted-foreground text-xs'>
              ID: {record.id}
              {record.tenantId && ` | 租户: ${record.tenantId}`}
            </div>
          </div>
        )
      };
    }

    if (col.key === 'contact') {
      return {
        ...col,
        render: (value: any, record: User) => (
          <div className='space-y-1'>
            <div className='text-sm'>{record.email}</div>
            {record.phone && (
              <div className='text-muted-foreground text-xs'>
                {record.phone}
              </div>
            )}
          </div>
        )
      };
    }

    if (col.key === 'organizations') {
      return {
        ...col,
        render: (value: any, record: User) => {
          if (record.organizations && record.organizations.length > 0) {
            const mainOrg = record.organizations.find((org) => org.isMain);
            const otherOrgs = record.organizations.filter((org) => !org.isMain);

            return (
              <div className='space-y-1'>
                {mainOrg && (
                  <div className='text-sm'>
                    <Badge variant='outline' className='text-xs'>
                      {mainOrg.organization.name}
                    </Badge>
                  </div>
                )}
                {otherOrgs.length > 0 && (
                  <div className='text-muted-foreground text-xs'>
                    +{otherOrgs.length} 个其他组织
                  </div>
                )}
              </div>
            );
          }
          return <span className='text-muted-foreground text-xs'>未分配</span>;
        }
      };
    }

    if (col.key === 'role') {
      return {
        ...col,
        render: (value: any, record: User) => {
          return record.isSuperAdmin ? (
            <Badge
              variant='outline'
              className='border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700'
            >
              <Crown className='mr-1 h-3 w-3' />
              超级管理员
            </Badge>
          ) : record.role?.name ? (
            <div className='space-y-1'>
              <Badge variant='secondary' className='text-xs'>
                {record.role.name}
              </Badge>
              <div className='text-muted-foreground text-xs'>
                {record.role.code}
              </div>
            </div>
          ) : (
            <span className='text-muted-foreground text-xs'>
              {MESSAGES.EMPTY.ROLE}
            </span>
          );
        }
      };
    }

    if (col.key === 'status') {
      return {
        ...col,
        render: (value: any, record: User) => {
          const statusInfo = STATUS_MAP[record.status];
          return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
        }
      };
    }

    if (col.key === 'activity') {
      return {
        ...col,
        render: (value: any, record: User) => (
          <div className='space-y-1 text-xs'>
            <div className='flex items-center gap-1'>
              <Activity className='h-3 w-3' />
              {record.lastLoginAt ? (
                <span>{formatDateTime(record.lastLoginAt)}</span>
              ) : (
                <span className='text-muted-foreground'>
                  {MESSAGES.EMPTY.LAST_LOGIN}
                </span>
              )}
            </div>
            <div className='text-muted-foreground flex items-center gap-1'>
              <span>创建于 {formatDateTime(record.createdAt)}</span>
            </div>
          </div>
        )
      };
    }

    if (col.key === 'actions') {
      return {
        ...col,
        render: (value: any, record: User) => {
          const actions: ActionItem[] = [
            {
              key: 'edit',
              label: '编辑',
              icon: <Edit className='mr-2 h-4 w-4' />,
              onClick: () => onEdit(record)
            }
          ];

          // 添加重置密码操作
          if (onResetPassword) {
            actions.push({
              key: 'resetPassword',
              label: '重置密码',
              icon: <Key className='mr-2 h-4 w-4' />,
              onClick: () => onResetPassword(record)
            });
          }

          // 添加会话管理操作
          if (onViewSessions) {
            actions.push({
              key: 'viewSessions',
              label: '查看会话',
              icon: <Users className='mr-2 h-4 w-4' />,
              onClick: () => onViewSessions(record)
            });
          }

          if (onTerminateSessions && !record.isSuperAdmin) {
            actions.push({
              key: 'terminateSessions',
              label: '终止会话',
              icon: <LogOut className='mr-2 h-4 w-4' />,
              onClick: () => onTerminateSessions(record)
            });
          }

          // 添加状态切换操作（超级管理员不能被禁用）
          if (record.status === 'inactive' && onEnable) {
            actions.push({
              key: 'enable',
              label: '启用',
              icon: <UserCheck className='mr-2 h-4 w-4' />,
              onClick: () => onEnable(record)
            });
          } else if (
            record.status === 'active' &&
            onDisable &&
            !record.isSuperAdmin
          ) {
            actions.push({
              key: 'disable',
              label: '禁用',
              icon: <UserX className='mr-2 h-4 w-4' />,
              onClick: () => onDisable(record)
            });
          } else if (
            record.status === 'locked' &&
            onEnable &&
            !record.isSuperAdmin
          ) {
            actions.push({
              key: 'unlock',
              label: '解锁',
              icon: <Shield className='mr-2 h-4 w-4' />,
              onClick: () => onEnable(record)
            });
          }

          // 超级管理员不能被删除
          const deleteAction: DeleteAction | undefined = record.isSuperAdmin
            ? undefined
            : {
                description: MESSAGES.CONFIRM.DELETE(record.username),
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
      data={users}
      loading={loading}
      emptyText={MESSAGES.EMPTY.USERS}
      emptyState={emptyState}
      rowKey='id'
      selectable={true}
      selectedKeys={selectedUsers.map(String)}
      onSelect={(key) => onSelectUser?.(Number(key))}
      onSelectAll={onSelectAll}
      sortableColumns={['userInfo', 'status', 'activity']}
      sortConfig={sortConfig}
      onSort={onSort}
    />
  );
}
