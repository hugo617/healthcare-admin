'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AdvancedFilterContainer } from '@/components/shared/advanced-filter-container';
import { FilterTags } from './FilterTags';

import {
  UserFilters as UserFiltersType,
  Role,
  Tenant,
  Organization
} from '../types';
import { STATUS_OPTIONS } from '../constants';
import { ViewMode } from '../hooks/useViewMode';

interface UserFiltersProps {
  /** 筛选条件值 */
  filters: UserFiltersType;
  /** 角色选项 */
  roles: Role[];
  /** 租户选项 */
  tenants?: Tenant[];
  /** 组织选项 */
  organizations?: Organization[];
  /** 查询回调 */
  onSearch: (filters: Partial<UserFiltersType>) => void;
  /** 重置回调 */
  onReset: () => void;
  /** 加载状态 */
  loading?: boolean;
  /** 视图模式 */
  viewMode?: ViewMode;
  /** 视图模式变更回调 */
  onViewModeChange?: (mode: ViewMode) => void;
}

/**
 * 用户筛选组件
 * 负责用户列表的搜索和筛选功能（手动查询模式）
 */
export function UserFilters({
  filters,
  roles,
  tenants = [],
  organizations = [],
  onSearch,
  onReset,
  loading = false,
  viewMode,
  onViewModeChange
}: UserFiltersProps) {
  // 本地表单状态
  const [formData, setFormData] = useState<UserFiltersType>({
    search: '',
    username: '',
    realName: '',
    phone: '',
    email: '',
    roleId: undefined,
    tenantId: undefined,
    organizationId: undefined,
    status: 'all',
    dateRange: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  // 控制高级筛选弹窗
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // 同步外部 filters 到本地表单状态
  useEffect(() => {
    setFormData({
      search: filters.search || '',
      username: filters.username || '',
      realName: filters.realName || '',
      phone: filters.phone || '',
      email: filters.email || '',
      roleId: filters.roleId,
      tenantId: filters.tenantId,
      organizationId: filters.organizationId,
      status: filters.status || 'all',
      dateRange: filters.dateRange,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc',
      page: filters.page || 1,
      limit: filters.limit || 10
    });
  }, [filters]);

  /**
   * 更新表单字段值
   */
  const updateFormField = (key: keyof UserFiltersType, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * 执行查询
   */
  const handleSearch = () => {
    onSearch({
      ...formData,
      page: 1 // 查询时重置到第一页
    });
  };

  /**
   * 重置筛选条件
   */
  const handleReset = () => {
    const resetData = {
      search: '',
      username: '',
      realName: '',
      phone: '',
      email: '',
      roleId: undefined,
      tenantId: undefined,
      organizationId: undefined,
      status: 'all' as const,
      dateRange: undefined,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      page: 1,
      limit: 10
    };
    setFormData(resetData);
    onReset();
  };

  /**
   * 移除单个筛选条件
   */
  const handleRemoveFilter = (filterKey: keyof UserFiltersType) => {
    let resetValue: any;

    // 根据筛选字段类型确定重置值
    switch (filterKey) {
      case 'roleId':
      case 'tenantId':
      case 'organizationId':
      case 'dateRange':
        resetValue = undefined;
        break;
      case 'status':
        resetValue = 'all';
        break;
      default:
        resetValue = '';
    }

    // 更新表单数据
    updateFormField(filterKey, resetValue);

    // 触发搜索以刷新结果
    onSearch({
      ...formData,
      [filterKey]: resetValue,
      page: 1
    });
  };

  /**
   * 回车键查询
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  /**
   * 检查是否有激活的筛选条件
   */
  const hasActiveFilters = Boolean(
    formData.search ||
      formData.username ||
      formData.realName ||
      formData.phone ||
      formData.email ||
      formData.roleId ||
      formData.tenantId ||
      formData.organizationId ||
      (formData.status && formData.status !== 'all') ||
      formData.dateRange ||
      formData.sortBy !== 'createdAt' ||
      formData.sortOrder !== 'desc'
  );

  /**
   * 渲染快速搜索栏
   */
  const renderQuickSearch = () => (
    <div className='space-y-3'>
      {/* 第一行: 全局搜索、排序、查询、高级筛选按钮 */}
      <div className='flex items-center gap-3'>
        {/* 全局搜索 */}
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='搜索用户名、姓名或邮箱...'
            value={formData.search || ''}
            onChange={(e) => updateFormField('search', e.target.value)}
            onKeyDown={handleKeyPress}
            className='pl-10'
          />
        </div>

        {/* 排序选项 */}
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>排序:</span>
          <Select
            value={`${formData.sortBy}_${formData.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('_');
              updateFormField('sortBy', sortBy);
              updateFormField('sortOrder', sortOrder);
            }}
          >
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='createdAt_desc'>创建时间 ↓</SelectItem>
              <SelectItem value='createdAt_asc'>创建时间 ↑</SelectItem>
              <SelectItem value='username_desc'>用户名 ↓</SelectItem>
              <SelectItem value='username_asc'>用户名 ↑</SelectItem>
              <SelectItem value='lastLoginAt_desc'>最近登录 ↓</SelectItem>
              <SelectItem value='lastLoginAt_asc'>最近登录 ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 查询按钮 */}
        <Button
          onClick={handleSearch}
          disabled={loading}
          className='shrink-0 cursor-pointer'
        >
          <Search className='mr-2 h-4 w-4' />
          查询
        </Button>

        {/* 高级筛选按钮 */}
        <Button
          variant='outline'
          onClick={() => setIsAdvancedFilterOpen(true)}
          className='shrink-0 cursor-pointer'
        >
          <Filter className='mr-2 h-4 w-4' />
          高级筛选
          {hasActiveFilters && (
            <span className='bg-primary ml-2 h-2 w-2 rounded-full' />
          )}
        </Button>
      </div>

      {/* 第二行: 筛选标签（显示高级筛选条件） */}
      <FilterTags
        filters={formData}
        roles={roles}
        tenants={tenants}
        organizations={organizations}
        onRemove={handleRemoveFilter}
        onClearAll={handleReset}
      />
    </div>
  );

  /**
   * 渲染高级筛选表单内容
   */
  const renderAdvancedFilterForm = () => (
    <div className='grid gap-4'>
      {/* 第一行：用户名、真实姓名和邮箱 */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='space-y-2'>
          <Label>用户名</Label>
          <Input
            placeholder='请输入用户名'
            value={formData.username || ''}
            onChange={(e) => updateFormField('username', e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>
        <div className='space-y-2'>
          <Label>真实姓名</Label>
          <Input
            placeholder='请输入真实姓名'
            value={formData.realName || ''}
            onChange={(e) => updateFormField('realName', e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>
        <div className='space-y-2'>
          <Label>邮箱</Label>
          <Input
            placeholder='请输入邮箱'
            value={formData.email || ''}
            onChange={(e) => updateFormField('email', e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>
      </div>

      {/* 第二行：手机号码、角色和状态 */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='space-y-2'>
          <Label>手机号码</Label>
          <Input
            placeholder='请输入手机号码'
            value={formData.phone || ''}
            onChange={(e) => updateFormField('phone', e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>
        <div className='space-y-2'>
          <Label>角色</Label>
          <Select
            value={formData.roleId ? String(formData.roleId) : 'all'}
            onValueChange={(value) =>
              updateFormField(
                'roleId',
                value === 'all' ? undefined : Number(value)
              )
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='选择角色' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部角色</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name} ({role.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label>状态</Label>
          <Select
            value={formData.status || 'all'}
            onValueChange={(value) => updateFormField('status', value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='选择状态' />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 第三行：租户和组织 */}
      {(tenants.length > 0 || organizations.length > 0) && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {tenants.length > 0 && (
            <div className='space-y-2'>
              <Label>租户</Label>
              <Select
                value={formData.tenantId ? String(formData.tenantId) : 'all'}
                onValueChange={(value) =>
                  updateFormField(
                    'tenantId',
                    value === 'all' ? undefined : Number(value)
                  )
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='选择租户' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部租户</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={String(tenant.id)}>
                      {tenant.name} ({tenant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {organizations.length > 0 && (
            <div className='space-y-2'>
              <Label>组织</Label>
              <Select
                value={
                  formData.organizationId
                    ? String(formData.organizationId)
                    : 'all'
                }
                onValueChange={(value) =>
                  updateFormField(
                    'organizationId',
                    value === 'all' ? undefined : Number(value)
                  )
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='选择组织' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部组织</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name} ({org.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* 第四行：创建时间范围 */}
      <div className='grid grid-cols-1 gap-4'>
        <div className='space-y-2'>
          <Label>创建时间</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.dateRange && 'text-muted-foreground'
                )}
              >
                <Calendar className='mr-2 h-4 w-4' />
                {formData.dateRange &&
                formData.dateRange.from &&
                formData.dateRange.to
                  ? `${format(formData.dateRange.from, 'yyyy-MM-dd')} - ${format(formData.dateRange.to, 'yyyy-MM-dd')}`
                  : '选择时间范围'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <CalendarComponent
                mode='range'
                selected={formData.dateRange}
                onSelect={(dateRange) =>
                  updateFormField('dateRange', dateRange)
                }
                numberOfMonths={2}
                locale={zhCN}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  return (
    <div className='space-y-4'>
      {/* 快速搜索栏 */}
      {renderQuickSearch()}

      {/* 高级筛选弹窗 */}
      <AdvancedFilterContainer
        open={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        title='用户筛选'
        hasActiveFilters={hasActiveFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      >
        {renderAdvancedFilterForm()}
      </AdvancedFilterContainer>
    </div>
  );
}
