'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Lock, LogOut, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { H5AuthManager } from '@/lib/h5-auth';
import { BottomNavigation } from '@/components/h5/common/BottomNavigation';
import { BackgroundDecoration } from '@/components/h5/common/BackgroundDecoration';
import { HeaderBar } from '@/components/h5/home/HeaderBar';
import { MenuDropdown } from '@/components/h5/home/MenuDropdown';
import { ProfileHeader } from '@/components/h5/profile/ProfileHeader';
import { ProfileForm } from '@/components/h5/profile/ProfileForm';
import { ChangePasswordForm } from '@/components/h5/profile/ChangePasswordForm';

interface UserProfile {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  createdAt: string;
}

type ActiveModal = 'edit' | 'password' | null;

export default function ProfilePage() {
  const router = useRouter();
  const authManager = H5AuthManager.getInstance();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 退出登录二次确认状态
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const { isAuthenticated: auth, user } = authManager.getAuthState();
    setIsAuthenticated(auth);

    if (!auth) {
      window.location.href = '/h5/login';
      return;
    }

    if (user) {
      setProfile(user as UserProfile);
      setLoading(false);
    }
  }, []);

  // 退出登录处理（二次确认）
  const handleLogoutClick = () => {
    if (!logoutConfirm) {
      // 第一次点击：进入确认状态
      setLogoutConfirm(true);
      // 3秒后自动恢复
      logoutTimerRef.current = setTimeout(() => {
        setLogoutConfirm(false);
        logoutTimerRef.current = null;
      }, 3000);
    } else {
      // 第二次点击：执行退出
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      authManager.clearAuthState();
      router.push('/h5/login');
    }
  };

  const handleMenuLogout = () => {
    authManager.clearAuthState();
    router.push('/h5/login');
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

  const handleFormClose = () => setActiveModal(null);

  const handleFormSuccess = (updatedProfile: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updatedProfile }) as UserProfile);
    setActiveModal(null);
  };

  const handleAvatarChange = (newAvatar: string) => {
    setProfile((prev) => (prev ? { ...prev, avatar: newAvatar } : null));
  };

  if (loading) {
    return (
      <div className='bg-cream flex min-h-screen items-center justify-center text-slate-700 antialiased'>
        <BackgroundDecoration />
        <div className='relative z-10 text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-teal-600'></div>
          <p className='mt-4 text-gray-600'>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-cream relative flex h-screen min-h-screen flex-col text-slate-700 antialiased'>
      <BackgroundDecoration />

      {/* 头部区域 */}
      <HeaderBar onMenuClick={() => setShowMenu(!showMenu)} />

      {/* 下拉菜单 */}
      <MenuDropdown
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onLogout={handleMenuLogout}
      />

      {/* 主容器 - 占据剩余空间并可滚动 */}
      <div className='relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-4'>
        {/* 可滚动内容区域 */}
        <div className='scrollable-content flex-1 overflow-y-auto pb-24'>
          <div className='space-y-4'>
            {/* 头像卡片 */}
            <ProfileHeader
              profile={profile}
              onEdit={() => setActiveModal('edit')}
              onAvatarChange={handleAvatarChange}
            />

            {/* 基本信息 */}
            <div className='shadow-neumorphic-soft overflow-hidden rounded-3xl bg-white p-5'>
              <h3 className='mb-4 flex items-center gap-2 text-sm font-bold text-teal-600'>
                <span className='h-3.5 w-1 rounded bg-teal-600'></span>
                基本信息
              </h3>
              <div className='space-y-1'>
                <div className='flex items-center justify-between border-b border-gray-100 px-2 py-3.5 transition-colors active:bg-teal-50/50'>
                  <div className='flex items-center gap-3 text-gray-600'>
                    <User className='h-5 w-5' />
                    <span>用户名</span>
                  </div>
                  <div className='flex items-center text-gray-800'>
                    <span className='mr-1'>{profile?.username}</span>
                    <ChevronRight className='h-4 w-4 text-gray-400' />
                  </div>
                </div>
                <div className='flex items-center justify-between px-2 py-3.5 transition-colors active:bg-teal-50/50'>
                  <div className='flex items-center gap-3 text-gray-600'>
                    <Mail className='h-5 w-5' />
                    <span>邮箱</span>
                  </div>
                  <div className='flex items-center text-gray-800'>
                    <span className='mr-1'>{profile?.email || '未设置'}</span>
                    <ChevronRight className='h-4 w-4 text-gray-400' />
                  </div>
                </div>
              </div>
            </div>

            {/* 账号安全 */}
            <div className='shadow-neumorphic-soft overflow-hidden rounded-3xl bg-white p-5'>
              <h3 className='mb-4 flex items-center gap-2 text-sm font-bold text-teal-600'>
                <span className='h-3.5 w-1 rounded bg-teal-600'></span>
                账号安全
              </h3>
              <button
                onClick={() => setActiveModal('password')}
                className='flex w-full items-center justify-between rounded-xl px-2 py-3.5 text-left transition-colors active:bg-teal-50/50'
              >
                <div className='flex items-center gap-3 text-gray-800'>
                  <Lock className='h-5 w-5 text-teal-600' />
                  <span>修改密码</span>
                </div>
                <ChevronRight className='h-4 w-4 text-gray-400' />
              </button>
            </div>

            {/* 退出登录 */}
            <button
              onClick={handleLogoutClick}
              className={`shadow-neumorphic-soft mx-auto mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-medium transition-all active:scale-95 ${
                logoutConfirm
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700'
              }`}
            >
              {logoutConfirm ? (
                <>
                  <LogOut className='h-5 w-5' />
                  确定退出？
                </>
              ) : (
                <>
                  <LogOut className='h-5 w-5' />
                  退出登录
                </>
              )}
            </button>

            {/* 版本信息 */}
            <div className='py-4 text-center'>
              <p className='text-xs text-gray-400'>烯晞健康 H5 v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* 弹窗 */}
      {activeModal === 'edit' && (
        <ProfileForm
          profile={profile}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {activeModal === 'password' && (
        <ChangePasswordForm onClose={handleFormClose} />
      )}

      {/* 底部导航 */}
      <BottomNavigation />
    </div>
  );
}
