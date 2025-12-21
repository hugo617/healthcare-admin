import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Info, Settings } from 'lucide-react';
import type { TenantFormData, Tenant } from '../types';
import {
  FORM_VALIDATION_RULES,
  VALIDATION_MESSAGES,
  DEFAULT_TENANT_SETTINGS,
  TENANT_STATUS
} from '../constants';

/**
 * 租户表单验证 Schema
 */
const tenantFormSchema = z.object({
  name: z
    .string()
    .min(FORM_VALIDATION_RULES.name.minLength, VALIDATION_MESSAGES.name.minLength)
    .max(FORM_VALIDATION_RULES.name.maxLength, VALIDATION_MESSAGES.name.maxLength)
    .regex(FORM_VALIDATION_RULES.name.pattern!, VALIDATION_MESSAGES.name.pattern),
  code: z
    .string()
    .min(FORM_VALIDATION_RULES.code.minLength, VALIDATION_MESSAGES.code.minLength)
    .max(FORM_VALIDATION_RULES.code.maxLength, VALIDATION_MESSAGES.code.maxLength)
    .regex(FORM_VALIDATION_RULES.code.pattern, VALIDATION_MESSAGES.code.pattern),
  status: z.enum(['active', 'inactive', 'suspended']),
  settings: z.object({
    maxUsers: z
      .number()
      .min(FORM_VALIDATION_RULES.maxUsers.min, VALIDATION_MESSAGES.maxUsers.min)
      .max(FORM_VALIDATION_RULES.maxUsers.max, VALIDATION_MESSAGES.maxUsers.max),
    allowCustomBranding: z.boolean().default(true),
    enableAPIAccess: z.boolean().default(false),
    defaultRole: z.string().default('user'),
    sessionTimeout: z
      .number()
      .min(FORM_VALIDATION_RULES.sessionTimeout.min, VALIDATION_MESSAGES.sessionTimeout.min)
      .max(FORM_VALIDATION_RULES.sessionTimeout.max, VALIDATION_MESSAGES.sessionTimeout.max)
  }).default(DEFAULT_TENANT_SETTINGS)
});

interface TenantFormProps {
  /** 当前编辑的租户（编辑模式） */
  tenant?: Tenant | null;
  /** 表单提交回调 */
  onSubmit: (data: TenantFormData) => Promise<boolean>;
  /** 取消回调 */
  onCancel: () => void;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 租户表单组件
 * 用于创建和编辑租户信息
 */
export function TenantForm({ tenant, onSubmit, onCancel, loading }: TenantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单
  const form = useForm<z.infer<typeof tenantFormSchema>>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      code: '',
      status: 'active',
      settings: DEFAULT_TENANT_SETTINGS
    }
  });

  // 编辑模式下填充表单数据
  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name,
        code: tenant.code,
        status: tenant.status,
        settings: {
          ...DEFAULT_TENANT_SETTINGS,
          ...tenant.settings
        }
      });
    } else {
      form.reset({
        name: '',
        code: '',
        status: 'active',
        settings: DEFAULT_TENANT_SETTINGS
      });
    }
  }, [tenant, form]);

  /**
   * 处理表单提交
   */
  const handleSubmit = async (data: z.infer<typeof tenantFormSchema>) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(data);
      if (success) {
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 生成租户代码
  const generateTenantCode = () => {
    const name = form.getValues('name');
    if (!name) return;

    // 简单的代码生成逻辑：转换为拼音/英文并格式化
    const code = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')
      .substring(0, 20)
      .replace(/\s+/g, '_');

    form.setValue('code', code);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Info className='h-5 w-5' />
              <span>基本信息</span>
            </CardTitle>
            <CardDescription>
              填写租户的基本信息，包括名称和代码
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {/* 租户名称 */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>租户名称 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入租户名称'
                        {...field}
                        disabled={loading || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      租户的显示名称，支持中英文
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 租户代码 */}
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center space-x-2'>
                      <span>租户代码 *</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={generateTenantCode}
                        disabled={loading || isSubmitting}
                        className='h-auto p-1 text-xs'
                      >
                        自动生成
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入租户代码'
                        {...field}
                        disabled={loading || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      租户的唯一标识，只能包含字母、数字、下划线和横线
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 租户状态 */}
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>初始状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loading || isSubmitting}>
                        <SelectValue placeholder='选择租户状态' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TENANT_STATUS.ACTIVE}>
                        <div className='flex items-center space-x-2'>
                          <Badge variant='outline' className='border-green-200 bg-green-50 text-green-700'>
                            正常
                          </Badge>
                          <span>租户正常运行</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={TENANT_STATUS.INACTIVE}>
                        <div className='flex items-center space-x-2'>
                          <Badge variant='outline' className='border-gray-200 bg-gray-50 text-gray-700'>
                            停用
                          </Badge>
                          <span>新用户无法注册</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={TENANT_STATUS.SUSPENDED}>
                        <div className='flex items-center space-x-2'>
                          <Badge variant='outline' className='border-red-200 bg-red-50 text-red-700'>
                            暂停
                          </Badge>
                          <span>所有用户无法登录</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    设置租户的初始状态，创建后可以修改
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 配置选项 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Settings className='h-5 w-5' />
              <span>配置选项</span>
            </CardTitle>
            <CardDescription>
              配置租户的功能限制和默认设置
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {/* 最大用户数 */}
              <FormField
                control={form.control}
                name='settings.maxUsers'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最大用户数</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='100'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={loading || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      租户允许的最大用户数量
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 会话超时时间 */}
              <FormField
                control={form.control}
                name='settings.sessionTimeout'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>会话超时（秒）</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='3600'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={loading || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      用户会话的超时时间（300-86400秒）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 默认角色 */}
              <FormField
                control={form.control}
                name='settings.defaultRole'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>默认角色</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={loading || isSubmitting}>
                          <SelectValue placeholder='选择默认角色' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='user'>普通用户</SelectItem>
                        <SelectItem value='admin'>管理员</SelectItem>
                        <SelectItem value='viewer'>只读用户</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      新注册用户的默认角色
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* 功能开关 */}
            <div className='space-y-3'>
              <FormLabel>功能权限</FormLabel>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                {/* 自定义品牌 */}
                <FormField
                  control={form.control}
                  name='settings.allowCustomBranding'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-sm font-medium'>
                          允许自定义品牌
                        </FormLabel>
                        <FormDescription className='text-xs'>
                          允许租户自定义 Logo 和主题
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={loading || isSubmitting}
                          className='h-4 w-4 rounded border-gray-300'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* API 访问 */}
                <FormField
                  control={form.control}
                  name='settings.enableAPIAccess'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-sm font-medium'>
                          启用 API 访问
                        </FormLabel>
                        <FormDescription className='text-xs'>
                          允许租户通过 API 访问系统
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={loading || isSubmitting}
                          className='h-4 w-4 rounded border-gray-300'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className='flex justify-end space-x-3'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            取消
          </Button>
          <Button
            type='submit'
            disabled={loading || isSubmitting}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {tenant ? '更新租户' : '创建租户'}
          </Button>
        </div>
      </form>
    </Form>
  );
}