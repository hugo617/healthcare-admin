'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { HeartPulse, Activity } from 'lucide-react';
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
import { useHealthRecordFilters, useHealthRecordManagement } from './hooks';
import { HealthRecord } from './types';

export default function HealthRecordManagementPage() {
  // 使用自定义 hooks
  const {
    filters,
    updatePagination,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useHealthRecordFilters();
  const {
    records,
    loading,
    pagination,
    statistics,
    fetchRecords,
    fetchStatistics
  } = useHealthRecordManagement();

  // 详情对话框状态
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(
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
  const handleOpenDetailDialog = (record: HealthRecord) => {
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
   * 获取血压等级样式
   */
  const getBloodPressureLevel = (systolic: number, diastolic: number) => {
    if (systolic >= 180 || diastolic >= 110) {
      return { label: '高危', color: 'text-red-800 bg-red-200' };
    } else if (systolic >= 160 || diastolic >= 100) {
      return { label: 'III级', color: 'text-red-600 bg-red-100' };
    } else if (systolic >= 140 || diastolic >= 90) {
      return { label: 'I级', color: 'text-orange-600 bg-orange-100' };
    } else if (systolic >= 120 || diastolic >= 80) {
      return { label: '偏高', color: 'text-yellow-600 bg-yellow-100' };
    }
    return { label: '正常', color: 'text-green-600 bg-green-100' };
  };

  return (
    <PageContainer scrollable={true} bentoMode={true}>
      <div className='flex min-h-[calc(100vh-8rem)] w-full flex-col space-y-4 p-4'>
        {/* 页面头部 */}
        <div className='flex flex-shrink-0 items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>健康档案管理</h1>
            <p className='text-muted-foreground'>管理所有用户的健康记录</p>
          </div>
          <Button variant='outline' onClick={handleRefresh}>
            刷新
          </Button>
        </div>

        {/* 统计信息 */}
        {statistics && (
          <div className='grid gap-4 md:grid-cols-5'>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>总记录数</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.totalRecords}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>本月记录</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.thisMonthRecords}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>平均血压</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.avgBloodPressure.systolic}/
                {statistics.overview.avgBloodPressure.diastolic}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>平均血糖</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.avgBloodSugar}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>平均心率</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.avgHeartRate}
              </div>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className='flex-shrink-0'>
          <div className='flex gap-2'>
            <input
              type='text'
              placeholder='搜索用户名...'
              className='border-input bg-background flex h-10 w-[200px] rounded-md border px-3 py-2 text-sm'
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecords(filters)}
            />
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
                  用户
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  记录日期
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  血压
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  血糖
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  其他指标
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
                      <HeartPulse className='h-8 w-8' />
                      <p>暂无健康记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const bpLevel =
                    record.bloodPressure?.systolic &&
                    record.bloodPressure?.diastolic
                      ? getBloodPressureLevel(
                          record.bloodPressure.systolic,
                          record.bloodPressure.diastolic
                        )
                      : null;

                  return (
                    <tr
                      key={record.id}
                      className='hover:bg-muted/50 cursor-pointer border-t'
                      onClick={() => handleOpenDetailDialog(record)}
                    >
                      <td className='px-4 py-3 text-sm'>{record.id}</td>
                      <td className='px-4 py-3 text-sm'>
                        <div>
                          <div className='font-medium'>
                            {record.user?.realName ||
                              record.user?.username ||
                              '-'}
                          </div>
                          <div className='text-muted-foreground'>
                            {record.user?.phone || '-'}
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3 text-sm'>{record.recordDate}</td>
                      <td className='px-4 py-3 text-sm'>
                        {record.bloodPressure?.systolic &&
                        record.bloodPressure?.diastolic ? (
                          <div className='flex items-center gap-2'>
                            <span>
                              {record.bloodPressure.systolic}/
                              {record.bloodPressure.diastolic}
                            </span>
                            {bpLevel && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${bpLevel.color}`}
                              >
                                {bpLevel.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {record.bloodSugar?.value ? (
                          <div>
                            <div>
                              {record.bloodSugar.value} {record.bloodSugar.unit}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {record.bloodSugar.type === 'fasting'
                                ? '空腹'
                                : record.bloodSugar.type === 'postprandial'
                                  ? '餐后'
                                  : '随机'}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        <div className='text-xs'>
                          {record.heartRate && (
                            <div className='flex items-center gap-1'>
                              <Activity className='h-3 w-3' />
                              心率: {record.heartRate} bpm
                            </div>
                          )}
                          {record.weight?.value && (
                            <div>
                              体重: {record.weight.value} {record.weight.unit}
                            </div>
                          )}
                          {record.temperature?.value && (
                            <div>
                              体温: {record.temperature.value}{' '}
                              {record.temperature.unit}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
            <DialogTitle>健康记录详情</DialogTitle>
            <DialogDescription>查看完整的健康指标信息</DialogDescription>
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
                      记录日期
                    </div>
                    <div className='font-medium'>
                      {selectedRecord.recordDate}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>用户</div>
                    <div className='font-medium'>
                      {selectedRecord.user?.realName ||
                        selectedRecord.user?.username ||
                        '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      联系电话
                    </div>
                    <div className='font-medium'>
                      {selectedRecord.user?.phone || '-'}
                    </div>
                  </div>
                </div>
              </div>

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

              {/* 血糖 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  血糖
                </h3>
                <div className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-muted-foreground text-sm'>
                        血糖值
                      </div>
                      <div className='text-2xl font-bold'>
                        {selectedRecord.bloodSugar.value}{' '}
                        {selectedRecord.bloodSugar.unit}
                      </div>
                    </div>
                    <Badge variant='outline'>
                      {selectedRecord.bloodSugar.type === 'fasting'
                        ? '空腹'
                        : selectedRecord.bloodSugar.type === 'postprandial'
                          ? '餐后'
                          : '随机'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 其他指标 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  其他指标
                </h3>
                <div className='grid grid-cols-3 gap-4 rounded-lg border p-4'>
                  {selectedRecord.heartRate && (
                    <div>
                      <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                        <Activity className='h-3 w-3' />
                        心率
                      </div>
                      <div className='text-xl font-bold'>
                        {selectedRecord.heartRate} bpm
                      </div>
                    </div>
                  )}
                  {selectedRecord.weight?.value && (
                    <div>
                      <div className='text-muted-foreground text-sm'>体重</div>
                      <div className='text-xl font-bold'>
                        {selectedRecord.weight.value}{' '}
                        {selectedRecord.weight.unit}
                      </div>
                    </div>
                  )}
                  {selectedRecord.temperature?.value && (
                    <div>
                      <div className='text-muted-foreground text-sm'>体温</div>
                      <div className='text-xl font-bold'>
                        {selectedRecord.temperature.value}{' '}
                        {selectedRecord.temperature.unit}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 备注 */}
              {selectedRecord.notes && (
                <div className='space-y-2'>
                  <h3 className='text-muted-foreground text-sm font-semibold'>
                    备注
                  </h3>
                  <div className='rounded-lg border p-4'>
                    <p className='text-sm'>{selectedRecord.notes}</p>
                  </div>
                </div>
              )}

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
