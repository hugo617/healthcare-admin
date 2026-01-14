'use client';

import React from 'react';
import { Settings, Bell, Shield, Moon, ChevronRight } from 'lucide-react';
import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';

interface SettingsSectionProps {
  onLogout: () => void;
}

export function SettingsSection({ onLogout }: SettingsSectionProps) {
  const settings = [
    {
      icon: <Bell className='h-5 w-5 text-blue-500' />,
      title: '消息通知',
      description: '管理推送通知设置'
    },
    {
      icon: <Shield className='h-5 w-5 text-green-500' />,
      title: '隐私设置',
      description: '管理个人隐私选项'
    },
    {
      icon: <Moon className='h-5 w-5 text-purple-500' />,
      title: '外观设置',
      description: '切换深色/浅色模式'
    }
  ];

  return (
    <div className='space-y-4'>
      {/* 设置选项 */}
      <NeumorphicCard>
        <h3 className='mb-4 text-lg font-semibold text-gray-800'>设置</h3>
        <div className='space-y-2'>
          {settings.map((setting, index) => (
            <div
              key={index}
              className='flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100'
            >
              <div className='flex items-center gap-3'>
                <div className='rounded-full bg-white p-2'>{setting.icon}</div>
                <div>
                  <p className='font-medium text-gray-800'>{setting.title}</p>
                  <p className='text-xs text-gray-500'>{setting.description}</p>
                </div>
              </div>
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </div>
          ))}
        </div>
      </NeumorphicCard>

      {/* 退出登录 */}
      <button
        onClick={onLogout}
        className='w-full rounded-xl bg-red-50 py-3 font-medium text-red-600 transition-colors hover:bg-red-100'
      >
        退出登录
      </button>

      {/* 版本信息 */}
      <div className='py-4 text-center text-sm text-gray-500'>
        <p>N-Admin H5</p>
        <p className='text-xs'>版本 1.0.0</p>
      </div>
    </div>
  );
}
