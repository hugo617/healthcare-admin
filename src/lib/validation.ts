/**
 * 输入验证工具函数
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证用户名格式
 */
export function validateUsername(username: string): boolean {
  // 用户名只能包含字母、数字、下划线，长度3-20
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }

  if (password.length > 50) {
    errors.push('密码长度不能超过50位');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 验证用户创建数据
 */
export function validateUserCreation(data: {
  username: string;
  email: string;
  password: string;
  phone?: string;
  realName?: string;
  roleId: number;
  status?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证用户名
  if (!data.username || data.username.trim().length === 0) {
    errors.push({ field: 'username', message: '用户名不能为空' });
  } else if (!validateUsername(data.username)) {
    errors.push({
      field: 'username',
      message: '用户名只能包含字母、数字、下划线，长度3-20'
    });
  }

  // 验证邮箱
  if (!data.email || data.email.trim().length === 0) {
    errors.push({ field: 'email', message: '邮箱不能为空' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: '邮箱格式不正确' });
  }

  // 验证密码
  if (!data.password || data.password.trim().length === 0) {
    errors.push({ field: 'password', message: '密码不能为空' });
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push({
        field: 'password',
        message: passwordValidation.errors.join(', ')
      });
    }
  }

  // 验证手机号（可选）
  if (data.phone && data.phone.trim().length > 0) {
    if (!validatePhone(data.phone)) {
      errors.push({ field: 'phone', message: '手机号格式不正确' });
    }
  }

  // 验证真实姓名（可选）
  if (data.realName && data.realName.trim().length > 50) {
    errors.push({ field: 'realName', message: '真实姓名长度不能超过50个字符' });
  }

  // 验证角色ID
  if (!data.roleId || data.roleId <= 0) {
    errors.push({ field: 'roleId', message: '请选择有效的角色' });
  }

  // 验证状态（如果提供）
  if (data.status !== undefined) {
    const validStatuses = ['active', 'inactive', 'locked'];
    if (!validStatuses.includes(data.status)) {
      errors.push({ field: 'status', message: '无效的用户状态' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 验证用户更新数据
 */
export function validateUserUpdate(data: {
  username?: string;
  email?: string;
  phone?: string;
  realName?: string;
  roleId?: number;
  status?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证用户名（如果提供）
  if (data.username !== undefined) {
    if (!data.username || data.username.trim().length === 0) {
      errors.push({ field: 'username', message: '用户名不能为空' });
    } else if (!validateUsername(data.username)) {
      errors.push({
        field: 'username',
        message: '用户名只能包含字母、数字、下划线，长度3-20'
      });
    }
  }

  // 验证邮箱（如果提供）
  if (data.email !== undefined) {
    if (!data.email || data.email.trim().length === 0) {
      errors.push({ field: 'email', message: '邮箱不能为空' });
    } else if (!validateEmail(data.email)) {
      errors.push({ field: 'email', message: '邮箱格式不正确' });
    }
  }

  // 验证手机号（如果提供）
  if (data.phone !== undefined && data.phone && data.phone.trim().length > 0) {
    if (!validatePhone(data.phone)) {
      errors.push({ field: 'phone', message: '手机号格式不正确' });
    }
  }

  // 验证真实姓名（如果提供）
  if (
    data.realName !== undefined &&
    data.realName &&
    data.realName.trim().length > 50
  ) {
    errors.push({ field: 'realName', message: '真实姓名长度不能超过50个字符' });
  }

  // 验证角色ID（如果提供）
  if (data.roleId !== undefined && (!data.roleId || data.roleId <= 0)) {
    errors.push({ field: 'roleId', message: '请选择有效的角色' });
  }

  // 验证状态（如果提供）
  if (data.status !== undefined) {
    const validStatuses = ['active', 'inactive', 'locked'];
    if (!validStatuses.includes(data.status)) {
      errors.push({ field: 'status', message: '无效的用户状态' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
