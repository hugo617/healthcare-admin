'use client';

import React, { useEffect, useState } from 'react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { Pagination } from '@/components/table/pagination';
import PageContainer from '@/components/layout/page-container';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 导入租户管理组件和 hooks
import {
  TenantTable,
  TenantFilters,
  TenantDialogs,
  TenantPageHeader,
  TenantStatistics,
  FloatingBatchActions
} from './components';
import { useTenantFilters, useTenantManagement } from './hooks';
import {
  Tenant,
  TenantFormData,
  TenantDialogState,
  ExportFormat
} from './types';
import { PAGE_SIZE_OPTIONS, DIALOG_TYPES } from './constants';

export default function TenantManagementPage() {
  // 使用自定义 hooks
  const {
    filters,
    searchFilters,
    updatePagination,
    clearFilters,
    hasActiveFilters
  } = useTenantFilters();
  const {
    tenants,
    loading,
    pagination,
    fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    toggleTenantStatus,
    // 新增：统计数据、批量操作、导出
    statistics,
    selectedTenants,
    fetchStatistics,
    batchOperateTenants,
    toggleTenantSelection,
    toggleAllSelection,
    clearTenantSelection,
    exportTenants
  } = useTenantManagement();

  // 对话框状态
  const [dialogState, setDialogState] = useState<TenantDialogState>({
    type: null,
    tenant: null,
    open: false
  });

  // 监听 filters 变化，获取租户数据
  useEffect(() => {
    fetchTenants(filters);
  }, [filters, fetchTenants]);

  // 页面加载时获取统计数据
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  /**
   * 打开创建租户对话框
   */
  const handleOpenCreateDialog = () => {
    setDialogState({
      type: DIALOG_TYPES.CREATE as any,
      tenant: null,
      open: true
    });
  };

  /**
   * 打开编辑租户对话框
   */
  const handleOpenEditDialog = (tenant: Tenant) => {
    setDialogState({
      type: DIALOG_TYPES.EDIT as any,
      tenant,
      open: true
    });
  };

  /**
   * 打开状态切换对话框
   */
  const handleOpenStatusDialog = (
    tenant: Tenant,
    action: 'activate' | 'deactivate' | 'suspend'
  ) => {
    setDialogState({
      type: DIALOG_TYPES.STATUS as any,
      tenant,
      open: true,
      action
    });
  };

  /**
   * 打开删除租户对话框
   */
  const handleOpenDeleteDialog = (tenant: Tenant) => {
    setDialogState({
      type: DIALOG_TYPES.DELETE as any,
      tenant,
      open: true
    });
  };

  /**
   * 关闭对话框
   */
  const handleCloseDialog = () => {
    setDialogState({
      type: null,
      tenant: null,
      open: false
    });
  };

  /**
   * 创建租户
   */
  const handleCreateTenant = async (data: TenantFormData) => {
    const success = await createTenant(data);
    if (success) {
      await fetchTenants(filters);
      handleCloseDialog();
    }
    return success;
  };

  /**
   * 更新租户
   */
  const handleUpdateTenant = async (data: TenantFormData) => {
    if (!dialogState.tenant) return false;

    const success = await updateTenant(dialogState.tenant.id, data);
    if (success) {
      // 先刷新数据，再关闭对话框
      await fetchTenants(filters);
      handleCloseDialog();
    }
    return success;
  };

  /**
   * 删除租户
   */
  const handleDeleteTenant = async (tenant: Tenant) => {
    const success = await deleteTenant(tenant.id);
    if (success) {
      await fetchTenants(filters);
      handleCloseDialog();
    }
    return success;
  };

  /**
   * 切换租户状态
   */
  const handleToggleStatus = async (
    tenant: Tenant,
    action: 'activate' | 'deactivate' | 'suspend'
  ) => {
    let newStatus: 'active' | 'inactive' | 'suspended';

    switch (action) {
      case 'activate':
        newStatus = 'active';
        break;
      case 'deactivate':
        newStatus = 'inactive';
        break;
      case 'suspend':
        newStatus = 'suspended';
        break;
    }

    const success = await toggleTenantStatus(tenant.id, newStatus);
    if (success) {
      await fetchTenants(filters);
      handleCloseDialog();
    }
    return success;
  };

  /**
   * 打开配置对话框
   */
  const handleOpenConfigDialog = (tenant: Tenant) => {
    setDialogState({
      type: DIALOG_TYPES.CONFIG as any,
      tenant,
      open: true
    });
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    fetchStatistics();
    fetchTenants(filters);
  };

  /**
   * 导出租户
   */
  const handleExport = () => {
    exportTenants('csv');
  };

  /**
   * 批量启用
   */
  const handleBatchActivate = async () => {
    const success = await batchOperateTenants('activate');
    if (success) {
      fetchTenants(filters);
    }
  };

  /**
   * 批量停用
   */
  const handleBatchDeactivate = async () => {
    const success = await batchOperateTenants('deactivate');
    if (success) {
      fetchTenants(filters);
    }
  };

  /**
   * 批量暂停
   */
  const handleBatchSuspend = async () => {
    const success = await batchOperateTenants('suspend');
    if (success) {
      fetchTenants(filters);
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    const success = await batchOperateTenants('delete');
    if (success) {
      fetchTenants(filters);
    }
  };

  return (
    <PermissionGuard permissions={[PERMISSIONS.TENANT.READ]}>
      <PageContainer scrollable={true} bentoMode={true}>
        <div className='flex min-h-[calc(100vh-8rem)] w-full flex-col space-y-3 p-4'>
          {/* 头部区域：包含标题、操作按钮和统计卡片 */}
          <div className='space-y-3'>
            <TenantPageHeader
              onCreateTenant={handleOpenCreateDialog}
              onExportTenants={handleExport}
              onRefresh={handleRefresh}
              totalTenants={statistics?.overview.total}
              activeTenants={statistics?.overview.active}
              loading={loading}
            />
            <TenantStatistics statistics={statistics} loading={loading} />
          </div>

          {/* 搜索和筛选 */}
          <TenantFilters
            filters={filters}
            onSearch={searchFilters}
            onReset={clearFilters}
            loading={loading}
          />

          {/* 数据表格和分页 */}
          <div className='flex min-h-0 flex-1 flex-col'>
            <div className='min-h-0 flex-1'>
              <TenantTable
                tenants={tenants}
                loading={loading}
                pagination={pagination}
                onEdit={handleOpenEditDialog}
                onDelete={handleOpenDeleteDialog}
                onToggleStatus={handleOpenStatusDialog}
                selectedTenants={selectedTenants}
                onToggleSelection={toggleTenantSelection}
                onToggleAll={toggleAllSelection}
                onOpenConfig={handleOpenConfigDialog}
                emptyState={{
                  icon: <Building2 className='text-muted-foreground h-8 w-8' />,
                  title: hasActiveFilters ? '未找到匹配的租户' : '还没有租户',
                  description: hasActiveFilters
                    ? '请尝试调整筛选条件以查看更多结果'
                    : '开始添加租户来管理您的多租户系统',
                  action: !hasActiveFilters ? (
                    <PermissionGuard permissions={[PERMISSIONS.TENANT.CREATE]}>
                      <Button
                        onClick={handleOpenCreateDialog}
                        size='sm'
                        className='mt-2'
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        添加租户
                      </Button>
                    </PermissionGuard>
                  ) : undefined
                }}
              />
            </div>

            {/* 分页控件 */}
            <div className='flex-shrink-0 pt-4'>
              <Pagination
                pagination={{
                  page: pagination.page,
                  limit: pagination.pageSize,
                  total: pagination.total,
                  totalPages: pagination.totalPages
                }}
                onPageChange={(page) => updatePagination({ page })}
                onPageSizeChange={(pageSize) =>
                  updatePagination({ pageSize, page: 1 })
                }
                pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
              />
            </div>
          </div>

          {/* 租户对话框 */}
          <TenantDialogs
            dialogState={dialogState}
            onClose={handleCloseDialog}
            onCreateTenant={handleCreateTenant}
            onUpdateTenant={handleUpdateTenant}
            onDeleteTenant={handleDeleteTenant}
            onToggleStatus={handleToggleStatus}
            loading={loading}
          />

          {/* 浮动批量操作栏 */}
          <FloatingBatchActions
            selectedCount={selectedTenants.size}
            onBatchActivate={handleBatchActivate}
            onBatchDeactivate={handleBatchDeactivate}
            onBatchSuspend={handleBatchSuspend}
            onBatchDelete={handleBatchDelete}
            onClearSelection={clearTenantSelection}
            visible={selectedTenants.size > 0}
          />
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}
