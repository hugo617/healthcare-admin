'use client';

import React from 'react';
import { Clock, Calendar, FileText } from 'lucide-react';

interface ServiceAppointment {
  id: bigint;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
}

interface AppointmentListProps {
  appointments: ServiceAppointment[];
  onCancel: (id: bigint) => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border border-warning/30',
  confirmed: 'bg-success/20 text-success border border-success/30',
  completed: 'bg-info/20 text-info border border-info/30',
  cancelled: 'bg-neutral-100 text-neutral-500 border border-neutral-200'
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  'health-check': '健康检查',
  massage: '按摩理疗',
  acupuncture: '针灸理疗',
  'physical-therapy': '物理治疗',
  consultation: '健康咨询',
  other: '其他服务'
};

export function AppointmentList({
  appointments,
  onCancel
}: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className='py-12 text-center'>
        <Calendar className='mx-auto mb-3 h-12 w-12 text-neutral-300' />
        <p className='text-sm text-neutral-500'>暂无预约记录</p>
        <p className='mt-1 text-xs text-neutral-400'>点击下方按钮创建新预约</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {appointments.map((appointment) => (
        <div
          key={appointment.id.toString()}
          className='group shadow-elevation-xs hover:shadow-elevation-sm rounded-2xl border border-neutral-200 bg-white p-4 transition-all'
        >
          <div className='mb-3 flex items-start justify-between'>
            <div className='flex-1'>
              <h3 className='mb-2 font-semibold text-gray-800'>
                {SERVICE_TYPE_LABELS[appointment.serviceType] ||
                  appointment.serviceType}
              </h3>
              <div className='flex flex-wrap items-center gap-3 text-sm text-neutral-600'>
                <div className='bg-primary-50 flex items-center gap-1.5 rounded-full px-2.5 py-1'>
                  <Calendar className='text-primary-500 h-3.5 w-3.5' />
                  <span className='text-primary-700 font-medium'>
                    {appointment.appointmentDate}
                  </span>
                </div>
                <div className='bg-sage/20 flex items-center gap-1.5 rounded-full px-2.5 py-1'>
                  <Clock className='text-sage h-3.5 w-3.5' />
                  <span className='text-sage-800 font-medium'>
                    {appointment.appointmentTime}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_COLORS[appointment.status]}`}
            >
              {STATUS_LABELS[appointment.status]}
            </span>
          </div>

          {appointment.notes && (
            <div className='mb-3 flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600'>
              <FileText className='mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400' />
              <p className='line-clamp-2'>{appointment.notes}</p>
            </div>
          )}

          {(appointment.status === 'pending' ||
            appointment.status === 'confirmed') && (
            <button
              onClick={() => onCancel(appointment.id)}
              className='text-error hover:text-error/80 active:text-error/60 text-sm transition-colors'
            >
              取消预约
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
