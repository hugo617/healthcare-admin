'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  onClose: () => void;
}

export function ChangePasswordForm({ onClose }: ChangePasswordFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // 验证新密码
    if (!formData.newPassword || formData.newPassword.length < 6) {
      newErrors.newPassword = '新密码长度至少为6位';
    }

    if (formData.newPassword.length > 50) {
      newErrors.newPassword = '新密码长度不能超过50位';
    }

    // 验证确认密码
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
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
      const response = await fetch('/api/h5/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: formData.newPassword
        })
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success('密码修改成功，请重新登录');

        // 延迟关闭弹窗并退出登录
        setTimeout(() => {
          onClose();
          // 清除登录状态
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/h5/login';
        }, 1500);
      } else {
        toast.error(result.message || '修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm'>
      <div className='animate-slide-up max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white'>
        {/* 标题栏 */}
        <div className='sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-gray-800'>修改密码</h2>
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
          {/* 新密码 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              新密码 <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <input
                type={showPassword.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                placeholder='请输入新密码'
                className={`w-full rounded-xl border px-4 py-3 pr-12 transition-all focus:ring-2 focus:outline-none ${
                  errors.newPassword
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type='button'
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
                className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400'
              >
                {showPassword.new ? (
                  <EyeOff className='h-5 w-5' />
                ) : (
                  <Eye className='h-5 w-5' />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className='mt-1.5 text-xs text-red-500'>
                {errors.newPassword}
              </p>
            )}
            <p className='mt-1.5 text-xs text-gray-500'>密码长度至少为6位</p>
          </div>

          {/* 确认密码 */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              确认密码 <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder='请再次输入新密码'
                className={`w-full rounded-xl border px-4 py-3 pr-12 transition-all focus:ring-2 focus:outline-none ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type='button'
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm
                  })
                }
                className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400'
              >
                {showPassword.confirm ? (
                  <EyeOff className='h-5 w-5' />
                ) : (
                  <Eye className='h-5 w-5' />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className='mt-1.5 text-xs text-red-500'>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* 安全提示 */}
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
            <p className='text-xs text-amber-800'>
              密码修改成功后，您需要重新登录。
            </p>
          </div>

          {/* 提交按钮 */}
          <button
            type='submit'
            disabled={submitting}
            className='w-full rounded-xl bg-emerald-500 py-3.5 font-medium text-white transition-all hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {submitting ? '提交中...' : '确认修改'}
          </button>
        </form>
      </div>
    </div>
  );
}
