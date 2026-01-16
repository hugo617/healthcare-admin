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
    <div className='animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm'>
      <div className='shadow-elevation-xl animate-slide-up max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white'>
        {/* 标题栏 */}
        <div className='sticky top-0 z-10 border-b border-neutral-100 bg-white px-6 py-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-gray-800'>创建服务预约</h2>
            <button
              onClick={onClose}
              className='rounded-full p-2 text-neutral-500 transition-all hover:bg-neutral-100 active:scale-95'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className='space-y-5 p-6'>
          {/* 选择日期 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              <Calendar className='text-primary-500 mr-1 inline h-4 w-4' />
              选择日期 <span className='text-error'>*</span>
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  type='button'
                  onClick={() => setSelectedDate(date.value)}
                  className={`shadow-elevation-xs rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    selectedDate === date.value
                      ? 'from-primary-500 to-sage shadow-elevation-sm bg-gradient-to-r text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95'
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
              <Clock className='text-primary-500 mr-1 inline h-4 w-4' />
              选择时间 <span className='text-error'>*</span>
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type='button'
                  onClick={() => setSelectedTime(time)}
                  className={`shadow-elevation-xs rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    selectedTime === time
                      ? 'from-primary-500 to-sage shadow-elevation-sm bg-gradient-to-r text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95'
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
              服务类型 <span className='text-error'>*</span>
            </label>
            <div className='space-y-2'>
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type='button'
                  onClick={() => setSelectedService(type.value)}
                  className={`shadow-elevation-xs w-full rounded-xl px-4 py-3 text-left font-medium transition-all ${
                    selectedService === type.value
                      ? 'from-primary-500 to-sage shadow-elevation-sm bg-gradient-to-r text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              备注
            </label>
            <textarea
              placeholder='添加备注（可选）...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className='focus:border-primary-500 focus:ring-primary-500/20 w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 transition-all outline-none focus:ring-2'
            />
          </div>

          {/* 提交按钮 */}
          <button
            type='submit'
            disabled={
              submitting || !selectedDate || !selectedTime || !selectedService
            }
            className='from-primary-500 to-sage shadow-elevation-sm hover:shadow-elevation-md w-full rounded-xl bg-gradient-to-r py-3.5 font-medium text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {submitting ? '提交中...' : '确认预约'}
          </button>
        </form>
      </div>
    </div>
  );
}
