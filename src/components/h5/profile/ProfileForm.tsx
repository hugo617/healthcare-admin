'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;
  avatar?: string;
}

interface ProfileFormProps {
  profile: UserProfile | null;
  onClose: () => void;
  onSuccess: (updatedProfile: Partial<UserProfile>) => void;
}

export function ProfileForm({ profile, onClose, onSuccess }: ProfileFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    realName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        realName: profile.realName || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 这里可以调用更新用户信息的 API
      // 目前只是模拟更新
      const updatedProfile = {
        realName: formData.realName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined
      };

      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success('个人信息更新成功');
      onSuccess(updatedProfile);
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50'>
      <div className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6'>
        {/* 标题栏 */}
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-800'>编辑个人信息</h2>
          <button
            onClick={onClose}
            className='rounded-full p-2 hover:bg-gray-100'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* 用户名（只读） */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              用户名
            </label>
            <input
              type='text'
              value={profile?.username || ''}
              disabled
              className='w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-gray-500'
            />
            <p className='mt-1 text-xs text-gray-500'>用户名不可修改</p>
          </div>

          {/* 真实姓名 */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              真实姓名
            </label>
            <input
              type='text'
              value={formData.realName}
              onChange={(e) =>
                setFormData({ ...formData, realName: e.target.value })
              }
              placeholder='请输入真实姓名'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500'
            />
          </div>

          {/* 邮箱 */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              邮箱
            </label>
            <input
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder='请输入邮箱地址'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500'
            />
          </div>

          {/* 手机号 */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              手机号
            </label>
            <input
              type='tel'
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder='请输入手机号'
              pattern='[0-9]{11}'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500'
            />
            <p className='mt-1 text-xs text-gray-500'>请输入 11 位手机号码</p>
          </div>

          {/* 提交按钮 */}
          <button
            type='submit'
            disabled={submitting}
            className='w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-medium text-white disabled:opacity-50'
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
}
