'use client';

import React, { useRef } from 'react';
import { User, Camera } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;
  avatar?: string;
}

interface ProfileHeaderProps {
  profile: UserProfile | null;
  onEdit: () => void;
  onAvatarChange?: (newAvatar: string) => void;
}

export function ProfileHeader({
  profile,
  onEdit,
  onAvatarChange
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('仅支持 JPG 和 PNG 格式的图片');
      return;
    }

    // 验证文件大小
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('图片大小不能超过 2MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/h5/profile/avatar', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success('头像上传成功');

        // 更新本地存储的用户信息
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.avatar = result.data.url;
          localStorage.setItem('user', JSON.stringify(user));
        }

        // 通知父组件更新头像
        onAvatarChange?.(result.data.url);
      } else {
        toast.error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setUploading(false);
      // 清空 input 以允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className='from-primary-50 to-sage-light/30 shadow-neumorphic-soft border-primary-100/50 mb-6 rounded-3xl border bg-gradient-to-br p-5'>
      <div className='flex items-center gap-4'>
        {/* 头像 */}
        <div className='relative flex-shrink-0' onClick={handleAvatarClick}>
          {profile?.avatar ? (
            <>
              <img
                src={profile.avatar}
                alt='头像'
                className={`shadow-elevation-sm h-20 w-20 rounded-full border-4 border-white object-cover ${uploading ? 'opacity-50' : ''}`}
              />
              <div className='bg-primary-500 absolute right-0 bottom-0 rounded-full p-1.5 shadow-lg'>
                <Camera className='h-3 w-3 text-white' />
              </div>
            </>
          ) : (
            <div className='from-primary-500 to-sage shadow-elevation-md relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br'>
              <User className='h-10 w-10 text-white' />
              <div className='absolute right-0 bottom-0 rounded-full bg-white p-1.5 shadow-lg'>
                <Camera className='text-primary-500 h-3 w-3' />
              </div>
            </div>
          )}
          {uploading && (
            <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/30'>
              <div className='h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent' />
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <div className='flex-1'>
          <h2 className='mb-1 text-2xl font-bold text-gray-800'>
            {profile?.realName || profile?.username || '用户'}
          </h2>
          <p className='mb-2 text-sm text-gray-500'>
            {profile?.email || profile?.phone || '未设置联系方式'}
          </p>
          <button
            onClick={onEdit}
            className='from-primary-500 to-sage shadow-elevation-sm hover:shadow-elevation-md rounded-full bg-gradient-to-r px-4 py-1.5 text-sm text-white transition-all active:scale-95'
          >
            编辑资料
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/jpg'
        onChange={handleFileChange}
        className='hidden'
      />
    </div>
  );
}
