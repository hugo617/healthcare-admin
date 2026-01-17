'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { FileText, User } from 'lucide-react';
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
import { HealthArchive } from './types';
import { GENDER_MAP, ARCHIVE_STATUS_MAP } from './constants';

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
  const [selectedArchive, setSelectedArchive] = useState<HealthArchive | null>(
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
  const handleOpenDetailDialog = (archive: HealthArchive) => {
    setSelectedArchive(archive);
    setDetailDialogOpen(true);
  };

  /**
   * 关闭详情对话框
   */
  const handleCloseDetailDialog = () => {
    setSelectedArchive(null);
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
   * 获取性别显示
   */
  const getGenderDisplay = (sex: string) => {
    const gender = GENDER_MAP[sex as keyof typeof GENDER_MAP];
    if (!gender)
      return { label: sex, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    return gender;
  };

  /**
   * 获取状态显示
   */
  const getStatusDisplay = (status: string) => {
    const statusInfo =
      ARCHIVE_STATUS_MAP[status as keyof typeof ARCHIVE_STATUS_MAP];
    if (!statusInfo)
      return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    return statusInfo;
  };

  return (
    <PageContainer scrollable={true} bentoMode={true}>
      <div className='flex min-h-[calc(100vh-8rem)] w-full flex-col space-y-4 p-4'>
        {/* 页面头部 */}
        <div className='flex flex-shrink-0 items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>健康档案管理</h1>
            <p className='text-muted-foreground'>管理所有用户的健康档案</p>
          </div>
          <Button variant='outline' onClick={handleRefresh}>
            刷新
          </Button>
        </div>

        {/* 统计信息 */}
        {statistics && (
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>总档案数</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.totalArchives}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>本月新增</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.thisMonthArchives}
              </div>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='text-muted-foreground text-sm'>活跃档案</div>
              <div className='text-2xl font-bold'>
                {statistics.overview.activeArchives}
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
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  客户编号
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  姓名
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  性别
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  年龄
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  联系电话
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  状态
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium'>
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className='text-muted-foreground px-4 py-8 text-center'
                  >
                    加载中...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className='text-muted-foreground px-4 py-8 text-center'
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <FileText className='h-8 w-8' />
                      <p>暂无健康档案</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((archive) => {
                  const gender = getGenderDisplay(archive.basicInfo?.sex);
                  const status = getStatusDisplay(archive.status);

                  return (
                    <tr
                      key={archive.id}
                      className='hover:bg-muted/50 cursor-pointer border-t'
                      onClick={() => handleOpenDetailDialog(archive)}
                    >
                      <td className='px-4 py-3 font-mono text-sm'>
                        {archive.customerNo}
                      </td>
                      <td className='px-4 py-3 text-sm font-medium'>
                        {archive.basicInfo?.name || '-'}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${gender.color} ${gender.bgColor}`}
                        >
                          {gender.label}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {archive.basicInfo?.age || '-'}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {archive.basicInfo?.contact || '-'}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        <Badge
                          variant='outline'
                          className={`${status.color} ${status.bgColor} border-0`}
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {new Date(archive.createdAt).toLocaleString('zh-CN')}
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
        <DialogContent className='max-h-[80vh] max-w-3xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>健康档案详情</DialogTitle>
            <DialogDescription>查看完整的健康档案信息</DialogDescription>
          </DialogHeader>
          {selectedArchive && (
            <div className='space-y-6'>
              {/* 基本信息 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  基本信息
                </h3>
                <div className='grid grid-cols-2 gap-4 rounded-lg border p-4'>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      客户编号
                    </div>
                    <div className='font-mono font-medium'>
                      {selectedArchive.customerNo}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>姓名</div>
                    <div className='font-medium'>
                      {selectedArchive.basicInfo?.name || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>性别</div>
                    <div className='font-medium'>
                      {
                        getGenderDisplay(selectedArchive.basicInfo?.sex || '')
                          .label
                      }
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>年龄</div>
                    <div className='font-medium'>
                      {selectedArchive.basicInfo?.age || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>身高</div>
                    <div className='font-medium'>
                      {selectedArchive.basicInfo?.height || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>体重</div>
                    <div className='font-medium'>
                      {selectedArchive.basicInfo?.weight || '-'}
                    </div>
                  </div>
                  <div className='col-span-2'>
                    <div className='text-muted-foreground text-sm'>
                      联系电话
                    </div>
                    <div className='font-medium'>
                      {selectedArchive.basicInfo?.contact || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 健康史 */}
              <div className='space-y-2'>
                <h3 className='text-muted-foreground text-sm font-semibold'>
                  健康史
                </h3>
                <div className='grid grid-cols-2 gap-4 rounded-lg border p-4'>
                  <div className='col-span-2'>
                    <div className='text-muted-foreground text-sm'>慢性病</div>
                    <div className='font-medium'>
                      {selectedArchive.healthHistory?.chronicDisease || '-'}
                    </div>
                  </div>
                  <div className='col-span-2'>
                    <div className='text-muted-foreground text-sm'>过敏史</div>
                    <div className='font-medium'>
                      {selectedArchive.healthHistory?.allergyText ||
                        selectedArchive.healthHistory?.allergy ||
                        '-'}
                    </div>
                  </div>
                  <div className='col-span-2'>
                    <div className='text-muted-foreground text-sm'>
                      用药情况
                    </div>
                    <div className='font-medium'>
                      {selectedArchive.healthHistory?.medication || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      手术史时间
                    </div>
                    <div className='font-medium'>
                      {selectedArchive.healthHistory?.surgeryHistory?.time ||
                        '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      手术史地点
                    </div>
                    <div className='font-medium'>
                      {selectedArchive.healthHistory?.surgeryHistory
                        ?.location || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      最近体检时间
                    </div>
                    <div className='font-medium'>
                      {selectedArchive.healthHistory?.recentCheckup?.time ||
                        '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      最近体检结果
                    </div>
                    <div className='font-medium'>
                      {selectedArchive.healthHistory?.recentCheckup?.result ||
                        '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 主观需求 */}
              {selectedArchive.subjectiveDemand && (
                <div className='space-y-2'>
                  <h3 className='text-muted-foreground text-sm font-semibold'>
                    主观需求
                  </h3>
                  <div className='rounded-lg border p-4'>
                    <p className='text-sm'>
                      {selectedArchive.subjectiveDemand}
                    </p>
                  </div>
                </div>
              )}

              {/* 状态 */}
              <div className='flex items-center gap-4'>
                <div className='text-muted-foreground text-sm'>档案状态：</div>
                <Badge
                  variant='outline'
                  className={`${getStatusDisplay(selectedArchive.status).color} ${getStatusDisplay(selectedArchive.status).bgColor} border-0`}
                >
                  {getStatusDisplay(selectedArchive.status).label}
                </Badge>
              </div>

              {/* 时间戳 */}
              <div className='text-muted-foreground text-xs'>
                创建时间:{' '}
                {new Date(selectedArchive.createdAt).toLocaleString('zh-CN')}
                {selectedArchive.updatedAt !== selectedArchive.createdAt && (
                  <span>
                    {' '}
                    | 更新时间:{' '}
                    {new Date(selectedArchive.updatedAt).toLocaleString(
                      'zh-CN'
                    )}
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
