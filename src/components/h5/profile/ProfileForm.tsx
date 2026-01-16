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
  const [errors, setErrors] = useState<{
    realName?: string;
    email?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        realName: profile.realName || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // 验证真实姓名
    if (
      !formData.realName ||
      formData.realName.length < 2 ||
      formData.realName.length > 50
    ) {
      newErrors.realName = '真实姓名长度必须在 2-50 个字符之间';
    }

    // 验证邮箱
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '邮箱格式不正确';
      }
    }

    // 验证手机号
    if (formData.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = '手机号格式不正确';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // 从 localStorage 获取 token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch('/api/h5/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          realName: formData.realName || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined
        })
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success('个人信息更新成功');

        // 更新本地存储的用户信息
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.realName = formData.realName;
          user.email = formData.email;
          user.phone = formData.phone;
          localStorage.setItem('user', JSON.stringify(user));
        }

        onSuccess({
          realName: formData.realName || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined
        });
      } else {
        toast.error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('网络错误，请稍后重试');
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
            <h2 className='text-xl font-bold text-gray-800'>编辑个人信息</h2>
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
          {/* 用户名（只读） */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              用户名
            </label>
            <input
              type='text'
              value={profile?.username || ''}
              disabled
              className='w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-500'
            />
            <p className='mt-1.5 text-xs text-neutral-500'>用户名不可修改</p>
          </div>

          {/* 真实姓名 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              真实姓名 <span className='text-error'>*</span>
            </label>
            <input
              type='text'
              value={formData.realName}
              onChange={(e) =>
                setFormData({ ...formData, realName: e.target.value })
              }
              placeholder='请输入真实姓名'
              className={`w-full rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none ${
                errors.realName
                  ? 'border-error focus:ring-error/20'
                  : 'focus:border-primary-500 focus:ring-primary-500/20 border-neutral-300'
              }`}
            />
            {errors.realName && (
              <p className='text-error mt-1.5 text-xs'>{errors.realName}</p>
            )}
          </div>

          {/* 邮箱 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              邮箱
            </label>
            <input
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder='请输入邮箱地址'
              className={`w-full rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none ${
                errors.email
                  ? 'border-error focus:ring-error/20'
                  : 'focus:border-primary-500 focus:ring-primary-500/20 border-neutral-300'
              }`}
            />
            {errors.email && (
              <p className='text-error mt-1.5 text-xs'>{errors.email}</p>
            )}
          </div>

          {/* 手机号 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
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
              className={`w-full rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none ${
                errors.phone
                  ? 'border-error focus:ring-error/20'
                  : 'focus:border-primary-500 focus:ring-primary-500/20 border-neutral-300'
              }`}
            />
            {errors.phone && (
              <p className='text-error mt-1.5 text-xs'>{errors.phone}</p>
            )}
            <p className='mt-1.5 text-xs text-neutral-500'>
              请输入 11 位手机号码
            </p>
          </div>

          {/* 提交按钮 */}
          <button
            type='submit'
            disabled={submitting}
            className='from-primary-500 to-sage shadow-elevation-sm hover:shadow-elevation-md w-full rounded-xl bg-gradient-to-r py-3.5 font-medium text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
}
