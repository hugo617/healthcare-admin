'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';

interface SettingsSectionProps {
  onLogout: () => void;
}

export function SettingsSection({ onLogout }: SettingsSectionProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // 获取用户设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/h5/profile/settings');
        const result = await response.json();

        if (result.code === 0) {
          setNotificationsEnabled(result.data.notificationsEnabled ?? true);
          setDarkMode(result.data.darkMode ?? false);
        }
      } catch (error) {
        console.error('获取设置失败:', error);
      }
    };

    fetchSettings();
  }, []);

  // 更新设置
  const updateSetting = async (key: string, value: boolean) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch('/api/h5/profile/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [key]: value
        })
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success('设置已更新');

        // 更新本地存储
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (!user.metadata) user.metadata = {};
          user.metadata[key] = value;
          localStorage.setItem('user', JSON.stringify(user));
        }

        if (key === 'notificationsEnabled') {
          setNotificationsEnabled(value);
        } else if (key === 'darkMode') {
          setDarkMode(value);
          // 应用深色模式
          if (value) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } else {
        toast.error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新设置失败:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    updateSetting('notificationsEnabled', newValue);
  };

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    updateSetting('darkMode', newValue);
  };

  return (
    <div className='space-y-4'>
      {/* 设置选项 */}
      <NeumorphicCard className='p-5'>
        <h3 className='mb-4 text-base font-semibold text-gray-800'>设置</h3>
        <div className='space-y-3'>
          {/* 消息通知 */}
          <div className='flex cursor-pointer items-center justify-between rounded-xl bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 active:scale-[0.99]'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-white p-2.5 shadow-sm'>
                <Bell
                  className={`h-5 w-5 ${notificationsEnabled ? 'text-primary-500' : 'text-neutral-400'}`}
                />
              </div>
              <div>
                <p className='font-medium text-gray-800'>消息通知</p>
                <p className='text-xs text-neutral-500'>
                  {notificationsEnabled ? '已开启' : '已关闭'}
                </p>
              </div>
            </div>
            <button
              onClick={handleNotificationToggle}
              disabled={loading}
              className={`shadow-elevation-xs relative h-12 w-20 rounded-full transition-all duration-300 ${
                notificationsEnabled ? 'bg-primary-500' : 'bg-neutral-300'
              } ${loading ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
            >
              <div
                className={`absolute top-1 h-10 w-10 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  notificationsEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 深色模式 */}
          <div className='flex cursor-pointer items-center justify-between rounded-xl bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 active:scale-[0.99]'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-white p-2.5 shadow-sm'>
                <Moon
                  className={`h-5 w-5 ${darkMode ? 'text-primary-500' : 'text-neutral-400'}`}
                />
              </div>
              <div>
                <p className='font-medium text-gray-800'>深色模式</p>
                <p className='text-xs text-neutral-500'>
                  {darkMode ? '已开启' : '已关闭'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDarkModeToggle}
              disabled={loading}
              className={`shadow-elevation-xs relative h-12 w-20 rounded-full transition-all duration-300 ${
                darkMode ? 'bg-primary-500' : 'bg-neutral-300'
              } ${loading ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
            >
              <div
                className={`absolute top-1 h-10 w-10 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  darkMode ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </NeumorphicCard>

      {/* 退出登录 */}
      <button
        onClick={onLogout}
        className='bg-error/10 text-error hover:bg-error/20 w-full rounded-xl py-3 font-medium transition-colors active:scale-95'
      >
        退出登录
      </button>

      {/* 版本信息 */}
      <div className='py-6 text-center'>
        <p className='text-sm font-medium text-neutral-800'>N-Admin H5</p>
        <p className='mt-1 text-xs text-neutral-500'>
          版本 1.0.0 · 健康生活助手
        </p>
      </div>
    </div>
  );
}
