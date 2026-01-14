/**
 * 组织筛选组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { OrganizationFilters } from '../types';
import { STATUS_OPTIONS } from '../constants';

interface OrganizationFiltersProps {
  filters: OrganizationFilters;
  onSearch: (filters: Partial<OrganizationFilters>) => void;
  onReset: () => void;
  loading?: boolean;
}

export function OrganizationFilters({
  filters,
  onSearch,
  onReset,
  loading = false
}: OrganizationFiltersProps) {
  // 本地表单状态
  const [formData, setFormData] = useState({
    name: filters.name || '',
    code: filters.code || '',
    status: filters.status || 'all'
  });

  // 同步外部 filters 到本地表单状态
  useEffect(() => {
    setFormData({
      name: filters.name || '',
      code: filters.code || '',
      status: filters.status || 'all'
    });
  }, [filters]);

  const handleSearch = () => {
    onSearch({
      ...formData,
      page: 1 // 搜索时重置到第一页
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleChange = (field: 'name' | 'code' | 'status', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className='bg-card flex flex-wrap items-center gap-3 rounded-md border p-4'>
      {/* 组织名称搜索 */}
      <div className='min-w-[200px] flex-1'>
        <Input
          placeholder='搜索组织名称...'
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
      </div>

      {/* 组织编码搜索 */}
      <div className='w-[180px]'>
        <Input
          placeholder='组织编码...'
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
      </div>

      {/* 状态筛选 */}
      <div className='w-[140px]'>
        <Select
          value={formData.status}
          onValueChange={(value) => handleChange('status', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder='选择状态' />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 操作按钮 */}
      <div className='flex items-center gap-2'>
        <Button size='sm' onClick={handleSearch} disabled={loading}>
          搜索
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={onReset}
          disabled={loading}
        >
          重置
        </Button>
      </div>
    </div>
  );
}
