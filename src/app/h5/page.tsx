'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { H5AuthManager } from '@/lib/h5-auth';
import { BackgroundDecoration } from '@/components/h5/common/BackgroundDecoration';
import { HeaderBar } from '@/components/h5/home/HeaderBar';
import { MenuDropdown } from '@/components/h5/home/MenuDropdown';
import { UserProfileCard } from '@/components/h5/home/UserProfileCard';
import { HealthSummaryCard } from '@/components/h5/home/HealthSummaryCard';
import { QuickActionsGrid } from '@/components/h5/home/QuickActionsGrid';
import { DailyReminderCard } from '@/components/h5/home/DailyReminderCard';
import { BottomNavigation } from '@/components/h5/common/BottomNavigation';

export default function HomePage() {
  const router = useRouter();
  const authManager = H5AuthManager.getInstance();
  const [showMenu, setShowMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [authState, setAuthState] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // 检查是否已登录
    if (!authManager.requireAuth()) {
      return;
    }

    setAuthState(authManager.getAuthState());
  }, [router, authManager]);

  const handleLogout = () => {
    authManager.clearAuthState();
    router.push('/h5/login');
  };

  const handleToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (!isClient || authState === null) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='mt-4 text-gray-600'>正在加载...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='mt-4 text-gray-600'>正在验证身份...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-cream relative h-screen min-h-screen overflow-hidden text-slate-700 antialiased'>
      <BackgroundDecoration />

      {/* 头部区域 */}
      <HeaderBar onMenuClick={() => setShowMenu(!showMenu)} />

      {/* 下拉菜单 */}
      <MenuDropdown
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onLogout={handleLogout}
      />

      {/* 主容器 */}
      <div className='relative z-10 mx-auto max-w-lg'>
        {/* 可滚动内容区域 */}
        <div className='scrollable-content'>
          <UserProfileCard user={authState.user} onToast={handleToast} />
          <HealthSummaryCard />
          <QuickActionsGrid />
          <DailyReminderCard />
        </div>
      </div>

      {/* 底部导航 */}
      <BottomNavigation />

      {/* Toast 提示 */}
      {showToast && (
        <div className='animate-fade-in fixed top-32 left-1/2 z-50 -translate-x-1/2 transform rounded-lg bg-gray-800 px-6 py-3 text-white shadow-lg'>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
