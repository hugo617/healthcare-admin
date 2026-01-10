'use client';

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
  LogOut,
  Mail,
  Phone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateTime } from '@/components/table/utils';
import { User } from '../types';
import { STATUS_MAP } from '../constants';

interface UserCardProps {
  /** 用户数据 */
  user: User;
  /** 是否选中 */
  selected?: boolean;
  /** 选择状态变更 */
  onSelectChange?: (checked: boolean) => void;
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
}

/**
 * 用户卡片组件（含暗色模式适配）
 * 以卡片形式展示用户信息，支持移动端友好布局
 */
export function UserCard({
  user,
  selected = false,
  onSelectChange,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onResetPassword,
  onViewSessions,
  onTerminateSessions
}: UserCardProps) {
  const statusInfo = STATUS_MAP[user.status];

  return (
    <Card className='bento-card bento-card-hover group relative p-4 dark:bg-gray-800/50'>
      {/* 选中复选框 */}
      {onSelectChange && (
        <div className='absolute top-4 left-4 z-10'>
          <Checkbox
            checked={selected}
            onCheckedChange={onSelectChange}
            className='cursor-pointer'
          />
        </div>
      )}

      {/* 卡片头部 */}
      <div className='mb-4 flex items-start gap-4 pl-8'>
        <Avatar className='h-14 w-14 ring-2 ring-gray-100 dark:ring-gray-700'>
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className='bg-gradient-to-br from-blue-500 to-purple-600 text-base font-semibold text-white'>
            {user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='truncate font-semibold text-gray-900 dark:text-gray-100'>
              {user.username}
            </h3>
            {user.isSuperAdmin && (
              <Crown className='h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-400' />
            )}
            <Badge variant={statusInfo.variant} className='flex-shrink-0'>
              {statusInfo.label}
            </Badge>
          </div>

          {user.realName && (
            <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
              {user.realName}
            </p>
          )}

          <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500'>
            <span className='font-mono'>ID: {user.id}</span>
            {user.tenantId && <span>•</span>}
            {user.tenantId && <span>租户: {user.tenantId}</span>}
          </div>
        </div>

        {/* 操作按钮 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='cursor-pointer opacity-0 transition-opacity group-hover:opacity-100'
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='dark:border-gray-700 dark:bg-gray-800'
          >
            <DropdownMenuItem
              onClick={() => onEdit(user)}
              className='cursor-pointer'
            >
              <Edit className='mr-2 h-4 w-4' />
              编辑
            </DropdownMenuItem>

            {onResetPassword && (
              <DropdownMenuItem
                onClick={() => onResetPassword(user)}
                className='cursor-pointer'
              >
                <Key className='mr-2 h-4 w-4' />
                重置密码
              </DropdownMenuItem>
            )}

            {onViewSessions && (
              <DropdownMenuItem
                onClick={() => onViewSessions(user)}
                className='cursor-pointer'
              >
                <Users className='mr-2 h-4 w-4' />
                查看会话
              </DropdownMenuItem>
            )}

            {onTerminateSessions && !user.isSuperAdmin && (
              <DropdownMenuItem
                onClick={() => onTerminateSessions(user)}
                className='cursor-pointer'
              >
                <LogOut className='mr-2 h-4 w-4' />
                终止会话
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* 状态切换 */}
            {user.status === 'inactive' && onEnable && (
              <DropdownMenuItem
                onClick={() => onEnable(user)}
                className='cursor-pointer'
              >
                <UserCheck className='mr-2 h-4 w-4' />
                启用
              </DropdownMenuItem>
            )}
            {user.status === 'active' && onDisable && !user.isSuperAdmin && (
              <DropdownMenuItem
                onClick={() => onDisable(user)}
                className='cursor-pointer'
              >
                <UserX className='mr-2 h-4 w-4' />
                禁用
              </DropdownMenuItem>
            )}
            {user.status === 'locked' && onEnable && !user.isSuperAdmin && (
              <DropdownMenuItem
                onClick={() => onEnable(user)}
                className='cursor-pointer'
              >
                <Shield className='mr-2 h-4 w-4' />
                解锁
              </DropdownMenuItem>
            )}

            {!user.isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className='cursor-pointer text-red-600 dark:text-red-400'
                >
                  删除用户
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 卡片内容 */}
      <div className='space-y-3 text-sm'>
        {/* 联系方式 */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
            <Mail className='h-4 w-4 text-gray-400 dark:text-gray-500' />
            <span className='truncate'>{user.email}</span>
          </div>
          {user.phone && (
            <div className='flex items-center gap-2 text-gray-600 dark:text-gray-400'>
              <Phone className='h-4 w-4 text-gray-400 dark:text-gray-500' />
              <span className='truncate'>{user.phone}</span>
            </div>
          )}
        </div>

        {/* 角色 */}
        <div className='flex items-center gap-2'>
          {user.isSuperAdmin ? (
            <Badge className='border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'>
              <Crown className='mr-1 h-3 w-3' />
              超级管理员
            </Badge>
          ) : user.role?.name ? (
            <Badge
              variant='secondary'
              className='dark:bg-gray-700 dark:text-gray-300'
            >
              {user.role.name}
            </Badge>
          ) : (
            <span className='text-xs text-gray-400 dark:text-gray-600'>
              未分配角色
            </span>
          )}
        </div>

        {/* 组织 */}
        {user.organizations && user.organizations.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {user.organizations.slice(0, 2).map((org) => (
              <Badge
                key={org.id}
                variant='outline'
                className='text-xs dark:border-gray-700'
              >
                {org.organization.name}
              </Badge>
            ))}
            {user.organizations.length > 2 && (
              <span className='text-xs text-gray-500 dark:text-gray-500'>
                +{user.organizations.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 活动信息 */}
        <div className='border-t border-gray-100 pt-2 dark:border-gray-800'>
          <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500'>
            <Activity className='h-3.5 w-3.5' />
            <span>
              {user.lastLoginAt
                ? `最近登录: ${formatDateTime(user.lastLoginAt)}`
                : '从未登录'}
            </span>
          </div>
          <div className='mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-600'>
            <span className='text-gray-400 dark:text-gray-600'>
              创建于 {formatDateTime(user.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
