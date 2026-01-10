'use client';

import React from 'react';
import { Users, Plus } from 'lucide-react';
import { UserCard } from './UserCard';
import { User } from '../types';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

interface UserCardGridProps {
  /** 用户数据列表 */
  users: User[];
  /** 加载状态 */
  loading?: boolean;
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
}

/**
 * 用户卡片网格组件
 * 以响应式网格布局展示用户卡片
 */
export function UserCardGrid({
  users,
  loading = false,
  selectedUsers = [],
  onSelectUser,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onResetPassword,
  onViewSessions,
  onTerminateSessions,
  emptyState
}: UserCardGridProps) {
  // 加载状态
  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className='bento-card animate-pulse'
            style={{ minHeight: '200px' }}
          >
            <div className='mb-4 h-4 w-24 rounded bg-gray-200'></div>
            <div className='mb-2 h-6 w-16 rounded bg-gray-200'></div>
            <div className='h-3 w-20 rounded bg-gray-200'></div>
          </div>
        ))}
      </div>
    );
  }

  // 空状态
  if (users.length === 0) {
    return (
      <div className='flex min-h-[400px] flex-col items-center justify-center space-y-4'>
        <div className='bento-card p-8 text-center'>
          {emptyState?.icon || (
            <div className='mb-4 inline-flex rounded-full bg-gray-100 p-4'>
              <Users className='h-12 w-12 text-gray-400' />
            </div>
          )}
          <div className='space-y-2'>
            <p className='text-foreground text-lg font-medium'>
              {emptyState?.title || '还没有用户'}
            </p>
            <p className='text-muted-foreground mx-auto max-w-sm text-sm'>
              {emptyState?.description || '开始添加用户来管理您的系统'}
            </p>
          </div>
          {emptyState?.action && (
            <div className='mt-6'>{emptyState.action}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          selected={selectedUsers.includes(user.id)}
          onSelectChange={
            onSelectUser ? (checked) => onSelectUser(user.id) : undefined
          }
          onEdit={onEdit}
          onDelete={onDelete}
          onEnable={onEnable}
          onDisable={onDisable}
          onResetPassword={onResetPassword}
          onViewSessions={onViewSessions}
          onTerminateSessions={onTerminateSessions}
        />
      ))}
    </div>
  );
}
