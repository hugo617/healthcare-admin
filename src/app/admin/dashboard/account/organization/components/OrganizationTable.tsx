/**
 * 组织列表表格组件
 */

import {
  Building2,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { Organization, PaginationInfo } from '../types';
import { STATUS_MAP, TABLE_COLUMNS } from '../constants';

interface OrganizationTableProps {
  organizations: Organization[];
  loading?: boolean;
  pagination: PaginationInfo;
  onEdit: (organization: Organization) => void;
  onDelete: (organization: Organization) => void;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
  };
}

export function OrganizationTable({
  organizations,
  loading = false,
  pagination,
  onEdit,
  onDelete,
  emptyState
}: OrganizationTableProps) {
  // 空状态
  if (!loading && organizations.length === 0) {
    return (
      <div className='bg-background flex h-[400px] items-center justify-center rounded-md border'>
        <div className='flex flex-col items-center gap-3 p-8 text-center'>
          {emptyState?.icon || (
            <Building2 className='text-muted-foreground h-12 w-12' />
          )}
          <h3 className='text-lg font-semibold'>
            {emptyState?.title || '暂无数据'}
          </h3>
          <p className='text-muted-foreground max-w-sm text-sm'>
            {emptyState?.description || '还没有组织数据'}
          </p>
          {emptyState?.action}
        </div>
      </div>
    );
  }

  return (
    <div className='relative'>
      <Table>
        <TableHeader>
          <TableRow>
            {TABLE_COLUMNS.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={TABLE_COLUMNS.length}
                className='h-24 text-center'
              >
                加载中...
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org, index) => (
              <TableRow key={org.id}>
                <TableCell className='text-center font-mono text-sm'>
                  {org.id}
                </TableCell>

                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    <Building2 className='text-muted-foreground h-4 w-4' />
                    <span>{org.name}</span>
                  </div>
                </TableCell>

                <TableCell className='text-muted-foreground'>
                  {org.code || (
                    <span className='text-muted-foreground/50'>-</span>
                  )}
                </TableCell>

                <TableCell>
                  {org.leaderId ? (
                    <span className='text-sm'>负责人 ID: {org.leaderId}</span>
                  ) : (
                    <span className='text-muted-foreground text-sm'>
                      未设置
                    </span>
                  )}
                </TableCell>

                <TableCell className='text-center'>
                  <Badge variant='outline' className='gap-1'>
                    <Users className='h-3 w-3' />
                    {org.userCount}
                  </Badge>
                </TableCell>

                <TableCell className='text-center'>
                  <Badge variant='secondary'>{org.childCount || 0}</Badge>
                </TableCell>

                <TableCell className='text-center'>
                  <Badge className={STATUS_MAP[org.status].color}>
                    {STATUS_MAP[org.status].label}
                  </Badge>
                </TableCell>

                <TableCell className='text-muted-foreground text-center'>
                  {org.sortOrder}
                </TableCell>

                <TableCell className='text-center'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <span className='sr-only'>打开菜单</span>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => onEdit(org)}>
                        <Edit className='mr-2 h-4 w-4' />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(org)}
                        className='text-destructive focus:text-destructive'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 分页信息 */}
      {!loading && organizations.length > 0 && (
        <div className='flex items-center justify-between border-t px-2 py-3'>
          <div className='text-muted-foreground text-sm'>
            共 {pagination.total} 条记录，第 {pagination.page} /{' '}
            {pagination.totalPages} 页
          </div>
        </div>
      )}
    </div>
  );
}
