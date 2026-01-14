/**
 * 组织表单组件
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Organization, OrganizationFormData } from '../types';

interface OrganizationFormProps {
  initialData?: Organization | null;
  onSubmit: (values: OrganizationFormData) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export function OrganizationForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: OrganizationFormProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    parentId: initialData?.parentId || null,
    leaderId: initialData?.leaderId || null,
    status: initialData?.status || 'active',
    sortOrder: initialData?.sortOrder || 0
  });

  // 获取组织列表（用于父组织选择）
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        const res = await response.json();
        if (res.code === 0 && res.data) {
          // 过滤掉当前编辑的组织（避免循环引用）
          const filtered = initialData
            ? res.data.filter((org: Organization) => org.id !== initialData.id)
            : res.data;
          setOrganizations(filtered);
        }
      } catch (error) {
        console.error('获取组织列表失败:', error);
      }
    };
    fetchOrganizations();
  }, [initialData]);

  // 获取用户列表（用于负责人选择）
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users?limit=1000');
        const res = await response.json();
        if (res.code === 0 && res.data) {
          setUsers(res.data);
        }
      } catch (error) {
        toast.error('获取用户列表失败');
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (field: keyof OrganizationFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 验证
    if (!formData.name.trim()) {
      toast.error('请输入组织名称');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* 组织名称 */}
      <div className='space-y-2'>
        <Label htmlFor='name'>
          组织名称 <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='name'
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder='请输入组织名称'
          required
        />
      </div>

      {/* 组织编码 */}
      <div className='space-y-2'>
        <Label htmlFor='code'>组织编码</Label>
        <Input
          id='code'
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value)}
          placeholder='请输入组织编码（可选）'
        />
      </div>

      {/* 父组织 */}
      <div className='space-y-2'>
        <Label htmlFor='parentId'>父组织</Label>
        <Select
          value={formData.parentId || 'none'}
          onValueChange={(value) =>
            handleChange('parentId', value === 'none' ? null : value)
          }
        >
          <SelectTrigger id='parentId'>
            <SelectValue placeholder='选择父组织（可选）' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>无（顶级组织）</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
                {org.code && ` (${org.code})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 负责人 */}
      <div className='space-y-2'>
        <Label htmlFor='leaderId'>负责人</Label>
        <Select
          value={formData.leaderId?.toString() || 'none'}
          onValueChange={(value) =>
            handleChange('leaderId', value === 'none' ? null : parseInt(value))
          }
        >
          <SelectTrigger id='leaderId'>
            <SelectValue placeholder='选择负责人（可选）' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>未设置</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.realName || user.username}
                {user.email && ` <${user.email}>`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 状态 */}
      <div className='flex items-center justify-between'>
        <div className='space-y-0.5'>
          <Label htmlFor='status'>启用状态</Label>
          <p className='text-muted-foreground text-sm'>
            禁用后，该组织及其子组织将不可用
          </p>
        </div>
        <Checkbox
          id='status'
          checked={formData.status === 'active'}
          onCheckedChange={(checked) =>
            handleChange('status', checked ? 'active' : 'inactive')
          }
        />
      </div>

      {/* 排序值 */}
      <div className='space-y-2'>
        <Label htmlFor='sortOrder'>排序值</Label>
        <Input
          id='sortOrder'
          type='number'
          value={formData.sortOrder}
          onChange={(e) =>
            handleChange('sortOrder', parseInt(e.target.value) || 0)
          }
          placeholder='0'
          min={0}
        />
        <p className='text-muted-foreground text-xs'>值越小越靠前</p>
      </div>

      {/* 操作按钮 */}
      <div className='flex justify-end gap-2 pt-4'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type='submit'>{isEditing ? '保存' : '创建'}</Button>
      </div>
    </form>
  );
}
