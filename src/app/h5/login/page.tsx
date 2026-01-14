'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/h5-api';
import { H5AuthManager } from '@/lib/h5-auth';

type TabType = 'password' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const authManager = H5AuthManager.getInstance();

  // UI 状态
  const [activeTab, setActiveTab] = useState<TabType>('password');

  // 密码登录表单
  const [passwordForm, setPasswordForm] = useState({
    account: '',
    password: ''
  });

  // 验证码登录表单
  const [codeForm, setCodeForm] = useState({
    phone: '',
    code: ''
  });

  // 其他状态
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');

  // 从 localStorage 读取记住的账号
  useEffect(() => {
    const savedAccount = localStorage.getItem('remembered_account');
    if (savedAccount) {
      setPasswordForm((prev) => ({ ...prev, account: savedAccount }));
      setRememberMe(true);
    }
  }, []);

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 密码登录处理
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.account || !passwordForm.password) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(
        passwordForm.account,
        passwordForm.password
      );

      console.log('H5登录响应:', response);

      if (response.code === 0) {
        const { user, token } = response.data;

        // 存储认证状态
        authManager.setAuthState(token, user);

        // 记住我
        if (rememberMe) {
          localStorage.setItem('remembered_account', passwordForm.account);
        } else {
          localStorage.removeItem('remembered_account');
        }

        // 显示成功消息
        setError('');

        // 延迟跳转，确保状态已保存
        setTimeout(() => {
          router.push('/h5');
        }, 100);
      } else {
        setError(response.message || '登录失败');
      }
    } catch (err: any) {
      console.error('登录错误:', err);
      setError(err?.message || '登录失败，请检查网络连接或联系管理员');
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录处理
  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(codeForm.phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (!codeForm.code || codeForm.code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.loginWithSms(
        codeForm.phone,
        codeForm.code
      );

      console.log('H5验证码登录响应:', response);

      if (response.code === 0) {
        const { user, token } = response.data;

        // 存储认证状态
        authManager.setAuthState(token, user);

        // 延迟跳转，确保状态已保存
        setTimeout(() => {
          router.push('/h5');
        }, 100);
      } else {
        setError(response.message || '登录失败');
      }
    } catch (err: any) {
      console.error('验证码登录错误:', err);
      setError(err?.message || '登录失败，请检查网络连接或联系管理员');
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(codeForm.phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const response = await authAPI.sendSmsCode(codeForm.phone);

      if (response.code === 0) {
        setCountdown(60);
      } else {
        setError(response.message || '发送验证码失败');
      }
    } catch (err: any) {
      setError(err?.message || '发送验证码失败，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  return (
    <div className='bg-health-bg relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-slate-700 antialiased'>
      {/* 背景装饰 - 健康主题渐变圆形 */}
      <div className='pointer-events-none fixed inset-0'>
        <div className='bg-primary/15 absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl'></div>
        <div className='bg-sage/15 absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full blur-3xl'></div>
        <div className='bg-secondary/10 absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl'></div>
      </div>

      {/* 登录卡片 */}
      <div className='relative z-10 w-full max-w-md'>
        {/* Logo 和标题 */}
        <div className='mb-10 text-center'>
          {/* 装饰性脉冲点 - 健康主题颜色 */}
          <div className='mb-6 flex items-center justify-center gap-2'>
            <span className='bg-primary h-2 w-2 animate-pulse rounded-full'></span>
            <span
              className='bg-sage h-2 w-2 animate-pulse rounded-full'
              style={{ animationDelay: '0.2s' }}
            ></span>
            <span
              className='bg-secondary h-2 w-2 animate-pulse rounded-full'
              style={{ animationDelay: '0.4s' }}
            ></span>
          </div>

          {/* Logo - 健康主题渐变 */}
          <div className='from-primary to-sage relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg'>
            <div className='from-primary/20 to-sage/20 absolute -inset-2 rounded-2xl bg-gradient-to-r blur-xl'></div>
            <svg
              className='relative z-10 h-10 w-10 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
              />
            </svg>
          </div>

          <h1 className='font-heading mb-3 text-4xl text-slate-800'>
            欢迎
            <span className='from-primary to-sage bg-gradient-to-r bg-clip-text text-transparent'>
              回来
            </span>
          </h1>
          <p className='text-lg text-slate-500'>开启您的健康生活之旅</p>
        </div>

        {/* 登录卡片 - 带光晕效果 */}
        <div className='relative'>
          <div className='from-primary/10 to-sage/10 absolute -inset-6 rounded-3xl bg-gradient-to-r blur-2xl'></div>
          <div className='relative rounded-3xl bg-white/90 p-8 backdrop-blur-sm'>
            {/* Tab 切换 - 健康主题 */}
            <div className='bg-sage-light/30 mb-8 flex rounded-2xl p-1.5'>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  activeTab === 'password'
                    ? 'from-primary to-sage bg-gradient-to-r text-white shadow-md'
                    : 'hover:text-primary text-slate-600'
                }`}
              >
                密码登录
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  activeTab === 'code'
                    ? 'from-primary to-sage bg-gradient-to-r text-white shadow-md'
                    : 'hover:text-primary text-slate-600'
                }`}
              >
                验证码登录
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className='mb-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600'>
                <svg
                  className='h-4 w-4 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                {error}
              </div>
            )}

            {/* 密码登录表单 */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordLogin}>
                {/* 账号输入 */}
                <div className='mb-5'>
                  <label className='mb-2.5 block text-sm font-medium text-slate-700'>
                    账号
                  </label>
                  <div className='relative'>
                    <span className='absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'>
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                    </span>
                    <input
                      type='text'
                      value={passwordForm.account}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({
                          ...prev,
                          account: e.target.value
                        }));
                        if (error) setError('');
                      }}
                      placeholder='请输入用户名/手机号/邮箱'
                      className='bg-neumorphic-light shadow-neumorphic-inset focus:ring-primary/30 w-full rounded-xl py-3.5 pr-4 pl-12 text-slate-700 placeholder-slate-400 transition-all duration-300 focus:ring-2 focus:outline-none'
                    />
                  </div>
                </div>

                {/* 密码输入 */}
                <div className='mb-5'>
                  <label className='mb-2.5 block text-sm font-medium text-slate-700'>
                    密码
                  </label>
                  <div className='relative'>
                    <span className='absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'>
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                        />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.password}
                      onChange={(e) => {
                        setPasswordForm((prev) => ({
                          ...prev,
                          password: e.target.value
                        }));
                        if (error) setError('');
                      }}
                      placeholder='请输入密码'
                      className='bg-neumorphic-light shadow-neumorphic-inset focus:ring-primary/30 w-full rounded-xl py-3.5 pr-12 pl-12 text-slate-700 placeholder-slate-400 transition-all duration-300 focus:ring-2 focus:outline-none'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600'
                    >
                      {showPassword ? (
                        <svg
                          className='h-5 w-5'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                          />
                        </svg>
                      ) : (
                        <svg
                          className='h-5 w-5'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                          />
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* 记住我 */}
                <div className='mb-8 flex items-center'>
                  <label className='group flex cursor-pointer items-center gap-2.5'>
                    <div className='relative'>
                      <input
                        type='checkbox'
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className='text-primary focus:ring-primary/30 peer h-5 w-5 cursor-pointer rounded border-2 border-slate-300 transition-all duration-200 focus:ring-offset-0'
                      />
                      <svg
                        className='pointer-events-none absolute top-1 left-1 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='3'
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </div>
                    <span className='text-sm text-slate-600 transition-colors group-hover:text-slate-700'>
                      记住我
                    </span>
                  </label>
                </div>

                {/* 登录按钮 */}
                <button
                  type='submit'
                  disabled={loading}
                  className={`from-primary to-sage w-full rounded-xl bg-gradient-to-r py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${
                    loading ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {loading ? (
                    <span className='flex items-center justify-center gap-2'>
                      <svg
                        className='h-5 w-5 animate-spin'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    '登录'
                  )}
                </button>
              </form>
            )}

            {/* 验证码登录表单 */}
            {activeTab === 'code' && (
              <form onSubmit={handleCodeLogin}>
                {/* 手机号输入 */}
                <div className='mb-5'>
                  <label className='mb-2.5 block text-sm font-medium text-slate-700'>
                    手机号
                  </label>
                  <div className='relative'>
                    <span className='absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'>
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                        />
                      </svg>
                    </span>
                    <input
                      type='tel'
                      value={codeForm.phone}
                      onChange={(e) => {
                        setCodeForm((prev) => ({
                          ...prev,
                          phone: e.target.value
                        }));
                        if (error) setError('');
                      }}
                      placeholder='请输入手机号'
                      className='bg-neumorphic-light shadow-neumorphic-inset focus:ring-primary/30 w-full rounded-xl py-3.5 pr-4 pl-12 text-slate-700 placeholder-slate-400 transition-all duration-300 focus:ring-2 focus:outline-none'
                    />
                  </div>
                </div>

                {/* 验证码输入 */}
                <div className='mb-8'>
                  <label className='mb-2.5 block text-sm font-medium text-slate-700'>
                    验证码
                  </label>
                  <div className='flex gap-3'>
                    <div className='relative flex-1'>
                      <span className='absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'>
                        <svg
                          className='h-5 w-5'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                          />
                        </svg>
                      </span>
                      <input
                        type='text'
                        value={codeForm.code}
                        onChange={(e) => {
                          setCodeForm((prev) => ({
                            ...prev,
                            code: e.target.value
                          }));
                          if (error) setError('');
                        }}
                        placeholder='请输入验证码'
                        maxLength={6}
                        className='bg-neumorphic-light shadow-neumorphic-inset focus:ring-primary/30 w-full rounded-xl py-3.5 pr-4 pl-12 text-slate-700 placeholder-slate-400 transition-all duration-300 focus:ring-2 focus:outline-none'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={handleSendCode}
                      disabled={countdown > 0 || sendingCode}
                      className={`from-primary to-sage rounded-xl bg-gradient-to-r px-5 py-3.5 text-sm font-medium whitespace-nowrap text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${
                        countdown > 0 || sendingCode
                          ? 'scale-100 cursor-not-allowed opacity-60'
                          : ''
                      }`}
                    >
                      {sendingCode
                        ? '发送中...'
                        : countdown > 0
                          ? `${countdown}秒后重试`
                          : '获取验证码'}
                    </button>
                  </div>
                </div>

                {/* 登录按钮 */}
                <button
                  type='submit'
                  disabled={loading}
                  className={`from-primary to-sage w-full rounded-xl bg-gradient-to-r py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${
                    loading ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {loading ? (
                    <span className='flex items-center justify-center gap-2'>
                      <svg
                        className='h-5 w-5 animate-spin'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    '登录'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
