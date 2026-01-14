/**
 * 组织树组件
 */

'use client';

import { useState } from 'react';
import {
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus
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
import type { OrganizationTreeNode } from '../types';
import { STATUS_MAP } from '../constants';

interface OrganizationTreeProps {
  tree: OrganizationTreeNode[];
  onEdit: (organization: OrganizationTreeNode) => void;
  onDelete: (organization: OrganizationTreeNode) => void;
  onAddUser: (organization: OrganizationTreeNode) => void;
  onCreateChild?: (parentId: string) => void;
  loading?: boolean;
}

interface TreeNodeProps {
  node: OrganizationTreeNode;
  level?: number;
  onEdit: (organization: OrganizationTreeNode) => void;
  onDelete: (organization: OrganizationTreeNode) => void;
  onAddUser: (organization: OrganizationTreeNode) => void;
  onCreateChild?: (parentId: string) => void;
}

function TreeNode({
  node,
  level = 0,
  onEdit,
  onDelete,
  onAddUser,
  onCreateChild
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

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
              <Button
                variant='ghost'
                size='sm'
                className='h-5 w-5 p-0'
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
              >
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

          {/* 组织图标 */}
          <Building2 className='text-muted-foreground h-4 w-4 flex-shrink-0' />

          {/* 组织名称 */}
          <span className='flex-1 truncate font-medium'>{node.name}</span>

          {/* 组织编码 */}
          {node.code && (
            <span className='text-muted-foreground hidden text-xs lg:inline'>
              ({node.code})
            </span>
          )}

          {/* 负责人 */}
          {node.leader && (
            <span className='text-muted-foreground hidden text-xs xl:inline'>
              {node.leader.realName || node.leader.username}
            </span>
          )}

          {/* 成员数 */}
          <Badge variant='outline' className='gap-1 text-xs'>
            <Users className='h-3 w-3' />
            {node.userCount}
          </Badge>

          {/* 状态 */}
          <Badge className={`text-xs ${STATUS_MAP[node.status].color}`}>
            {STATUS_MAP[node.status].label}
          </Badge>

          {/* 操作菜单 */}
          <div className='opacity-0 transition-opacity group-hover:opacity-100'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-7 w-7 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Edit className='mr-2 h-4 w-4' />
                  编辑
                </DropdownMenuItem>
                {onCreateChild && (
                  <>
                    <DropdownMenuItem onClick={() => onCreateChild(node.id)}>
                      <Building2 className='mr-2 h-4 w-4' />
                      添加子组织
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => onAddUser(node)}>
                  <UserPlus className='mr-2 h-4 w-4' />
                  添加成员
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(node)}
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
                onAddUser={onAddUser}
                onCreateChild={onCreateChild}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function OrganizationTree({
  tree,
  onEdit,
  onDelete,
  onAddUser,
  onCreateChild,
  loading = false
}: OrganizationTreeProps) {
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
          <Building2 className='text-muted-foreground h-12 w-12' />
          <h3 className='text-lg font-semibold'>暂无组织</h3>
          <p className='text-muted-foreground text-sm'>还没有组织架构数据</p>
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
          onAddUser={onAddUser}
          onCreateChild={onCreateChild}
        />
      ))}
    </div>
  );
}
