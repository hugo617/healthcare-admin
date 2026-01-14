'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 根页面 - 重定向到 H5 登录页面
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到 H5 登录页面
    router.replace('/h5/login');
  }, [router]);

  // 显示加载状态
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <div className='text-muted-foreground mb-4 text-lg'>正在跳转...</div>
        <div className='bg-primary/20 border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
      </div>
    </div>
  );
}
