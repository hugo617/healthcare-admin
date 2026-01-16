'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// 导入组件和 hooks
import { useServiceRecordFilters, useServiceRecordManagement } from './hooks';
import { ServiceRecord } from './types';

export default function ServiceRecordManagementPage() {
  // 使用自定义 hooks
  const {
    filters,
    updatePagination,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useServiceRecordFilters();
  const {
    records,
    loading,
    pagination,
    statistics,
    fetchRecords,
    fetchStatistics
  } = useServiceRecordManagement();

  // 详情对话框状态
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 监听 filters 变化，获取数据
  useEffect(() => {
    fetchRecords(filters);
  }, [filters, fetchRecords]);

  // 获取统计信息
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  /**
   * 打开详情对话框
   */
  const handleOpenDetailDialog = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setDetailDialogOpen(true);
  };

  /**
   * 关闭详情对话框
   */
  const handleCloseDetailDialog = () => {
    setSelectedRecord(null);
    setDetailDialogOpen(false);
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    fetchRecords(filters);
    fetchStatistics();
  };

  /**
   * 处理排序
   */
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateFilters({ sortBy, sortOrder });
  };

  return (
    <PageContainer scrollable={true} bentoMode={true}>
      <div className='flex min-h-[calc(100vh-8rem)] w-full flex-col space-y-4 p-4'>
        {/* 页面头部 */}
        <div className='flex flex-shrink-0 items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>服务记录管理</h1>
            <p className='text-muted-foreground'>管理所有用户的服务记录</p>
          </div>
          <Button variant='outline' onClick={handleRefresh}>
            刷新
          </Button>
        </div>

        {/* 统计信息 */}
        {statistics && (
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>总记录数</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.total}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>本月服务</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.thisMonth}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>今日服务</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.today}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>完成率</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.completionRate}%
              </div>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className='flex-shrink-0'>
          <div className='flex gap-2'>
            <input
              type='text'
              placeholder='搜索客户编号或姓名...'
              className='border-input bg-background flex h-10 w-[200px] rounded-md border px-3 py-2 text-sm'
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecords(filters)}
            />
            <select
              className='border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm'
              value={filters.status || 'all'}
              onChange={(e) => updateFilters({ status: e.target.value as any })}
            >
              <option value='all'>全部状态</option>
              <option value='active'>进行中</option>
              <option value='completed'>已完成</option>
              <option value='cancelled'>已取消</option>
            </select>
            {hasActiveFilters && (
              <Button variant='ghost' onClick={clearFilters}>
                清空筛选
              </Button>
            )}
          </div>
        </div>

        {/* 数据表格 */}
        <div className='min-h-[400px] flex-1 overflow-auto rounded-md border'>
          <table className='w-full'>
            <thead className='bg-muted'>
              <tr>
                <th className='px-4 py-2 text-left text-sm font-medium'>ID</th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  客户信息
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  服务日期
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  血压
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  理疗参数
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  状态
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className='text-muted-foreground px-4 py-8 text-center'
                  >
                    加载中...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='text-muted-foreground px-4 py-8 text-center'
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <ClipboardList className='h-8 w-8' />
                      <p>暂无服务记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className='hover:bg-muted/50 cursor-pointer border-t'
                    onClick={() => handleOpenDetailDialog(record)}
                  >
                    <td className='px-4 py-3 text-sm'>{record.id}</td>
                    <td className='px-4 py-3 text-sm'>
                      <div>
                        <div className='font-medium'>
                          {record.archive?.basicInfo?.name || '-'}
                        </div>
                        <div className='text-muted-foreground'>
                          {record.archive?.customerNo || '-'}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-sm'>{record.serviceDate}</td>
                    <td className='px-4 py-3 text-sm'>
                      {record.bloodPressure?.systolic &&
                      record.bloodPressure?.diastolic ? (
                        <span>
                          {record.bloodPressure.systolic}/
                          {record.bloodPressure.diastolic} mmHg
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className='px-4 py-3 text-sm'>
                      <div className='text-xs'>
                        <div>时长: {record.duration}分钟</div>
                        <div>温度: {record.temperature}℃</div>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-sm'>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${
                          record.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.status === 'completed'
                          ? '已完成'
                          : record.status === 'active'
                            ? '进行中'
                            : '已取消'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控件 */}
        {pagination.total > 0 && (
          <div className='flex items-center justify-between'>
            <div className='text-muted-foreground text-sm'>
              共 {pagination.total} 条记录，当前第 {pagination.page}/
              {pagination.totalPages} 页
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={pagination.page <= 1}
                onClick={() => updatePagination({ page: pagination.page - 1 })}
              >
                上一页
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updatePagination({ page: pagination.page + 1 })}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>服务记录详情</DialogTitle>
            <DialogDescription>查看完整的服务记录信息</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className='space-y-6'>
              {/* 基本信息 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  基本信息
                </h3>
                <div className='grid grid-cols-2 gap-4 rounded-lg border p-4'>
                  <div>
                    <div className='text-muted-foreground text-sm'>记录ID</div>
                    <div className='font-medium'>{selectedRecord.id}</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      服务日期
                    </div>
                    <div className='font-medium'>
                      {selectedRecord.serviceDate}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      客户编号
                    </div>
                    <div className='font-medium'>
                      {selectedRecord.archive?.customerNo || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      服务次数
                    </div>
                    <div className='font-medium'>
                      第 {selectedRecord.count} 次
                    </div>
                  </div>
                </div>
              </div>

              {/* 客户信息 */}
              {selectedRecord.archive?.basicInfo && (
                <div className='space-y-2'>
                  <h3 className='text-muted-foreground text-sm font-semibold'>
                    客户信息
                  </h3>
                  <div className='grid grid-cols-3 gap-4 rounded-lg border p-4'>
                    <div>
                      <div className='text-muted-foreground text-sm'>姓名</div>
                      <div className='font-medium'>
                        {selectedRecord.archive.basicInfo.name || '-'}
                      </div>
                    </div>
                    <div>
                      <div className='text-muted-foreground text-sm'>性别</div>
                      <div className='font-medium'>
                        {selectedRecord.archive.basicInfo.gender || '-'}
                      </div>
                    </div>
                    <div>
                      <div className='text-muted-foreground text-sm'>年龄</div>
                      <div className='font-medium'>
                        {selectedRecord.archive.basicInfo.age || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 血压 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  血压
                </h3>
                <div className='grid grid-cols-2 gap-4 rounded-lg border p-4'>
                  <div>
                    <div className='text-muted-foreground text-sm'>收缩压</div>
                    <div className='text-2xl font-bold'>
                      {selectedRecord.bloodPressure.systolic} mmHg
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>舒张压</div>
                    <div className='text-2xl font-bold'>
                      {selectedRecord.bloodPressure.diastolic} mmHg
                    </div>
                  </div>
                </div>
              </div>

              {/* 理疗参数 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  理疗参数
                </h3>
                <div className='grid grid-cols-2 gap-4 rounded-lg border p-4'>
                  <div>
                    <div className='text-muted-foreground text-sm'>时长</div>
                    <div className='text-xl font-bold'>
                      {selectedRecord.duration} 分钟
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>温度</div>
                    <div className='text-xl font-bold'>
                      {selectedRecord.temperature}℃
                    </div>
                  </div>
                </div>
              </div>

              {/* 不适症状 */}
              {selectedRecord.discomfort &&
                (selectedRecord.discomfort.tags.length > 0 ||
                  selectedRecord.discomfort.notes) && (
                  <div className='space-y-2'>
                    <h3 className='text-muted-foreground text-sm font-semibold'>
                      不适症状
                    </h3>
                    <div className='space-y-2 rounded-lg border p-4'>
                      {selectedRecord.discomfort.tags.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {selectedRecord.discomfort.tags.map((tag, index) => (
                            <Badge key={index} variant='outline'>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedRecord.discomfort.notes && (
                        <p className='text-sm'>
                          {selectedRecord.discomfort.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* 顾问信息 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  服务顾问
                </h3>
                <div className='rounded-lg border p-4'>
                  <div className='font-medium'>
                    {selectedRecord.consultant.name || '-'}
                  </div>
                </div>
              </div>

              {/* 反馈 */}
              {selectedRecord.feedback && (
                <div className='space-y-2'>
                  <h3 className='text-muted-foreground text-sm font-semibold'>
                    服务反馈
                  </h3>
                  <div className='rounded-lg border p-4'>
                    <p className='text-sm'>{selectedRecord.feedback}</p>
                  </div>
                </div>
              )}

              {/* 状态 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  服务状态
                </h3>
                <div className='rounded-lg border p-4'>
                  <Badge
                    variant='outline'
                    className={
                      selectedRecord.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : selectedRecord.status === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                    }
                  >
                    {selectedRecord.status === 'completed'
                      ? '已完成'
                      : selectedRecord.status === 'active'
                        ? '进行中'
                        : '已取消'}
                  </Badge>
                </div>
              </div>

              {/* 时间戳 */}
              <div className='text-muted-foreground text-xs'>
                创建时间:{' '}
                {new Date(selectedRecord.createdAt).toLocaleString('zh-CN')}
                {selectedRecord.updatedAt !== selectedRecord.createdAt && (
                  <span>
                    {' '}
                    | 更新时间:{' '}
                    {new Date(selectedRecord.updatedAt).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
