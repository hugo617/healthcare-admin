import axios from 'axios';

const API_BASE_URL = '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // 账号密码登录（支持用户名/手机号/邮箱）
  login: async (account: string, password: string) => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('登录失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // 发送短信验证码
  sendSmsCode: async (phone: string) => {
    try {
      const response = await fetch(`/api/auth/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error('发送验证码失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // 验证码登录
  loginWithSms: async (phone: string, code: string) => {
    try {
      const response = await fetch(`/api/auth/login/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('登录失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getSession: async () => {
    return apiClient.get('/api/auth/session');
  }
};

export default apiClient;