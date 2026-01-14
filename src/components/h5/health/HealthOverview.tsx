'use client';

import React from 'react';
import { Heart, Activity, Droplet, Weight } from 'lucide-react';
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

interface HealthOverviewProps {
  records: HealthRecord[];
}

export function HealthOverview({ records }: HealthOverviewProps) {
  // 获取最新记录
  const latestRecord = records.length > 0 ? records[0] : null;

  // 计算平均值
  const avgHeartRate =
    records.length > 0
      ? Math.round(
          records
            .filter((r) => r.heartRate)
            .reduce((sum, r) => sum + (r.heartRate || 0), 0) /
            records.filter((r) => r.heartRate).length
        )
      : null;

  const avgSystolic =
    records.length > 0
      ? Math.round(
          records
            .filter((r) => r.bloodPressure?.systolic)
            .reduce((sum, r) => sum + (r.bloodPressure?.systolic || 0), 0) /
            records.filter((r) => r.bloodPressure?.systolic).length
        )
      : null;

  const avgDiastolic =
    records.length > 0
      ? Math.round(
          records
            .filter((r) => r.bloodPressure?.diastolic)
            .reduce((sum, r) => sum + (r.bloodPressure?.diastolic || 0), 0) /
            records.filter((r) => r.bloodPressure?.diastolic).length
        )
      : null;

  const latestWeight = latestRecord?.weight?.value;

  const stats = [
    {
      title: '血压',
      value: latestRecord?.bloodPressure?.systolic
        ? `${latestRecord.bloodPressure.systolic}/${latestRecord.bloodPressure.diastolic}`
        : avgSystolic
          ? `${avgSystolic}/${avgDiastolic}`
          : '-',
      unit: 'mmHg',
      icon: <Heart className='h-5 w-5 text-red-500' />,
      bgColor: 'bg-red-50'
    },
    {
      title: '心率',
      value:
        latestRecord?.heartRate?.toString() || avgHeartRate?.toString() || '-',
      unit: 'bpm',
      icon: <Activity className='h-5 w-5 text-pink-500' />,
      bgColor: 'bg-pink-50'
    },
    {
      title: '血糖',
      value: latestRecord?.bloodSugar?.value?.toString() || '-',
      unit: latestRecord?.bloodSugar?.unit || 'mmol/L',
      icon: <Droplet className='h-5 w-5 text-blue-500' />,
      bgColor: 'bg-blue-50'
    },
    {
      title: '体重',
      value: latestWeight?.toString() || '-',
      unit: latestRecord?.weight?.unit || 'kg',
      icon: <Weight className='h-5 w-5 text-purple-500' />,
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <NeumorphicCard>
      <h3 className='mb-4 text-lg font-semibold text-gray-800'>健康概览</h3>
      <div className='grid grid-cols-2 gap-3'>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} flex items-center gap-3 rounded-2xl p-3`}
          >
            <div className='flex-shrink-0'>{stat.icon}</div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs text-gray-600'>{stat.title}</p>
              <p className='truncate text-lg font-bold text-gray-800'>
                {stat.value}
              </p>
              <p className='text-xs text-gray-500'>{stat.unit}</p>
            </div>
          </div>
        ))}
      </div>
    </NeumorphicCard>
  );
}
