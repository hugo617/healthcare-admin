/**
 * 组织架构管理页面
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import PageContainer from '@/components/layout/page-container';
import { Pagination } from '@/components/table/pagination';

import {
  OrganizationPageHeader,
  OrganizationFilters,
  OrganizationTable,
  OrganizationDialogs,
  OrganizationTree
} from './components';
import { useOrganizationFilters, useOrganizationManagement } from './hooks';
import type {
  Organization,
  OrganizationFormData,
  OrganizationDialogState,
  OrganizationTreeNode,
  ViewMode
} from './types';
import { PAGE_SIZE_OPTIONS, DIALOG_TYPES, MESSAGES } from './constants';

export default function OrganizationManagementPage() {
  // 使用自定义 hooks
  const {
    filters,
    searchFilters,
    updatePagination,
    clearFilters,
    hasActiveFilters
  } = useOrganizationFilters();

  const {
    organizations,
    tree,
    loading,
    pagination,
    fetchOrganizations,
    fetchOrganizationTree,
    createOrganization,
    updateOrganization,
    deleteOrganization
  } = useOrganizationManagement();

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // 对话框状态
  const [dialogState, setDialogState] = useState<OrganizationDialogState>({
    type: null,
    organization: null,
    open: false
  });

  // 监听 filters 变化，获取组织数据
  useEffect(() => {
    if (viewMode === 'table') {
      fetchOrganizations(filters);
    } else {
      fetchOrganizationTree();
    }
  }, [filters, viewMode, fetchOrganizations, fetchOrganizationTree]);

  /**
   * 打开创建组织对话框
   */
  const handleOpenCreateDialog = () => {
    setDialogState({
      type: DIALOG_TYPES.CREATE as any,
      organization: null,
      open: true
    });
  };

  /**
   * 打开编辑组织对话框
   */
  const handleOpenEditDialog = (organization: Organization) => {
    setDialogState({
      type: DIALOG_TYPES.EDIT as any,
      organization,
      open: true
    });
  };

  /**
   * 打开删除组织对话框
   */
  const handleOpenDeleteDialog = (organization: Organization) => {
    setDialogState({
      type: DIALOG_TYPES.DELETE as any,
      organization,
      open: true
    });
  };

  /**
   * 关闭对话框
   */
  const handleCloseDialog = () => {
    setDialogState({
      type: null,
      organization: null,
      open: false
    });
  };

  /**
   * 创建组织
   */
  const handleCreateOrganization = async (
    data: OrganizationFormData
  ): Promise<boolean> => {
    return await createOrganization(data);
  };

  /**
   * 更新组织
   */
  const handleUpdateOrganization = async (
    data: OrganizationFormData
  ): Promise<boolean> => {
    if (!dialogState.organization) return false;
    return await updateOrganization(dialogState.organization.id, data);
  };

  /**
   * 删除组织
   */
  const handleDeleteOrganization = async (
    organization: Organization
  ): Promise<boolean> => {
    return await deleteOrganization(organization.id);
  };

  /**
   * 处理树节点操作
   */
  const handleTreeEdit = (node: OrganizationTreeNode) => {
    handleOpenEditDialog(node as Organization);
  };

  const handleTreeDelete = (node: OrganizationTreeNode) => {
    handleOpenDeleteDialog(node as Organization);
  };

  const handleTreeAddUser = (node: OrganizationTreeNode) => {
    // TODO: 实现添加用户功能
    console.log('Add user to organization:', node.id);
  };

  const handleTreeCreateChild = (parentId: string) => {
    // TODO: 实现创建子组织功能
    console.log('Create child organization:', parentId);
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    if (viewMode === 'table') {
      fetchOrganizations(filters);
    } else {
      fetchOrganizationTree();
    }
  };

  return (
    <PermissionGuard permissions={[PERMISSIONS.ORGANIZATION.READ]}>
      <PageContainer scrollable={true}>
        <div className='flex min-h-[calc(100vh-8rem)] w-full flex-col space-y-4 p-4'>
          {/* 页面头部 */}
          <div className='flex-shrink-0'>
            <OrganizationPageHeader
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onCreateOrganization={handleOpenCreateDialog}
              onRefresh={handleRefresh}
              loading={loading}
              totalCount={pagination.total}
            />
          </div>

          {/* 搜索和筛选 */}
          {viewMode === 'table' && (
            <div className='flex-shrink-0'>
              <OrganizationFilters
                filters={filters}
                onSearch={searchFilters}
                onReset={clearFilters}
                loading={loading}
              />
            </div>
          )}

          {/* 内容区域 */}
          <div className='flex min-h-0 flex-1 flex-col'>
            {viewMode === 'table' ? (
              <>
                {/* 表格视图 */}
                <div className='bg-background min-h-[400px] flex-1 overflow-hidden rounded-md border'>
                  <OrganizationTable
                    organizations={organizations}
                    loading={loading}
                    pagination={pagination}
                    onEdit={handleOpenEditDialog}
                    onDelete={handleOpenDeleteDialog}
                    emptyState={{
                      icon: (
                        <Building2 className='text-muted-foreground h-8 w-8' />
                      ),
                      title: hasActiveFilters
                        ? '未找到匹配的组织'
                        : '还没有组织',
                      description: hasActiveFilters
                        ? '请尝试调整筛选条件以查看更多结果'
                        : '开始添加组织来管理您的组织架构',
                      action: !hasActiveFilters ? (
                        <Button
                          onClick={handleOpenCreateDialog}
                          size='sm'
                          className='mt-2'
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          添加组织
                        </Button>
                      ) : undefined
                    }}
                  />
                </div>

                {/* 分页控件 */}
                <div className='bg-background flex-shrink-0 pt-4'>
                  <Pagination
                    pagination={pagination}
                    onPageChange={(page) => updatePagination({ page })}
                    onPageSizeChange={(limit) =>
                      updatePagination({ limit, page: 1 })
                    }
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                  />
                </div>
              </>
            ) : (
              /* 树形视图 */
              <div className='min-h-[400px] flex-1'>
                <OrganizationTree
                  tree={tree}
                  loading={loading}
                  onEdit={handleTreeEdit}
                  onDelete={handleTreeDelete}
                  onAddUser={handleTreeAddUser}
                  onCreateChild={handleTreeCreateChild}
                />
              </div>
            )}
          </div>

          {/* 组织对话框 */}
          <OrganizationDialogs
            dialogState={dialogState}
            onClose={handleCloseDialog}
            onCreateOrganization={handleCreateOrganization}
            onUpdateOrganization={handleUpdateOrganization}
            onDeleteOrganization={handleDeleteOrganization}
          />
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}
