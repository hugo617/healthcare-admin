'use client';

import React from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserFilters, Role, Tenant, Organization } from '../types';
import { STATUS_OPTIONS } from '../constants';

/**
 * 筛选标签配置
 * 定义哪些筛选字段显示为标签，以及如何格式化显示值
 */
const FILTER_TAG_CONFIG = [
  {
    key: 'roleId' as const,
    label: '角色',
    getDisplayLabel: (value: number, roles: Role[]) => {
      const role = roles.find((r) => r.id === value);
      return role ? `${role.name} (${role.code})` : `ID: ${value}`;
    },
    isVisible: (filters: UserFilters) => Boolean(filters.roleId)
  },
  {
    key: 'tenantId' as const,
    label: '租户',
    getDisplayLabel: (value: number, tenants: Tenant[]) => {
      const tenant = tenants.find((t) => t.id === value);
      return tenant ? `${tenant.name} (${tenant.code})` : `ID: ${value}`;
    },
    isVisible: (filters: UserFilters) => Boolean(filters.tenantId)
  },
  {
    key: 'organizationId' as const,
    label: '组织',
    getDisplayLabel: (value: number, organizations: Organization[]) => {
      const org = organizations.find((o) => o.id === value);
      return org ? `${org.name} (${org.code})` : `ID: ${value}`;
    },
    isVisible: (filters: UserFilters) => Boolean(filters.organizationId)
  },
  {
    key: 'status' as const,
    label: '状态',
    getDisplayLabel: (value: string) => {
      const statusOption = STATUS_OPTIONS.find((opt) => opt.value === value);
      return statusOption ? statusOption.label : value;
    },
    isVisible: (filters: UserFilters) =>
      Boolean(filters.status && filters.status !== 'all')
  },
  {
    key: 'dateRange' as const,
    label: '创建时间',
    getDisplayLabel: (value: { from: Date; to: Date }) => {
      return `${format(value.from, 'MM-dd')} - ${format(value.to, 'MM-dd')}`;
    },
    isVisible: (filters: UserFilters) =>
      Boolean(filters.dateRange?.from && filters.dateRange?.to)
  }
] as const;

interface FilterTagsProps {
  /** 当前筛选条件 */
  filters: UserFilters;
  /** 角色选项（用于显示标签名称） */
  roles: Role[];
  /** 租户选项（用于显示标签名称） */
  tenants?: Tenant[];
  /** 组织选项（用于显示标签名称） */
  organizations?: Organization[];
  /** 移除单个筛选的回调 */
  onRemove: (filterKey: keyof UserFilters) => void;
  /** 清除所有筛选的回调 */
  onClearAll: () => void;
  /** 额外的 className */
  className?: string;
}

/**
 * 筛选标签组件
 * 可视化展示当前激活的高级筛选条件，支持单个移除和全部清除
 */
export function FilterTags({
  filters,
  roles,
  tenants = [],
  organizations = [],
  onRemove,
  onClearAll,
  className
}: FilterTagsProps) {
  // 根据当前筛选条件获取可见的标签配置
  const visibleTags = FILTER_TAG_CONFIG.filter((config) =>
    config.isVisible(filters)
  );

  // 如果没有可见标签，不渲染组件
  if (visibleTags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* 渲染每个筛选标签 */}
      {visibleTags.map((config) => {
        const value = filters[config.key];
        const displayValue = config.getDisplayLabel(
          value as never,
          config.key === 'roleId'
            ? roles
            : config.key === 'tenantId'
              ? tenants
              : config.key === 'organizationId'
                ? organizations
                : []
        );

        return (
          <FilterTag
            key={config.key}
            label={config.label}
            value={displayValue}
            onRemove={() => onRemove(config.key)}
          />
        );
      })}

      {/* 当有多个标签时显示"清除全部"按钮 */}
      {visibleTags.length > 1 && (
        <Button
          variant='ghost'
          size='sm'
          onClick={onClearAll}
          className='text-muted-foreground hover:text-foreground h-7 cursor-pointer px-2 text-xs'
        >
          清除全部
        </Button>
      )}
    </div>
  );
}

interface FilterTagProps {
  label: string;
  value: string;
  onRemove: () => void;
}

/**
 * 单个筛选标签组件
 * 显示筛选标签和移除按钮
 */
function FilterTag({ label, value, onRemove }: FilterTagProps) {
  return (
    <Badge
      variant='secondary'
      className='h-7 cursor-default gap-1.5 px-2.5 pr-1.5 text-xs font-normal'
    >
      <span className='text-muted-foreground'>{label}:</span>
      <span className='font-medium'>{value}</span>
      <Button
        variant='ghost'
        size='sm'
        onClick={onRemove}
        className='hover:bg-destructive/20 hover:text-destructive ml-0.5 h-5 w-5 cursor-pointer p-0'
      >
        <X className='h-3 w-3' />
        <span className='sr-only'>移除{label}筛选</span>
      </Button>
    </Badge>
  );
}
