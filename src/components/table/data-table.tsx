'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { FileX, Database, Search, Users } from 'lucide-react';
import { TableSkeleton } from './table-skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { SortableHeader } from './sortable-header';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  title: string;
  className?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  emptyState?: EmptyStateProps;
  rowKey?: string | ((record: T) => string);
  // Selection props
  selectable?: boolean;
  selectedKeys?: string[];
  onSelect?: (key: string) => void;
  onSelectAll?: () => void;
  // Sorting props
  sortableColumns?: string[];
  sortConfig?: { sortBy: string; sortOrder: 'asc' | 'desc' } | null;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = '暂无数据',
  emptyState,
  rowKey = 'id',
  selectable = false,
  selectedKeys = [],
  onSelect,
  onSelectAll,
  sortableColumns = [],
  sortConfig = null,
  onSort
}: DataTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  if (loading) {
    return (
      <TableSkeleton
        columnCount={columns.length}
        rowCount={8}
        showHeader={true}
      />
    );
  }

  // Calculate selection state for header checkbox
  const allSelected = data.length > 0 && selectedKeys.length === data.length;
  const someSelected = selectedKeys.length > 0 && !allSelected;

  return (
    <div className='bg-background relative h-full w-full overflow-hidden rounded-md border'>
      <div className='h-full w-full overflow-x-auto overflow-y-auto'>
        <div className='min-w-[1200px]'>
          <Table className='h-full w-full'>
            <TableHeader className='bg-background sticky top-0 z-10'>
              <TableRow className='bg-muted/50 hover:bg-muted/50'>
                {selectable && (
                  <TableHead className='bg-muted/50 w-12'>
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={onSelectAll}
                      aria-label='Select all'
                    />
                  </TableHead>
                )}
                {columns.map((column) => {
                  const isSortable = sortableColumns.includes(column.key);
                  return (
                    <TableHead
                      key={column.key}
                      className={`bg-muted/50 font-semibold whitespace-nowrap ${column.className || ''}`}
                      style={{
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'hsl(var(--muted) / 0.5)'
                      }}
                    >
                      {isSortable && onSort ? (
                        <SortableHeader
                          title={column.title}
                          sortKey={column.key}
                          currentSort={sortConfig}
                          onSort={onSort}
                        />
                      ) : (
                        <span className={isSortable ? 'cursor-pointer' : ''}>
                          {column.title}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={selectable ? columns.length + 1 : columns.length}
                    className='text-center'
                  >
                    <div className='flex min-h-[200px] flex-col items-center justify-center space-y-4'>
                      <div className='bg-muted/50 rounded-full p-4'>
                        {emptyState?.icon || (
                          <Database className='text-muted-foreground h-8 w-8' />
                        )}
                      </div>
                      <div className='space-y-2 text-center'>
                        <p className='text-foreground text-sm font-medium'>
                          {emptyState?.title || emptyText || '暂无数据'}
                        </p>
                        <p className='text-muted-foreground max-w-sm text-xs'>
                          {emptyState?.description ||
                            '尝试调整筛选条件或添加新数据'}
                        </p>
                      </div>
                      {emptyState?.action && (
                        <div className='mt-4'>{emptyState.action}</div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((record, index) => {
                  const key = getRowKey(record, index);
                  const isSelected = selectedKeys.includes(key);
                  return (
                    <TableRow
                      key={key}
                      className={cn(
                        'hover:bg-muted/50',
                        isSelected && 'bg-muted/30'
                      )}
                    >
                      {selectable && (
                        <TableCell className='w-12'>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onSelect?.(key)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={`${column.className || ''} whitespace-nowrap`}
                        >
                          {column.render
                            ? column.render(record[column.key], record, index)
                            : record[column.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
