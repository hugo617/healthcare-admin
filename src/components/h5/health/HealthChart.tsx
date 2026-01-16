'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';

interface HealthRecord {
  id: number;
  recordDate: string;
  bloodPressure: { systolic?: number; diastolic?: number };
  bloodSugar: { value?: number; unit?: string };
  heartRate?: number;
  weight: { value?: number; unit?: string };
  temperature: { value?: number; unit?: string };
}

interface HealthChartProps {
  records: HealthRecord[];
}

export function HealthChart({ records }: HealthChartProps) {
  // 获取最近 7 天的记录
  const recentRecords = records.slice(0, 7).reverse();

  // 计算图表数据（以心率为例）
  const chartData = recentRecords
    .filter((r) => r.heartRate)
    .map((r) => ({
      date: new Date(r.recordDate).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      }),
      value: r.heartRate
    }));

  const maxValue = Math.max(...chartData.map((d) => d.value ?? 0), 100);
  const minValue = Math.min(...chartData.map((d) => d.value ?? 0), 60);

  // 生成简单的 SVG 折线图
  const width = 300;
  const height = 120;
  const padding = 10;

  const points = chartData
    .map((d, i) => {
      const x =
        padding + (i / (chartData.length - 1 || 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        (((d.value ?? 0) - minValue) / (maxValue - minValue || 1)) *
          (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <NeumorphicCard className='p-5'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-base font-semibold text-gray-800'>健康趋势</h3>
        <div className='flex items-center text-sm text-gray-500'>
          <TrendingUp className='mr-1 h-4 w-4' />近 7 天心率
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className='py-8 text-center text-gray-500'>
          <TrendingUp className='mx-auto mb-3 h-12 w-12 text-gray-400' />
          <p>暂无趋势数据</p>
          <p className='text-sm'>添加包含心率数据的记录以查看趋势</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* SVG 折线图 */}
          <div className='flex justify-center'>
            <svg
              width='100%'
              height={height}
              viewBox={`0 0 ${width} ${height}`}
            >
              {/* 折线 */}
              <polyline
                fill='none'
                stroke='url(#chartGradient)'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                points={points}
              />
              {/* 数据点 */}
              {chartData.map((d, i) => {
                const x =
                  padding +
                  (i / (chartData.length - 1 || 1)) * (width - 2 * padding);
                const y =
                  height -
                  padding -
                  (((d.value ?? 0) - minValue) / (maxValue - minValue || 1)) *
                    (height - 2 * padding);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r='5'
                    fill='white'
                    stroke='#10b981'
                    strokeWidth='2.5'
                    className='hover:r-7 cursor-pointer transition-all'
                  />
                );
              })}
              {/* 渐变定义 */}
              <defs>
                <linearGradient
                  id='chartGradient'
                  x1='0%'
                  y1='0%'
                  x2='100%'
                  y2='0%'
                >
                  <stop offset='0%' stopColor='#10b981' />
                  <stop offset='100%' stopColor='#6ee7b7' />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* X 轴标签 */}
          <div className='flex justify-between px-2'>
            {chartData.map((d, i) => (
              <div key={i} className='text-xs text-neutral-500'>
                {d.date}
              </div>
            ))}
          </div>

          {/* 数据列表 */}
          <div className='flex justify-between gap-2 overflow-x-auto pb-2'>
            {chartData.map((d, i) => (
              <div
                key={i}
                className='from-primary-50 to-sage-light border-primary-100/50 flex-shrink-0 rounded-xl border bg-gradient-to-br px-3 py-2.5 text-center'
              >
                <p className='text-primary-600 text-2xl font-bold'>{d.value}</p>
                <p className='text-xs text-neutral-500'>bpm</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </NeumorphicCard>
  );
}
