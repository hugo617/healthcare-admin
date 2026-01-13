// API 基础 URL
export const API_BASE_URL = '/api';

// 通用请求函数
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // 确保包含cookies
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);

    const data = await response.json();

    // 如果响应不包含 success 字段，根据 code 字段添加
    if ('success' in data === false && 'code' in data) {
      data.success = data.code === 0;
    }

    // 对于 401/403 等错误状态码，也返回数据，让调用者处理
    // 只在无法解析 JSON 时抛出错误
    if (!response.ok) {
      // 将错误信息附加到 data 上，然后抛出一个包含完整信息的错误
      const error = new Error(
        data.error?.message ||
          data.message ||
          `HTTP error! status: ${response.status}`
      );
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 构建查询参数
export function buildSearchParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}
