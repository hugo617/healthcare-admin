/**
 * 权限选择器组件
 * 支持单选和多选模式，用于选择父权限或模板权限
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PERMISSION_TYPE_CONFIG } from '../constants';
import type { PermissionType, Permission } from '../types';

interface PermissionOption {
  id: number;
  name: string;
  code: string;
  type: PermissionType;
  path?: string;
}

interface PermissionSelectorProps {
  /** 选中的值（单选为 number，多选为 number[]） */
  value?: number | number[];
  /** 值变化回调 */
  onChange: (value: number | number[]) => void;
  /** 选择模式 */
  mode?: 'single' | 'multiple';
  /** 父权限 ID（可选，用于过滤） */
  parentId?: number;
  /** 占位符文本 */
  placeholder?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 排除的权限 ID（用于编辑时排除自身） */
  excludeId?: number;
}

export function PermissionSelector({
  value,
  onChange,
  mode = 'single',
  parentId,
  placeholder = '请选择权限',
  disabled = false,
  excludeId
}: PermissionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PermissionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取权限列表
  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/permissions/all');
      const data = await res.json();

      if (data.code === 0) {
        const perms = data.data || [];
        // 构建权限路径
        const buildPath = (perm: any, parents: any[] = []): string => {
          if (perm.parentId) {
            const parent = perms.find((p: any) => p.id === perm.parentId);
            if (parent) {
              return buildPath(parent, [parent, ...parents]);
            }
          }
          return [...parents, perm].map((p) => p.name).join(' > ');
        };

        const processed = perms
          .filter((p: Permission) => {
            // 排除指定 ID
            if (excludeId && p.id === excludeId) return false;
            // 如果指定了父权限，只显示该父权限的子权限
            if (parentId !== undefined) {
              return p.parentId === parentId;
            }
            return true;
          })
          .map((p: Permission) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            type: p.type,
            path: buildPath(p)
          }));

        setOptions(processed);
      }
    } catch (error) {
      console.error('获取权限列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [parentId, excludeId]);

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open, fetchOptions]);

  // 过滤选项
  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理选择
  const handleSelect = (selectedId: number) => {
    if (mode === 'single') {
      onChange(selectedId);
      setOpen(false);
    } else {
      const currentValue = (value as number[]) || [];
      if (currentValue.includes(selectedId)) {
        onChange(currentValue.filter((id) => id !== selectedId));
      } else {
        onChange([...currentValue, selectedId]);
      }
    }
  };

  // 处理移除（多选模式）
  const handleRemove = (id: number) => {
    if (mode === 'multiple') {
      const currentValue = (value as number[]) || [];
      onChange(currentValue.filter((v) => v !== id));
    }
  };

  // 获取选中的权限
  const getSelectedOptions = () => {
    if (mode === 'single') {
      const singleValue = value as number | undefined;
      return singleValue
        ? options.find((opt) => opt.id === singleValue)
        : undefined;
    } else {
      const multiValue = (value as number[]) || [];
      return multiValue
        .map((id) => options.find((opt) => opt.id === id))
        .filter(Boolean) as PermissionOption[];
    }
  };

  const selectedOptions = getSelectedOptions();
  const typeConfig = (type: PermissionType) => PERMISSION_TYPE_CONFIG[type];

  return (
    <div className='w-full'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled}
            className='w-full justify-between'
          >
            {mode === 'single' ? (
              selectedOptions ? (
                <span className='truncate'>
                  {(selectedOptions as PermissionOption).name}
                </span>
              ) : (
                <span className='text-muted-foreground'>{placeholder}</span>
              )
            ) : (
              <div className='flex flex-1 flex-wrap gap-1'>
                {selectedOptions &&
                (selectedOptions as PermissionOption[]).length > 0 ? (
                  (selectedOptions as PermissionOption[]).map((opt) => (
                    <Badge key={opt.id} variant='secondary' className='gap-1'>
                      {opt.name}
                      <X
                        className='h-3 w-3 cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(opt.id);
                        }}
                      />
                    </Badge>
                  ))
                ) : (
                  <span className='text-muted-foreground'>{placeholder}</span>
                )}
              </div>
            )}
            <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <div className='flex items-center gap-2 border-b px-3'>
              <Search className='h-4 w-4 shrink-0 opacity-50' />
              <CommandInput
                placeholder='搜索权限...'
                value={searchQuery}
                onValueChange={setSearchQuery}
                className='border-0 focus:ring-0'
              />
            </div>
            <CommandList>
              {loading ? (
                <div className='text-muted-foreground py-6 text-center text-sm'>
                  加载中...
                </div>
              ) : filteredOptions.length === 0 ? (
                <CommandEmpty>未找到权限</CommandEmpty>
              ) : (
                <ScrollArea className='h-64'>
                  <CommandGroup>
                    {filteredOptions.map((opt) => {
                      const isSelected =
                        mode === 'single'
                          ? value === opt.id
                          : (value as number[] | undefined)?.includes(opt.id);
                      const config =
                        typeConfig(opt.type) || PERMISSION_TYPE_CONFIG.api;
                      const TypeIcon = config.icon;

                      return (
                        <CommandItem
                          key={opt.id}
                          value={opt.code}
                          onSelect={() => handleSelect(opt.id)}
                          className='flex cursor-pointer items-center gap-2'
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && <Check className='h-3 w-3' />}
                          </div>

                          {/* 权限类型图标 */}
                          <TypeIcon className='h-4 w-4 flex-shrink-0' />

                          <div className='flex-1 truncate'>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>{opt.name}</span>
                              <Badge
                                variant='outline'
                                className={`gap-1 text-xs ${config.color}`}
                              >
                                <TypeIcon className='h-3 w-3' />
                                {config.label}
                              </Badge>
                            </div>
                            {opt.path && opt.path !== opt.name && (
                              <div className='text-muted-foreground text-xs'>
                                {opt.path}
                              </div>
                            )}
                            <div className='text-muted-foreground font-mono text-xs'>
                              {opt.code}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </ScrollArea>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
