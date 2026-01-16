'use client';

import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  nickname?: string;
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
    <div className='shadow-neumorphic-soft overflow-hidden rounded-3xl bg-white p-5'>
      <div className='flex items-center gap-4'>
        {/* 头像 */}
        <div className='relative flex-shrink-0' onClick={handleAvatarClick}>
          {profile?.avatar ? (
            <>
              <img
                src={profile.avatar}
                alt='头像'
                className={`h-20 w-20 rounded-full object-cover ring-4 ring-teal-50 ${uploading ? 'opacity-50' : ''}`}
              />
              <div className='absolute right-0 bottom-0 rounded-full border-2 border-white bg-teal-600 p-1.5 shadow-lg'>
                <Camera className='h-3.5 w-3.5 text-white' />
              </div>
            </>
          ) : (
            <div className='from-primary to-sage relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br shadow-lg ring-4 ring-teal-50'>
              <span className='text-2xl font-semibold text-white'>
                {profile?.nickname?.charAt(0) ||
                  profile?.username?.charAt(0) ||
                  '?'}
              </span>
              <div className='absolute right-0 bottom-0 rounded-full border-2 border-white bg-teal-600 p-1.5 shadow-lg'>
                <Camera className='h-3.5 w-3.5 text-white' />
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
          <h2 className='text-xl font-bold text-gray-800'>
            {profile?.nickname || profile?.username || '未设置昵称'}
          </h2>
          <p className='mt-1 text-sm text-gray-500'>
            {profile?.phone || profile?.email || '未设置联系方式'}
          </p>
        </div>

        {/* 编辑按钮 */}
        <button
          onClick={onEdit}
          className='from-primary to-sage rounded-2xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95'
        >
          编辑
        </button>
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
