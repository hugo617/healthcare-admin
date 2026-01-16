'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  nickname?: string;
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
    username: '',
    nickname: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<{
    username?: string;
    nickname?: string;
    phone?: string;
    email?: string;
  }>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        nickname: profile.nickname || '',
        phone: profile.phone || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // 验证用户名（必填）
    if (!formData.username || formData.username.trim().length < 2) {
      newErrors.username = '用户名至少需要 2 个字符';
    }

    // 验证昵称（可选，但如果填写了需要验证格式）
    if (formData.nickname && formData.nickname.length > 20) {
      newErrors.nickname = '昵称不能超过 20 个字符';
    }

    // 验证手机号（可选）
    if (formData.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = '手机号格式不正确';
      }
    }

    // 验证邮箱（可选）
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '邮箱格式不正确';
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
      const response = await fetch('/api/h5/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          nickname: formData.nickname || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined
        })
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success('个人信息更新成功');

        // 更新本地存储的用户信息
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.username = formData.username;
          user.nickname = formData.nickname;
          user.phone = formData.phone;
          user.email = formData.email;
          localStorage.setItem('user', JSON.stringify(user));
        }

        onSuccess({
          username: formData.username,
          nickname: formData.nickname || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined
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
      <div className='animate-slide-up max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white'>
        {/* 标题栏 */}
        <div className='sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-gray-800'>编辑资料</h2>
            <button
              onClick={onClose}
              className='rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 active:scale-95'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className='space-y-5 p-6'>
          {/* 用户名 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              用户名 <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder='请输入用户名'
              className={`w-full rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none ${
                errors.username
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
            {errors.username && (
              <p className='mt-1.5 text-xs text-red-500'>{errors.username}</p>
            )}
            <p className='mt-1.5 text-xs text-gray-500'>
              用户名至少需要 2 个字符
            </p>
          </div>

          {/* 昵称（可选） */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              昵称 <span className='text-gray-400'>(选填)</span>
            </label>
            <input
              type='text'
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              placeholder='请输入昵称（可选）'
              className={`w-full rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none ${
                errors.nickname
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
            {errors.nickname && (
              <p className='mt-1.5 text-xs text-red-500'>{errors.nickname}</p>
            )}
          </div>

          {/* 手机号 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              手机号 <span className='text-gray-400'>(选填)</span>
            </label>
            <input
              type='tel'
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder='请输入手机号'
              maxLength={11}
              className={`w-full rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none ${
                errors.phone
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
            {errors.phone && (
              <p className='mt-1.5 text-xs text-red-500'>{errors.phone}</p>
            )}
            <p className='mt-1.5 text-xs text-gray-500'>请输入 11 位手机号码</p>
          </div>

          {/* 邮箱 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              邮箱 <span className='text-gray-400'>(选填)</span>
            </label>
            <input
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder='请输入邮箱'
              className={`w-full rounded-xl border px-4 py-3 transition-all focus:ring-2 focus:outline-none ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
            {errors.email && (
              <p className='mt-1.5 text-xs text-red-500'>{errors.email}</p>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            type='submit'
            disabled={submitting}
            className='from-primary to-sage w-full rounded-xl bg-gradient-to-r py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
}
