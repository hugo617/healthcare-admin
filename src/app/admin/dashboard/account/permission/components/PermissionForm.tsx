'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Permission, PermissionFormData, PermissionType } from '../types';
import { PERMISSION_TYPE_CONFIG } from '../constants';
import { PermissionSelector } from './PermissionSelector';

interface PermissionFormProps {
  /** 初始数据（编辑时） */
  initialData?: Permission;
  /** 预设的父权限 ID（用于创建子权限） */
  parentPermissionId?: number;
  /** 预设的父权限信息（用于显示） */
  parentPermission?: Permission | null;
  /** 提交回调 */
  onSubmit: (values: PermissionFormData) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

const PERMISSION_TYPES: { value: PermissionType; label: string }[] = [
  { value: 'menu', label: '菜单' },
  { value: 'page', label: '页面' },
  { value: 'button', label: '按钮' },
  { value: 'api', label: 'API' },
  { value: 'data', label: '数据' }
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

/**
 * 权限表单组件
 * 用于创建和编辑权限
 */
export function PermissionForm({
  initialData,
  parentPermissionId,
  parentPermission,
  onSubmit,
  onCancel
}: PermissionFormProps) {
  const [formData, setFormData] = useState<PermissionFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    type: initialData?.type || 'page',
    description: initialData?.description || '',
    parentId: parentPermissionId || initialData?.parentId || null,
    sortOrder: initialData?.sortOrder || 0,
    frontPath: initialData?.frontPath || '',
    apiPath: initialData?.apiPath || '',
    method: initialData?.method || undefined,
    resourceType: initialData?.resourceType || ''
  });

  // 当初始数据或父权限 ID 变化时更新表单
  useEffect(() => {
    setFormData({
      name: initialData?.name || '',
      code: initialData?.code || '',
      type: initialData?.type || 'page',
      description: initialData?.description || '',
      parentId: parentPermissionId || initialData?.parentId || null,
      sortOrder: initialData?.sortOrder || 0,
      frontPath: initialData?.frontPath || '',
      apiPath: initialData?.apiPath || '',
      method: initialData?.method || undefined,
      resourceType: initialData?.resourceType || ''
    });
  }, [initialData, parentPermissionId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: keyof PermissionFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedType = formData.type as PermissionType;
  const typeConfig = PERMISSION_TYPE_CONFIG[selectedType];

  // 判断是否需要显示 API 相关字段
  const showApiFields = formData.type === 'api';
  // 判断是否需要显示前端路径字段
  const showFrontPath = formData.type === 'menu' || formData.type === 'page';
  // 判断是否需要显示资源类型字段
  const showResourceType = formData.type === 'data';
  // 是否正在创建子权限
  const isCreatingChild = !!parentPermission;

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* 权限类型 */}
      <div className='grid gap-2'>
        <Label htmlFor='type'>权限类型 *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleSelectChange('type', value)}
        >
          <SelectTrigger className='h-9'>
            <SelectValue placeholder='请选择权限类型' />
          </SelectTrigger>
          <SelectContent>
            {PERMISSION_TYPES.map((type) => {
              const config = PERMISSION_TYPE_CONFIG[type.value];
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className='flex items-center gap-2'>
                    <config.icon className='h-4 w-4' />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* 父权限信息（创建子权限时显示） */}
      {isCreatingChild && parentPermission && (
        <div className='bg-muted/50 flex items-center gap-2 rounded-md border p-3'>
          <Info className='text-muted-foreground h-4 w-4 shrink-0' />
          <div className='flex-1 text-sm'>
            <span className='text-muted-foreground'>父权限： </span>
            <span className='font-medium'>{parentPermission.name}</span>
            <span className='text-muted-foreground ml-2'>
              （{parentPermission.code}）
            </span>
          </div>
        </div>
      )}

      {/* 父权限选择器（仅在新建时显示，不包含子权限创建） */}
      {!isCreatingChild && !initialData && (
        <div className='grid gap-2'>
          <Label htmlFor='parentId'>父权限（可选）</Label>
          <PermissionSelector
            value={formData.parentId || undefined}
            onChange={(val) => handleSelectChange('parentId', val || null)}
            mode='single'
            placeholder='不选择则为顶级权限'
          />
        </div>
      )}

      {/* 权限名称 */}
      <div className='grid gap-2'>
        <Label htmlFor='name'>权限名称 *</Label>
        <Input
          id='name'
          name='name'
          value={formData.name}
          onChange={handleChange}
          placeholder='请输入权限名称'
          className='h-9'
          required
        />
      </div>

      {/* 权限标识 */}
      <div className='grid gap-2'>
        <Label htmlFor='code'>权限标识 *</Label>
        <Input
          id='code'
          name='code'
          value={formData.code}
          onChange={handleChange}
          placeholder='请输入权限标识，如：user.create'
          className='h-9 font-mono'
          required
        />
        <p className='text-muted-foreground text-xs'>
          建议使用点号分隔，如：user.create、user.edit、user.delete
        </p>
      </div>

      {/* 前端路径（菜单、页面类型） */}
      {showFrontPath && (
        <div className='grid gap-2'>
          <Label htmlFor='frontPath'>前端路径</Label>
          <Input
            id='frontPath'
            name='frontPath'
            value={formData.frontPath}
            onChange={handleChange}
            placeholder='/users 或 /dashboard/users'
            className='h-9 font-mono text-sm'
          />
        </div>
      )}

      {/* API 路径和方法（API 类型） */}
      {showApiFields && (
        <div className='grid grid-cols-2 gap-3'>
          <div className='grid gap-2'>
            <Label htmlFor='apiPath'>API 路径</Label>
            <Input
              id='apiPath'
              name='apiPath'
              value={formData.apiPath}
              onChange={handleChange}
              placeholder='/api/users'
              className='h-9 font-mono text-sm'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='method'>请求方法</Label>
            <Select
              value={formData.method || ''}
              onValueChange={(value) =>
                handleSelectChange('method', value || undefined)
              }
            >
              <SelectTrigger className='h-9'>
                <SelectValue placeholder='选择方法' />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 资源类型（数据权限类型） */}
      {showResourceType && (
        <div className='grid gap-2'>
          <Label htmlFor='resourceType'>资源类型</Label>
          <Input
            id='resourceType'
            name='resourceType'
            value={formData.resourceType}
            onChange={handleChange}
            placeholder='如：users, orders, products'
            className='h-9 font-mono text-sm'
          />
        </div>
      )}

      {/* 排序 */}
      <div className='grid gap-2'>
        <Label htmlFor='sortOrder'>排序</Label>
        <Input
          id='sortOrder'
          name='sortOrder'
          type='number'
          value={formData.sortOrder}
          onChange={handleChange}
          placeholder='0'
          className='h-9'
          min={0}
        />
      </div>

      {/* 描述 */}
      <div className='grid gap-2'>
        <Label htmlFor='description'>描述</Label>
        <Textarea
          id='description'
          name='description'
          value={formData.description}
          onChange={handleChange}
          placeholder='请输入权限描述'
          className='min-h-[80px] resize-none'
        />
      </div>

      {/* 操作按钮 */}
      <div className='flex justify-end gap-2'>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            className='cursor-pointer'
            onClick={onCancel}
          >
            取消
          </Button>
        )}
        <Button type='submit' className='cursor-pointer'>
          提交
        </Button>
      </div>
    </form>
  );
}
