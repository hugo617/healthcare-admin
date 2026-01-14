/**
 * 权限树组件
 */

'use client';

import { useState } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { PERMISSION_TYPE_CONFIG } from '../constants';
import type { PermissionTreeNode, PermissionType } from '../types';

interface PermissionTreeProps {
  tree: PermissionTreeNode[];
  onEdit: (permission: PermissionTreeNode) => void;
  onDelete: (permission: PermissionTreeNode) => void;
  onCreateChild: (parentId: number) => void;
  onViewUsage: (permission: PermissionTreeNode) => void;
  loading?: boolean;
}

interface TreeNodeProps {
  node: PermissionTreeNode;
  level?: number;
  onEdit: (permission: PermissionTreeNode) => void;
  onDelete: (permission: PermissionTreeNode) => void;
  onCreateChild: (parentId: number) => void;
  onViewUsage: (permission: PermissionTreeNode) => void;
}

function TreeNode({
  node,
  level = 0,
  onEdit,
  onDelete,
  onCreateChild,
  onViewUsage
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const typeConfig = PERMISSION_TYPE_CONFIG[node.type as PermissionType];

  return (
    <div className='select-none'>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className='hover:bg-muted/50 group flex items-center gap-2 rounded-md px-3 py-2 transition-colors'
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {/* 展开/折叠按钮 */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant='ghost' size='sm' className='h-5 w-5 p-0'>
                {isOpen ? (
                  <ChevronDown className='h-3 w-3' />
                ) : (
                  <ChevronRight className='h-3 w-3' />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className='w-5' />
          )}

          {/* 权限类型图标 */}
          <typeConfig.icon
            className={`h-4 w-4 flex-shrink-0 ${typeConfig.color.split(' ')[1]}`}
          />

          {/* 权限名称 */}
          <span className='flex-1 truncate font-medium'>{node.name}</span>

          {/* 权限标识 */}
          <span className='text-muted-foreground hidden font-mono text-xs lg:inline'>
            {node.code}
          </span>

          {/* 权限类型徽章 */}
          <Badge
            variant='outline'
            className={`gap-1 text-xs ${typeConfig.color}`}
          >
            <typeConfig.icon className='h-3 w-3' />
            {typeConfig.label}
          </Badge>

          {/* 使用角色数 */}
          {node.roleUsageCount !== undefined && node.roleUsageCount > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {node.roleUsageCount} 角色
            </Badge>
          )}

          {/* 系统权限标识 */}
          {node.isSystem && (
            <Badge variant='default' className='text-xs'>
              系统
            </Badge>
          )}

          {/* 操作菜单 - hover 显示 */}
          <div className='opacity-0 transition-opacity group-hover:opacity-100'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-7 w-7 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onViewUsage(node)}>
                  <Eye className='mr-2 h-4 w-4' />
                  查看使用情况
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Edit className='mr-2 h-4 w-4' />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateChild(node.id)}>
                  <Plus className='mr-2 h-4 w-4' />
                  添加子权限
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(node)}
                  disabled={node.isSystem}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 子节点 */}
        {hasChildren && (
          <CollapsibleContent className='space-y-0.5'>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateChild={onCreateChild}
                onViewUsage={onViewUsage}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function PermissionTree({
  tree,
  onEdit,
  onDelete,
  onCreateChild,
  onViewUsage,
  loading = false
}: PermissionTreeProps) {
  if (loading) {
    return (
      <div className='bg-background flex h-[400px] items-center justify-center rounded-md border'>
        <div className='text-muted-foreground'>加载中...</div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className='bg-background flex h-[400px] items-center justify-center rounded-md border'>
        <div className='flex flex-col items-center gap-3 p-8 text-center'>
          <Shield className='text-muted-foreground h-12 w-12' />
          <h3 className='text-lg font-semibold'>暂无权限</h3>
          <p className='text-muted-foreground text-sm'>还没有权限数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-background rounded-md border p-2'>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateChild={onCreateChild}
          onViewUsage={onViewUsage}
        />
      ))}
    </div>
  );
}
