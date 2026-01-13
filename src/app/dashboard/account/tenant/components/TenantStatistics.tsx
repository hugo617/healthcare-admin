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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
 * 统计卡片组件 - 现代简约风格
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendValue,
  colorClass,
  className
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorClass?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm',
        'shadow-sm transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <CardContent className='p-4'>
        <div className='flex items-start justify-between'>
          {/* 图标和标签 */}
          <div className='flex-1'>
            <div className='mb-2.5 flex items-center gap-2'>
              <div
                className={cn(
                  'flex rounded-lg p-1.5',
                  'transition-colors duration-200',
                  colorClass
                )}
              >
                <Icon className='h-3.5 w-3.5' />
              </div>
              <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                {label}
              </span>
            </div>

            {/* 主数值 */}
            <div className='font-heading text-2xl leading-none font-semibold text-gray-900 dark:text-gray-100'>
              {value}
            </div>

            {/* 次要数值和趋势 */}
            <div className='mt-1.5 flex items-center gap-2'>
              {subValue && (
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  {subValue}
                </span>
              )}
              {trend && trendValue && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    trend === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : trend === 'down'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {trend === 'up' && <ArrowUp className='h-3 w-3' />}
                  {trend === 'down' && <ArrowDown className='h-3 w-3' />}
                  {trendValue}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 租户统计信息组件 - 现代简约风格
 * 展示租户总数、状态分布、用户数、增长趋势等关键统计数据
 */
export function TenantStatistics({
  statistics,
  loading = false
}: TenantStatisticsProps) {
  // 加载骨架屏
  if (loading) {
    return (
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
        {[...Array(6)].map((_, i) => (
          <Card
            key={i}
            className='overflow-hidden border-0 bg-white/80 shadow-sm'
          >
            <CardContent className='p-4'>
              <div className='mb-2.5 h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
              <div className='mb-1 h-7 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
              <div className='h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const { overview, users, growth } = statistics;

  const activePercent =
    overview.total > 0
      ? Math.round((overview.active / overview.total) * 100)
      : 0;

  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
      {/* 总租户数 */}
      <StatCard
        icon={Building2}
        label='总租户数'
        value={overview.total.toLocaleString()}
        colorClass='bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
      />

      {/* 活跃租户 */}
      <StatCard
        icon={Building}
        label='活跃租户'
        value={overview.active.toLocaleString()}
        subValue={`${activePercent}%`}
        colorClass='bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
      />

      {/* 停用租户 */}
      <StatCard
        icon={Ban}
        label='停用租户'
        value={overview.inactive.toLocaleString()}
        colorClass='bg-gray-50 text-gray-600 dark:bg-gray-950/30 dark:text-gray-400'
      />

      {/* 暂停租户 */}
      <StatCard
        icon={Ban}
        label='暂停租户'
        value={overview.suspended.toLocaleString()}
        colorClass='bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
      />

      {/* 用户总数 */}
      <StatCard
        icon={Users}
        label='用户总数'
        value={users.total.toLocaleString()}
        colorClass='bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
      />

      {/* 本月新增 */}
      <StatCard
        icon={TrendingUp}
        label='本月新增'
        value={`+${growth.thisMonth.toLocaleString()}`}
        trend={growth.growthRate >= 0 ? 'up' : 'down'}
        trendValue={`${Math.abs(growth.growthRate)}%`}
        colorClass='bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400'
      />
    </div>
  );
}
