'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { H5AuthManager } from '@/lib/h5-auth';
import { BottomNavigation } from '@/components/h5/common/BottomNavigation';
import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';
import { BackgroundDecoration } from '@/components/h5/common/BackgroundDecoration';
import { HealthOverview } from '@/components/h5/health/HealthOverview';
import { HealthChart } from '@/components/h5/health/HealthChart';
import { HealthRecordForm } from '@/components/h5/health/HealthRecordForm';

interface HealthRecord {
  id: number;
  recordDate: string;
  bloodPressure: { systolic?: number; diastolic?: number };
  bloodSugar: { value?: number; unit?: string; type?: string };
  heartRate?: number;
  weight: { value?: number; unit?: string };
  temperature: { value?: number; unit?: string };
  notes: string;
}

export default function HealthPage() {
  const authManager = H5AuthManager.getInstance();
  const { isAuthenticated } = authManager.getAuthState();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/h5/login';
      return;
    }

    fetchRecords();
  }, [isAuthenticated]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/h5/health');
      const result = await response.json();

      if (result.code === 0) {
        setRecords(result.data || []);
      } else {
        toast.error(result.message || '获取健康数据失败');
      }
    } catch (error) {
      console.error('获取健康数据失败:', error);
      toast.error('获取健康数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEditRecord = (record: HealthRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('确定要删除这条健康记录吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/h5/health/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.code === 0) {
        toast.success('删除成功');
        fetchRecords();
      } else {
        toast.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRecord(null);
    fetchRecords();
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
        <BackgroundDecoration />
        <div className='flex min-h-screen items-center justify-center'>
          <div className='text-center'>
            <div className='mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500'></div>
            <p className='text-gray-600'>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20'>
      <BackgroundDecoration />

      {/* 顶部标题栏 */}
      <div className='sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md'>
        <div className='mx-auto flex max-w-md items-center justify-between'>
          <h1 className='text-xl font-bold text-gray-800'>健康数据</h1>
          <button
            onClick={handleAddRecord}
            className='rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-2 text-white shadow-lg'
          >
            <Plus className='h-5 w-5' />
          </button>
        </div>
      </div>

      <div className='mx-auto max-w-md space-y-6 px-4 py-6'>
        {/* 健康概览 */}
        <HealthOverview records={records} />

        {/* 健康趋势图表 */}
        {records.length > 0 && <HealthChart records={records} />}

        {/* 健康记录列表 */}
        <NeumorphicCard className='p-5'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-base font-semibold text-gray-800'>健康记录</h2>
            <div className='flex items-center text-sm text-gray-500'>
              <Activity className='mr-1 h-4 w-4' />
              {records.length} 条记录
            </div>
          </div>

          {records.length === 0 ? (
            <div className='py-8 text-center text-gray-500'>
              <Activity className='mx-auto mb-3 h-12 w-12 text-gray-400' />
              <p>暂无健康记录</p>
              <p className='text-sm'>点击右上角 + 添加第一条记录</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {records.map((record) => (
                <div
                  key={record.id}
                  className='rounded-2xl border border-gray-100 bg-gray-50 p-4'
                >
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-800'>
                      {record.recordDate}
                    </span>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleEditRecord(record)}
                        className='text-sm text-blue-500'
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className='text-sm text-red-500'
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    {record.bloodPressure?.systolic && (
                      <div>
                        <span className='text-gray-500'>血压：</span>
                        <span className='font-medium'>
                          {record.bloodPressure.systolic}/
                          {record.bloodPressure.diastolic} mmHg
                        </span>
                      </div>
                    )}
                    {record.heartRate && (
                      <div>
                        <span className='text-gray-500'>心率：</span>
                        <span className='font-medium'>
                          {record.heartRate} bpm
                        </span>
                      </div>
                    )}
                    {record.bloodSugar?.value && (
                      <div>
                        <span className='text-gray-500'>血糖：</span>
                        <span className='font-medium'>
                          {record.bloodSugar.value}{' '}
                          {record.bloodSugar.unit || 'mmol/L'}
                        </span>
                      </div>
                    )}
                    {record.weight?.value && (
                      <div>
                        <span className='text-gray-500'>体重：</span>
                        <span className='font-medium'>
                          {record.weight.value} {record.weight.unit || 'kg'}
                        </span>
                      </div>
                    )}
                  </div>

                  {record.notes && (
                    <div className='mt-2 text-sm text-gray-600'>
                      <span className='text-gray-500'>备注：</span>
                      {record.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </NeumorphicCard>
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <HealthRecordForm
          record={editingRecord}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* 底部导航 */}
      <BottomNavigation />
    </div>
  );
}
