'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface HealthRecord {
  id?: number;
  recordDate: string;
  bloodPressure: { systolic?: number; diastolic?: number };
  bloodSugar: { value?: number; unit?: string };
  heartRate?: number;
  weight: { value?: number; unit?: string };
  temperature: { value?: number; unit?: string };
  notes: string;
}

interface HealthRecordFormProps {
  record?: HealthRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function HealthRecordForm({
  record,
  onClose,
  onSuccess
}: HealthRecordFormProps) {
  const isEditing = !!record?.id;
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    systolic: '',
    diastolic: '',
    bloodSugar: '',
    bloodSugarUnit: 'mmol/L',
    bloodSugarType: 'fasting',
    heartRate: '',
    weight: '',
    weightUnit: 'kg',
    temperature: '',
    temperatureUnit: '°C',
    notes: ''
  });

  useEffect(() => {
    if (record) {
      setFormData({
        recordDate: record.recordDate,
        systolic: record.bloodPressure.systolic?.toString() || '',
        diastolic: record.bloodPressure.diastolic?.toString() || '',
        bloodSugar: record.bloodSugar.value?.toString() || '',
        bloodSugarUnit: record.bloodSugar.unit || 'mmol/L',
        bloodSugarType: (record.bloodSugar as any)?.type || 'fasting',
        heartRate: record.heartRate?.toString() || '',
        weight: record.weight.value?.toString() || '',
        weightUnit: record.weight.unit || 'kg',
        temperature: record.temperature.value?.toString() || '',
        temperatureUnit: record.temperature.unit || '°C',
        notes: record.notes || ''
      });
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        recordDate: formData.recordDate,
        bloodPressure: {
          systolic: formData.systolic ? parseInt(formData.systolic) : undefined,
          diastolic: formData.diastolic
            ? parseInt(formData.diastolic)
            : undefined
        },
        bloodSugar: {
          value: formData.bloodSugar
            ? parseFloat(formData.bloodSugar)
            : undefined,
          unit: formData.bloodSugarUnit,
          type: formData.bloodSugarType
        },
        heartRate: formData.heartRate
          ? parseInt(formData.heartRate)
          : undefined,
        weight: {
          value: formData.weight ? parseFloat(formData.weight) : undefined,
          unit: formData.weightUnit
        },
        temperature: {
          value: formData.temperature
            ? parseFloat(formData.temperature)
            : undefined,
          unit: formData.temperatureUnit
        },
        notes: formData.notes
      };

      const url = isEditing ? `/api/h5/health/${record.id}` : '/api/h5/health';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success(isEditing ? '更新成功' : '添加成功');
        onSuccess();
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50'>
      <div className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6'>
        {/* 标题栏 */}
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-800'>
            {isEditing ? '编辑健康记录' : '添加健康记录'}
          </h2>
          <button
            onClick={onClose}
            className='rounded-full p-2 hover:bg-gray-100'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* 记录日期 */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              记录日期 <span className='text-red-500'>*</span>
            </label>
            <input
              type='date'
              required
              value={formData.recordDate}
              onChange={(e) =>
                setFormData({ ...formData, recordDate: e.target.value })
              }
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500'
            />
          </div>

          {/* 血压 */}
          <div className='rounded-xl bg-red-50 p-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              血压 (mmHg)
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                placeholder='收缩压'
                value={formData.systolic}
                onChange={(e) =>
                  setFormData({ ...formData, systolic: e.target.value })
                }
                className='flex-1 rounded-lg border border-gray-300 px-3 py-2'
              />
              <span className='text-gray-500'>/</span>
              <input
                type='number'
                placeholder='舒张压'
                value={formData.diastolic}
                onChange={(e) =>
                  setFormData({ ...formData, diastolic: e.target.value })
                }
                className='flex-1 rounded-lg border border-gray-300 px-3 py-2'
              />
            </div>
          </div>

          {/* 血糖 */}
          <div className='rounded-xl bg-blue-50 p-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              血糖
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                step='0.1'
                placeholder='血糖值'
                value={formData.bloodSugar}
                onChange={(e) =>
                  setFormData({ ...formData, bloodSugar: e.target.value })
                }
                className='flex-1 rounded-lg border border-gray-300 px-3 py-2'
              />
              <select
                value={formData.bloodSugarUnit}
                onChange={(e) =>
                  setFormData({ ...formData, bloodSugarUnit: e.target.value })
                }
                className='rounded-lg border border-gray-300 bg-white px-3 py-2'
              >
                <option value='mmol/L'>mmol/L</option>
                <option value='mg/dL'>mg/dL</option>
              </select>
            </div>
            <div className='mt-2 flex gap-2'>
              <button
                type='button'
                onClick={() =>
                  setFormData({ ...formData, bloodSugarType: 'fasting' })
                }
                className={`flex-1 rounded-lg px-3 py-1 text-sm ${
                  formData.bloodSugarType === 'fasting'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                空腹
              </button>
              <button
                type='button'
                onClick={() =>
                  setFormData({ ...formData, bloodSugarType: 'postprandial' })
                }
                className={`flex-1 rounded-lg px-3 py-1 text-sm ${
                  formData.bloodSugarType === 'postprandial'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                餐后
              </button>
            </div>
          </div>

          {/* 心率 */}
          <div className='rounded-xl bg-pink-50 p-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              心率 (bpm)
            </label>
            <input
              type='number'
              placeholder='心率值'
              value={formData.heartRate}
              onChange={(e) =>
                setFormData({ ...formData, heartRate: e.target.value })
              }
              className='w-full rounded-lg border border-gray-300 px-3 py-2'
            />
          </div>

          {/* 体重 */}
          <div className='rounded-xl bg-purple-50 p-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              体重
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                step='0.1'
                placeholder='体重值'
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                className='flex-1 rounded-lg border border-gray-300 px-3 py-2'
              />
              <select
                value={formData.weightUnit}
                onChange={(e) =>
                  setFormData({ ...formData, weightUnit: e.target.value })
                }
                className='rounded-lg border border-gray-300 bg-white px-3 py-2'
              >
                <option value='kg'>kg</option>
                <option value='斤'>斤</option>
                <option value='lb'>lb</option>
              </select>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              备注
            </label>
            <textarea
              placeholder='添加备注...'
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className='w-full resize-none rounded-xl border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500'
            />
          </div>

          {/* 提交按钮 */}
          <button
            type='submit'
            disabled={submitting}
            className='w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 font-medium text-white disabled:opacity-50'
          >
            {submitting ? '提交中...' : isEditing ? '更新' : '添加'}
          </button>
        </form>
      </div>
    </div>
  );
}
