'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthManager } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const authManager = AuthManager.getInstance();
  const [authState, setAuthState] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setIsClient(true);
    // 检查是否已登录
    if (!authManager.requireAuth()) {
      return;
    }

    setAuthState(authManager.getAuthState());
  }, [router]);

  const handleLogout = () => {
    authManager.clearAuthState();
    router.push('/login');
  };

  const handleReminderClick = () => {
    // 模拟GET请求回应效果
    fetch('/api/reminders')
      .then(response => response.json())
      .then(data => {
        console.log('提醒数据:', data);
        // 这里可以添加更多的交互逻辑
      })
      .catch(error => {
        console.error('获取提醒数据失败:', error);
      });
  };

  const handleFeatureClick = (_path: string, featureName: string) => {
    // 显示提示信息，所有选项都不跳转
    setToastMessage(`${featureName}功能正在开发中，敬请期待！`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">石墨烯健康生活馆</h1>
              <p className="text-xs text-gray-500">享受健康美好生活</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="退出登录"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-md mx-auto pb-20">
        {/* 个人信息卡片 */}
        <section className="bg-white mt-4 mx-4 rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-24 relative">
            <div className="absolute -bottom-8 left-6">
              <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {authState.user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 px-6 pb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {authState.user?.email || '用户'}
              </h2>
              <p className="text-sm text-gray-500">ID: {authState.user?.id || 'Unknown'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">--</div>
                <div className="text-xs text-gray-500">健康积分</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">--</div>
                <div className="text-xs text-gray-500">连续签到</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">--</div>
                <div className="text-xs text-gray-500">会员等级</div>
              </div>
            </div>
          </div>
        </section>

        {/* 快捷功能区域 */}
        <section className="mt-6 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷功能</h3>

            {/* 可滑动的功能网格 */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="grid grid-cols-4 gap-4 min-w-max">
                <div onClick={() => handleFeatureClick('/profile', '个人资料')} className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[70px] cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 text-center">个人资料</span>
                </div>

                {/* <Link href="/health" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[70px]">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 text-center">健康监测</span>
                </Link> */}

                <div onClick={() => handleFeatureClick('/report', '健康报告')} className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[70px] cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 text-center">健康报告</span>
                </div>

                {/* <Link href="/consultation" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[70px]">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 text-center">在线咨询</span>
                </Link> */}

                <Link href="/service-record" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[70px] cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 text-center">服务记录</span>
                </Link>

                <Link href="/service-archive" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[70px] cursor-pointer active:scale-95">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 text-center">服务档案</span>
                </Link>

                {/* <Link href="/help" className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-[70px]">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 text-center">帮助中心</span>
                </Link> */}
              </div>
            </div>
          </div>
        </section>

        {/* 健康提醒卡片 */}
        <section className="mt-6 px-4">
          <div
            className="bg-white rounded-2xl border-2 border-gray-200 p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 active:scale-[0.98]"
            onClick={handleReminderClick}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">每日提醒</h3>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">记得按时测量血压，保持健康生活习惯</p>
          </div>
        </section>
      </main>

      {/* 底部安全区域 */}
      <div className="h-safe-bottom"></div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}