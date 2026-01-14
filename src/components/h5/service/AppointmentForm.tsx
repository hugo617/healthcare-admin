'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

// 可用的服务类型
const SERVICE_TYPES = [
  { value: 'health-check', label: '健康检查' },
  { value: 'massage', label: '按摩理疗' },
  { value: 'acupuncture', label: '针灸理疗' },
  { value: 'physical-therapy', label: '物理治疗' },
  { value: 'consultation', label: '健康咨询' },
  { value: 'other', label: '其他服务' }
];

// 可用的时间段（9:00 - 17:00，每30分钟一个时段）
const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00'
];

export function AppointmentForm({ onClose, onSuccess }: AppointmentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [notes, setNotes] = useState('');

  // 获取今天及未来7天的日期
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
          weekday: 'short'
        })
      });
    }

    return dates;
  };

  const availableDates = getAvailableDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        serviceType: selectedService,
        notes
      };

      const response = await fetch('/api/h5/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success('预约创建成功');
        onSuccess();
      } else {
        toast.error(result.message || '预约失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('预约失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50'>
      <div className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6'>
        {/* 标题栏 */}
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-800'>创建服务预约</h2>
          <button
            onClick={onClose}
            className='rounded-full p-2 hover:bg-gray-100'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* 选择日期 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              <Calendar className='mr-1 inline h-4 w-4' />
              选择日期 <span className='text-red-500'>*</span>
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  type='button'
                  onClick={() => setSelectedDate(date.value)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    selectedDate === date.value
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {date.label}
                </button>
              ))}
            </div>
          </div>

          {/* 选择时间 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              <Clock className='mr-1 inline h-4 w-4' />
              选择时间 <span className='text-red-500'>*</span>
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type='button'
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* 服务类型 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              服务类型 <span className='text-red-500'>*</span>
            </label>
            <div className='space-y-2'>
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type='button'
                  onClick={() => setSelectedService(type.value)}
                  className={`w-full rounded-xl px-4 py-3 text-left font-medium transition-colors ${
                    selectedService === type.value
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              备注
            </label>
            <textarea
              placeholder='添加备注（可选）...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className='w-full resize-none rounded-xl border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500'
            />
          </div>

          {/* 提交按钮 */}
          <button
            type='submit'
            disabled={
              submitting || !selectedDate || !selectedTime || !selectedService
            }
            className='w-full rounded-xl bg-gradient-to-r from-green-500 to-blue-500 py-3 font-medium text-white disabled:opacity-50'
          >
            {submitting ? '提交中...' : '确认预约'}
          </button>
        </form>
      </div>
    </div>
  );
}
