'use client';

import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { H5AuthManager } from '@/lib/h5-auth';
import { BottomNavigation } from '@/components/h5/common/BottomNavigation';
import { NeumorphicCard } from '@/components/h5/common/NeumorphicCard';
import { BackgroundDecoration } from '@/components/h5/common/BackgroundDecoration';
import { ProfileHeader } from '@/components/h5/profile/ProfileHeader';
import { ProfileForm } from '@/components/h5/profile/ProfileForm';
import { SettingsSection } from '@/components/h5/profile/SettingsSection';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;
  avatar?: string;
}

export default function ProfilePage() {
  const authManager = H5AuthManager.getInstance();
  const { isAuthenticated } = authManager.getAuthState();
  const { user } = authManager.getAuthState();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/h5/login';
      return;
    }

    if (user) {
      setProfile(user as UserProfile);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleEditProfile = () => {
    setShowEditForm(true);
  };

  const handleFormClose = () => {
    setShowEditForm(false);
  };

  const handleFormSuccess = (updatedProfile: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updatedProfile }) as UserProfile);
    setShowEditForm(false);
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      authManager.clearAuthState();
      window.location.href = '/h5/login';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'>
        <BackgroundDecoration />
        <div className='flex min-h-screen items-center justify-center'>
          <div className='text-center'>
            <div className='mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-purple-500'></div>
            <p className='text-gray-600'>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-20'>
      <BackgroundDecoration />

      <div className='sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md'>
        <div className='mx-auto flex max-w-md items-center justify-center'>
          <h1 className='text-xl font-bold text-gray-800'>个人中心</h1>
        </div>
      </div>

      <div className='mx-auto max-w-md space-y-6 px-4 py-6'>
        <ProfileHeader
          profile={(profile || user) as UserProfile | null}
          onEdit={handleEditProfile}
        />

        <NeumorphicCard>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-800'>个人信息</h3>
            <button
              onClick={handleEditProfile}
              className='text-sm text-purple-600'
            >
              编辑
            </button>
          </div>
          <div className='space-y-3'>
            <div className='flex items-center justify-between border-b border-gray-100 py-2'>
              <span className='text-gray-600'>用户名</span>
              <span className='font-medium text-gray-800'>
                {profile?.username}
              </span>
            </div>
            {profile?.realName && (
              <div className='flex items-center justify-between border-b border-gray-100 py-2'>
                <span className='text-gray-600'>真实姓名</span>
                <span className='font-medium text-gray-800'>
                  {profile.realName}
                </span>
              </div>
            )}
            {profile?.email && (
              <div className='flex items-center justify-between border-b border-gray-100 py-2'>
                <span className='text-gray-600'>邮箱</span>
                <span className='font-medium text-gray-800'>
                  {profile.email}
                </span>
              </div>
            )}
            {profile?.phone && (
              <div className='flex items-center justify-between py-2'>
                <span className='text-gray-600'>手机号</span>
                <span className='font-medium text-gray-800'>
                  {profile.phone}
                </span>
              </div>
            )}
          </div>
        </NeumorphicCard>

        <SettingsSection onLogout={handleLogout} />
      </div>

      {showEditForm && (
        <ProfileForm
          profile={(profile || user) as UserProfile | null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <BottomNavigation />
    </div>
  );
}
