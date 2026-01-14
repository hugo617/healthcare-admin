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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-800'
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
      <div className='py-4 text-center text-sm text-gray-500'>暂无预约记录</div>
    );
  }

  return (
    <div className='space-y-3'>
      {appointments.map((appointment) => (
        <div
          key={appointment.id.toString()}
          className='rounded-2xl border border-gray-100 bg-gray-50 p-4'
        >
          <div className='mb-3 flex items-start justify-between'>
            <div className='flex-1'>
              <h3 className='mb-1 font-semibold text-gray-800'>
                {SERVICE_TYPE_LABELS[appointment.serviceType] ||
                  appointment.serviceType}
              </h3>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  {appointment.appointmentDate}
                </div>
                <div className='flex items-center gap-1'>
                  <Clock className='h-4 w-4' />
                  {appointment.appointmentTime}
                </div>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[appointment.status]}`}
            >
              {STATUS_LABELS[appointment.status]}
            </span>
          </div>

          {appointment.notes && (
            <div className='mb-3 flex items-start gap-2 text-sm text-gray-600'>
              <FileText className='mt-0.5 h-4 w-4 flex-shrink-0' />
              <p className='line-clamp-2'>{appointment.notes}</p>
            </div>
          )}

          {(appointment.status === 'pending' ||
            appointment.status === 'confirmed') && (
            <button
              onClick={() => onCancel(appointment.id)}
              className='text-sm text-red-500 hover:text-red-700'
            >
              取消预约
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
