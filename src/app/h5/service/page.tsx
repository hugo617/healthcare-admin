'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { H5AuthManager } from '@/lib/h5-auth';
import { BottomNavigation } from '@/components/h5/common/BottomNavigation';
import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';
import { BackgroundDecoration } from '@/components/h5/common/BackgroundDecoration';
import { AppointmentList } from '@/components/h5/service/AppointmentList';
import { AppointmentForm } from '@/components/h5/service/AppointmentForm';

interface ServiceAppointment {
  id: bigint;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
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

export default function ServicePage() {
  const authManager = H5AuthManager.getInstance();
  const { isAuthenticated } = authManager.getAuthState();

  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/h5/login';
      return;
    }

    fetchAppointments();
  }, [isAuthenticated, filterStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/h5/appointments?${params.toString()}`);
      const result = await response.json();

      if (result.code === 0) {
        setAppointments(result.data || []);
      } else {
        toast.error(result.message || '获取预约列表失败');
      }
    } catch (error) {
      console.error('获取预约列表失败:', error);
      toast.error('获取预约列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = () => {
    setShowForm(true);
  };

  const handleCancelAppointment = async (id: bigint) => {
    if (!confirm('确定要取消这个预约吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/h5/appointments/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.code === 0) {
        toast.success('预约已取消');
        fetchAppointments();
      } else {
        toast.error(result.message || '取消失败');
      }
    } catch (error) {
      console.error('取消预约失败:', error);
      toast.error('取消预约失败');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchAppointments();
  };

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-20'>
      <BackgroundDecoration />

      {/* 顶部标题栏 */}
      <div className='sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md'>
        <div className='mx-auto flex max-w-md items-center justify-between'>
          <h1 className='text-xl font-bold text-gray-800'>服务预约</h1>
          <button
            onClick={handleAddAppointment}
            className='rounded-full bg-gradient-to-r from-green-500 to-blue-500 p-2 text-white shadow-lg'
          >
            <Calendar className='h-5 w-5' />
          </button>
        </div>
      </div>

      <div className='mx-auto max-w-md space-y-6 px-4 py-6'>
        {/* 筛选标签 */}
        <div className='flex gap-2 overflow-x-auto pb-2'>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {status === 'all' ? '全部' : STATUS_LABELS[status]}
              </button>
            )
          )}
        </div>

        {/* 即将到来的预约 */}
        {upcomingAppointments.length > 0 && (
          <NeumorphicCard className='p-5'>
            <h2 className='mb-4 text-base font-semibold text-gray-800'>
              即将到来的预约
            </h2>
            <AppointmentList
              appointments={upcomingAppointments}
              onCancel={handleCancelAppointment}
            />
          </NeumorphicCard>
        )}

        {/* 历史预约 */}
        {pastAppointments.length > 0 && (
          <NeumorphicCard className='p-5'>
            <h2 className='mb-4 text-base font-semibold text-gray-800'>
              历史预约
            </h2>
            <AppointmentList
              appointments={pastAppointments}
              onCancel={handleCancelAppointment}
            />
          </NeumorphicCard>
        )}

        {/* 空状态 */}
        {loading ? (
          <div className='py-8 text-center'>
            <div className='mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-500'></div>
            <p className='text-gray-600'>加载中...</p>
          </div>
        ) : appointments.length === 0 ? (
          <NeumorphicCard className='p-5'>
            <div className='py-8 text-center text-gray-500'>
              <Calendar className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <p className='mb-2 text-lg font-medium'>暂无预约记录</p>
              <p className='mb-4 text-sm'>点击右上角日历图标创建第一个预约</p>
            </div>
          </NeumorphicCard>
        ) : null}
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <AppointmentForm
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* 底部导航 */}
      <BottomNavigation />
    </div>
  );
}
