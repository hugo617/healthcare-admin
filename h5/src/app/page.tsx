'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { BackgroundDecoration } from '@/components/common/BackgroundDecoration';
import { HeaderBar } from '@/components/home/HeaderBar';
import { MenuDropdown } from '@/components/home/MenuDropdown';
import { UserProfileCard } from '@/components/home/UserProfileCard';
import { HealthSummaryCard } from '@/components/home/HealthSummaryCard';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { DailyReminderCard } from '@/components/home/DailyReminderCard';
import { BottomNavigation } from '@/components/common/BottomNavigation';

export default function HomePage() {
  const router = useRouter();
  const authManager = AuthManager.getInstance();
  const [showMenu, setShowMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
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
    router.push('/login');
  };

  const handleCheckIn = () => {
    if (hasCheckedIn) {
      setToastMessage('今天已经签到过了！');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    setHasCheckedIn(true);
    setToastMessage('签到成功！获得 10 积分');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (!isClient || authState === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在验证身份...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-slate-700 antialiased h-screen relative overflow-hidden">
      <BackgroundDecoration />

      {/* 头部区域 */}
      <HeaderBar onMenuClick={() => setShowMenu(!showMenu)} />

      {/* 下拉菜单 */}
      <MenuDropdown isOpen={showMenu} onClose={() => setShowMenu(false)} onLogout={handleLogout} />

      {/* 主容器 */}
      <div className="max-w-lg mx-auto relative z-10">
        {/* 可滚动内容区域 */}
        <div className="scrollable-content">
          <UserProfileCard user={authState.user} onCheckIn={handleCheckIn} hasCheckedIn={hasCheckedIn} />
          <HealthSummaryCard />
          <QuickActionsGrid />
          <DailyReminderCard />
        </div>
      </div>

      {/* 底部导航 */}
      <BottomNavigation />

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
