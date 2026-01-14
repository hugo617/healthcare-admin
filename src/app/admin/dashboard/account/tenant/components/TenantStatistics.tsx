'use client';

import React from 'react';
import {
  Building2,
  Building,
  Ban,
  Users,
  TrendingUp,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * 租户统计数据接口
 */
export interface TenantStatisticsData {
  overview: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    activeRate: number;
  };
  users: {
    total: number;
    active: number;
  };
  engagement: {
    recentActive: number;
    activeRate: number;
    avgActivity: number;
  };
  growth: {
    today: number;
    week: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
}

interface TenantStatisticsProps {
  statistics?: TenantStatisticsData;
  loading?: boolean;
}

/**
 * 租户统计信息组件 - Bento Grid 风格
 * 展示租户总数、状态分布、用户数、增长趋势等关键统计数据
 */
export function TenantStatistics({
  statistics,
  loading = false
}: TenantStatisticsProps) {
  // 加载骨架屏
  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='bento-grid bento-grid-cols-4'>
          {[...Array(4)].map((_, i) => (
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
        <div className='bento-grid bento-grid-cols-4'>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className='bento-card bento-card-hover animate-pulse'
              style={{ minHeight: '120px' }}
            >
              <div className='mb-4 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='mb-2 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='h-3 w-20 rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const { overview, users, growth } = statistics;

  // 计算百分比
  const activePercent =
    overview.total > 0
      ? Math.round((overview.active / overview.total) * 100)
      : 0;
  const inactivePercent =
    overview.total > 0
      ? Math.round((overview.inactive / overview.total) * 100)
      : 0;
  const suspendedPercent =
    overview.total > 0
      ? Math.round((overview.suspended / overview.total) * 100)
      : 0;

  return (
    <div className='space-y-4'>
      {/* 第一行：统计卡片 */}
      <div className='bento-grid bento-grid-cols-4'>
        {/* 总租户数 - 大卡片 */}
        <div className='bento-card bento-card-hover col-span-1 md:col-span-2'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-blue-50 p-2.5 dark:bg-blue-950/30'>
                <Building2 className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <span className='bento-stat-label'>总租户数</span>
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

        {/* 活跃租户 */}
        <div className='bento-card bento-card-hover'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-green-50 p-2.5 dark:bg-green-950/30'>
                <Building className='h-5 w-5 text-green-600 dark:text-green-400' />
              </div>
              <span className='bento-stat-label'>活跃租户</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-green-600 dark:text-green-400'>
            {overview.active.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            占比 {activePercent}%
          </div>
        </div>

        {/* 停用租户 */}
        <div className='bento-card bento-card-hover'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-gray-50 p-2.5 dark:bg-gray-950/30'>
                <Ban className='h-5 w-5 text-gray-600 dark:text-gray-400' />
              </div>
              <span className='bento-stat-label'>停用租户</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-gray-600 dark:text-gray-400'>
            {overview.inactive.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            占比 {inactivePercent}%
          </div>
        </div>
      </div>

      {/* 第二行：扩展统计 */}
      <div className='bento-grid bento-grid-cols-4'>
        {/* 暂停租户 */}
        <div className='bento-card bento-card-hover'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-red-50 p-2.5 dark:bg-red-950/30'>
                <Ban className='h-5 w-5 text-red-600 dark:text-red-400' />
              </div>
              <span className='bento-stat-label'>暂停租户</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-red-600 dark:text-red-400'>
            {overview.suspended.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            占比 {suspendedPercent}%
          </div>
        </div>

        {/* 用户总数 */}
        <div className='bento-card bento-card-hover'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-purple-50 p-2.5 dark:bg-purple-950/30'>
                <Users className='h-5 w-5 text-purple-600 dark:text-purple-400' />
              </div>
              <span className='bento-stat-label'>用户总数</span>
            </div>
          </div>
          <div className='bento-stat-number mb-2 text-purple-600 dark:text-purple-400'>
            {users.total.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            活跃 {users.active.toLocaleString()}
          </div>
        </div>

        {/* 增长趋势 */}
        <div className='bento-card bento-card-hover col-span-1 md:col-span-2'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='rounded-xl bg-cyan-50 p-2.5 dark:bg-cyan-950/30'>
              <TrendingUp className='h-5 w-5 text-cyan-600 dark:text-cyan-400' />
            </div>
            <span className='font-medium text-gray-700 dark:text-gray-300'>
              增长趋势
            </span>
          </div>
          <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                今日新增
              </span>
              <Badge
                variant='secondary'
                className='border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/30'
              >
                +{growth.today.toLocaleString()}
              </Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                本周新增
              </span>
              <Badge
                variant='secondary'
                className='border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/30'
              >
                +{growth.week.toLocaleString()}
              </Badge>
            </div>
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
            <div className='col-span-2 border-t border-gray-100 pt-2 dark:border-gray-800'>
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
            <div className='col-span-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600'>
              <Calendar className='h-3 w-3' />
              对比上月增长率
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
