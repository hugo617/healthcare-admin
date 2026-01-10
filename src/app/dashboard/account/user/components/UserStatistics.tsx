'use client';

import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserStatistics as UserStatisticsType } from '../types';

interface UserStatisticsProps {
  statistics?: UserStatisticsType;
  loading?: boolean;
}

/**
 * 用户统计信息组件 - Bento Grid 风格（含暗色模式适配）
 * 展示用户总数、状态分布、活跃度、增长趋势等统计数据
 */
export function UserStatistics({
  statistics,
  loading = false
}: UserStatisticsProps) {
  // 加载骨架屏
  if (loading) {
    return (
      <div className='bento-grid bento-grid-cols-4'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='bento-card bento-card-hover animate-pulse'
            style={{ minHeight: i === 0 ? '140px' : '120px' }}
          >
            <div className='mb-4 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='mb-2 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='h-3 w-20 rounded bg-gray-200 dark:bg-gray-700'></div>
          </div>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const { overview, engagement, growth } = statistics;

  // 计算百分比
  const activePercent =
    overview.total > 0
      ? Math.round((overview.active / overview.total) * 100)
      : 0;
  const inactivePercent =
    overview.total > 0
      ? Math.round((overview.inactive / overview.total) * 100)
      : 0;
  const lockedPercent =
    overview.total > 0
      ? Math.round((overview.locked / overview.total) * 100)
      : 0;

  return (
    <div className='space-y-4'>
      {/* 第一行：统计卡片 */}
      <div className='bento-grid bento-grid-cols-4'>
        {/* 总用户数 - 大卡片 */}
        <div className='bento-card bento-card-hover col-span-1 md:col-span-2'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-blue-50 p-2.5 dark:bg-blue-950/30'>
                <Users className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <span className='bento-stat-label'>总用户数</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-gray-900 dark:text-gray-100'>
            {overview.total.toLocaleString()}
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-gray-500 dark:text-gray-400'>活跃率</span>
            <Badge className='border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/30'>
              {overview.activeRate}%
            </Badge>
          </div>
        </div>

        {/* 活跃用户 */}
        <div className='bento-card bento-card-hover'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-green-50 p-2.5 dark:bg-green-950/30'>
                <UserCheck className='h-5 w-5 text-green-600 dark:text-green-400' />
              </div>
              <span className='bento-stat-label'>活跃用户</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-green-600 dark:text-green-400'>
            {overview.active.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            占比 {activePercent}%
          </div>
        </div>

        {/* 禁用用户 */}
        <div className='bento-card bento-card-hover'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-red-50 p-2.5 dark:bg-red-950/30'>
                <UserX className='h-5 w-5 text-red-600 dark:text-red-400' />
              </div>
              <span className='bento-stat-label'>禁用用户</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-red-600 dark:text-red-400'>
            {overview.inactive.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            占比 {inactivePercent}%
          </div>
        </div>
      </div>

      {/* 第二行：扩展统计 */}
      <div className='bento-grid bento-grid-cols-4'>
        {/* 锁定用户 */}
        <div className='bento-card bento-card-hover'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-orange-50 p-2.5 dark:bg-orange-950/30'>
                <Shield className='h-5 w-5 text-orange-600 dark:text-orange-400' />
              </div>
              <span className='bento-stat-label'>锁定用户</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-orange-600 dark:text-orange-400'>
            {overview.locked.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            占比 {lockedPercent}%
          </div>
        </div>

        {/* 用户活跃度 */}
        <div className='bento-card bento-card-hover col-span-1 md:col-span-2'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='rounded-xl bg-purple-50 p-2.5 dark:bg-purple-950/30'>
              <Activity className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            </div>
            <span className='font-medium text-gray-700 dark:text-gray-300'>
              用户活跃度
            </span>
          </div>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                近30天登录
              </span>
              <Badge
                variant='secondary'
                className='border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/30'
              >
                {engagement.recentLogins.toLocaleString()}
              </Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                活跃率
              </span>
              <Badge
                className={
                  engagement.recentLoginRate >= 80
                    ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-800'
                }
              >
                {engagement.recentLoginRate}%
              </Badge>
            </div>
            <div className='bento-progress-bar bg-green-100 dark:bg-green-900/30'>
              <div
                className='bento-progress-fill bg-green-600 dark:bg-green-500'
                style={{ width: `${engagement.recentLoginRate}%` }}
              />
            </div>
            <p className='text-xs text-gray-400 dark:text-gray-600'>
              近30天内有登录的用户占总用户的比例
            </p>
          </div>
        </div>

        {/* 用户增长趋势 */}
        <div className='bento-card bento-card-hover col-span-1 md:col-span-1'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='rounded-xl bg-cyan-50 p-2.5 dark:bg-cyan-950/30'>
              <TrendingUp className='h-5 w-5 text-cyan-600 dark:text-cyan-400' />
            </div>
            <span className='font-medium text-gray-700 dark:text-gray-300'>
              增长趋势
            </span>
          </div>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                本月新增
              </span>
              <Badge
                variant='secondary'
                className='border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/30'
              >
                +{growth.thisMonth.toLocaleString()}
              </Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                上月新增
              </span>
              <span className='text-sm text-gray-700 dark:text-gray-300'>
                {growth.lastMonth.toLocaleString()}
              </span>
            </div>
            <div className='border-t border-gray-100 pt-2 dark:border-gray-800'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  增长率
                </span>
                <div className='flex items-center gap-1.5'>
                  {growth.growthRate >= 0 ? (
                    <ArrowUp className='h-4 w-4 text-green-600 dark:text-green-400' />
                  ) : (
                    <ArrowDown className='h-4 w-4 text-red-600 dark:text-red-400' />
                  )}
                  <span
                    className={`font-semibold ${growth.growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {growth.growthRate >= 0 ? '+' : ''}
                    {growth.growthRate}%
                  </span>
                </div>
              </div>
            </div>
            <p className='flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600'>
              <Calendar className='h-3 w-3' />
              对比上月增长率
            </p>
          </div>
        </div>
      </div>

      {/* 状态分布 - 可折叠 */}
      <div className='bento-card'>
        <h3 className='mb-4 font-semibold text-gray-900 dark:text-gray-100'>
          用户状态分布
        </h3>
        <div className='grid gap-4 md:grid-cols-3'>
          {/* 正常用户 */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-green-700 dark:text-green-400'>
                正常用户
              </span>
              <Badge className='border-green-200 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900/50'>
                {overview.active.toLocaleString()}
              </Badge>
            </div>
            <div className='bento-progress-bar bg-green-100 dark:bg-green-900/30'>
              <div
                className='bento-progress-fill bg-green-600 dark:bg-green-500'
                style={{ width: `${activePercent}%` }}
              />
            </div>
          </div>

          {/* 禁用用户 */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-red-700 dark:text-red-400'>
                禁用用户
              </span>
              <Badge className='border-red-200 bg-red-100 text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900/50'>
                {overview.inactive.toLocaleString()}
              </Badge>
            </div>
            <div className='bento-progress-bar bg-red-100 dark:bg-red-900/30'>
              <div
                className='bento-progress-fill bg-red-600 dark:bg-red-500'
                style={{ width: `${inactivePercent}%` }}
              />
            </div>
          </div>

          {/* 锁定用户 */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-orange-700 dark:text-orange-400'>
                锁定用户
              </span>
              <Badge className='border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-900/50'>
                {overview.locked.toLocaleString()}
              </Badge>
            </div>
            <div className='bento-progress-bar bg-orange-100 dark:bg-orange-900/30'>
              <div
                className='bento-progress-fill bg-orange-600 dark:bg-orange-500'
                style={{ width: `${lockedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
