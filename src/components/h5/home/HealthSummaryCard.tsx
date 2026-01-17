'use client';

import { useEffect, useState } from 'react';

interface HealthMetric {
  value: string | number;
  label: string;
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  progress?: number;
}

export function HealthSummaryCard() {
  const [therapyCount, setTherapyCount] = useState<number>(0);
  const [weeklyNewCount, setWeeklyNewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTherapyCount();
  }, []);

  const loadTherapyCount = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('未找到认证 token');
        setIsLoading(false);
        return;
      }

      // 直接获取当前用户的所有服务记录
      const recordsResponse = await fetch(
        '/api/service-records?page=1&pageSize=1000',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!recordsResponse.ok) {
        console.error(
          'API 请求失败:',
          recordsResponse.status,
          recordsResponse.statusText
        );
        const errorText = await recordsResponse.text();
        console.error('错误详情:', errorText);
        setIsLoading(false);
        return;
      }

      const recordsData = await recordsResponse.json();
      console.log('服务记录响应:', recordsData);

      const records = recordsData.data?.list || [];
      const count = records.length;
      console.log('理疗次数:', count);
      setTherapyCount(count);

      // 计算本周新增次数
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weeklyCount = records.filter((record: any) => {
        // serviceDate 格式为 "YYYY/MM/DD"，需要转换为 Date 对象
        const recordDate = new Date(record.serviceDate);
        return recordDate >= weekStart && recordDate <= weekEnd;
      }).length;

      console.log('本周新增次数:', weeklyCount);
      setWeeklyNewCount(weeklyCount);
    } catch (error) {
      console.error('加载理疗次数失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics: HealthMetric[] = [
    {
      value: '120/80',
      label: '最近血压情况',
      unit: 'mmHg',
      icon: (
        <svg
          className='h-5 w-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      ),
      gradient: 'from-violet-400 to-purple-500',
      trend: { value: '正常', isUp: true }
    },
    {
      value: therapyCount.toString(),
      label: '理疗次数',
      unit: '次',
      icon: (
        <svg
          className='h-5 w-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
          />
        </svg>
      ),
      gradient: 'from-teal-400 to-cyan-500',
      ...(weeklyNewCount > 0 && {
        trend: { value: `本周+${weeklyNewCount}`, isUp: true }
      })
    }
  ];

  return (
    <div className='mx-4 mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='font-heading text-base text-slate-800'>今日健康</h3>
        <span className='text-xs text-slate-400'>实时更新</span>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        {metrics.map((metric, index) => (
          <div key={index} className='text-center'>
            {/* 图标 */}
            <div
              className={`mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-lg`}
            >
              {metric.icon}
            </div>

            {/* 数值 */}
            <p className='font-heading text-lg font-semibold text-slate-800'>
              {metric.value}
            </p>

            {/* 进度条（仅步数） */}
            {metric.progress !== undefined && (
              <div className='mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
                <div
                  className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full transition-all duration-500`}
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            )}

            {/* 趋势指示器 */}
            {metric.trend && (
              <div
                className={`mt-1 flex items-center justify-center gap-0.5 ${
                  metric.trend.isUp ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {metric.trend.isUp ? (
                  <svg
                    className='h-3 w-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 10l7-7m0 0l7 7m-7-7v18'
                    />
                  </svg>
                ) : (
                  <svg
                    className='h-3 w-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 14l-7 7m0 0l-7-7m7 7V3'
                    />
                  </svg>
                )}
                <span className='text-[10px]'>{metric.trend.value}</span>
              </div>
            )}

            {/* 标签 */}
            <p className='mt-1 text-xs text-slate-500'>{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
