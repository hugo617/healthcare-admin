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
  TenantPageHeader
} from './components';
import { useTenantFilters, useTenantManagement } from './hooks';
import { Tenant, TenantFormData, TenantDialogState } from './types';
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
    toggleTenantStatus
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
  const handleOpenStatusDialog = (tenant: Tenant, action: 'activate' | 'deactivate' | 'suspend') => {
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
      handleCloseDialog();
      fetchTenants(filters);
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
      handleCloseDialog();
      fetchTenants(filters);
    }
    return success;
  };

  /**
   * 删除租户
   */
  const handleDeleteTenant = async (tenant: Tenant) => {
    const success = await deleteTenant(tenant.id);
    if (success) {
      handleCloseDialog();
      fetchTenants(filters);
    }
    return success;
  };

  /**
   * 切换租户状态
   */
  const handleToggleStatus = async (tenant: Tenant, action: 'activate' | 'deactivate' | 'suspend') => {
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
      handleCloseDialog();
      fetchTenants(filters);
    }
    return success;
  };

  return (
    <PermissionGuard permissions={[PERMISSIONS.TENANT.READ]}>
      <PageContainer scrollable={false}>
        <div className='flex h-[calc(100vh-8rem)] w-full flex-col space-y-4'>
          {/* 页面头部 */}
          <TenantPageHeader onCreateTenant={handleOpenCreateDialog} />

          {/* 搜索和筛选 */}
          <TenantFilters
            filters={filters}
            onSearch={searchFilters}
            onReset={clearFilters}
            loading={loading}
          />

          {/* 数据表格和分页 */}
          <div className='flex min-h-0 flex-1 flex-col'>
            <div className='min-h-0'>
              <TenantTable
                tenants={tenants}
                loading={loading}
                pagination={pagination}
                onEdit={handleOpenEditDialog}
                onDelete={handleOpenDeleteDialog}
                onToggleStatus={handleOpenStatusDialog}
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
                pagination={pagination}
                onPageChange={(page) => updatePagination({ page })}
                onPageSizeChange={(limit) =>
                  updatePagination({ limit, page: 1 })
                }
                pageSizeOptions={PAGE_SIZE_OPTIONS}
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
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}