'use client';

import React from 'react';
import { User } from 'lucide-react';
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
}

export function ProfileHeader({ profile, onEdit }: ProfileHeaderProps) {
  return (
    <div className='mb-6 rounded-3xl bg-white p-6 shadow-lg'>
      <div className='flex items-center gap-4'>
        {/* 头像 */}
        <div className='flex-shrink-0'>
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt='头像'
              className='h-20 w-20 rounded-full border-4 border-purple-200 object-cover'
            />
          ) : (
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500'>
              <User className='h-10 w-10 text-white' />
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <div className='flex-1'>
          <h2 className='mb-1 text-xl font-bold text-gray-800'>
            {profile?.realName || profile?.username || '用户'}
          </h2>
          <p className='mb-2 text-sm text-gray-500'>
            {profile?.email || profile?.phone || '未设置联系方式'}
          </p>
          <button
            onClick={onEdit}
            className='rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 text-sm text-white'
          >
            编辑资料
          </button>
        </div>
      </div>
    </div>
  );
}
