/**
 * 权限使用情况对话框组件
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import type { PermissionUsage } from '@/app/admin/dashboard/account/permission/types';

interface PermissionUsageDialogProps {
  usage: PermissionUsage | null;
  open: boolean;
  onClose: () => void;
}

export function PermissionUsageDialog({
  usage,
  open,
  onClose
}: PermissionUsageDialogProps) {
  if (!usage) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>权限使用情况 - {usage.permissionName}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* 统计摘要 */}
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='text-sm'>
                {usage.totalRoles} 个角色
              </Badge>
            </div>
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Users className='h-4 w-4' />共 {usage.totalUsers} 个用户
            </div>
          </div>

          {/* 角色列表 */}
          {usage.roles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色名称</TableHead>
                  <TableHead>角色编码</TableHead>
                  <TableHead className='text-center'>用户数量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className='font-medium'>{role.name}</TableCell>
                    <TableCell className='text-muted-foreground font-mono text-sm'>
                      {role.code}
                    </TableCell>
                    <TableCell className='text-center'>
                      <Badge variant='outline'>{role.userCount}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              此权限未被任何角色使用
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
