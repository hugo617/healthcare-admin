'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permission-constants';
import { Pagination } from '@/components/table/pagination';
import PageContainer from '@/components/layout/page-container';

// 导入类型和常量
import type {
  Permission,
  PermissionFilters,
  PermissionFormData,
  ViewMode,
  PermissionTreeNode
} from './types';
import { PAGE_SIZE_OPTIONS } from './constants';

// 导入自定义hooks
import { usePermissionFilters, usePermissionManagement } from './hooks';
import { usePermissionTree } from './hooks/usePermissionTree';
import { usePermissionUsage } from './hooks/usePermissionUsage';

// 导入组件
import {
  PermissionPageHeader,
  PermissionFilters as PermissionFiltersComponent,
  PermissionTable,
  PermissionDialogs
} from './components';
import { PermissionTree } from './components/PermissionTree';
import { PermissionUsageDialog } from './components/PermissionUsageDialog';
import { PermissionTemplateDialog } from './components/PermissionTemplateDialog';

function PermissionManagementPageContent() {
  // 视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // 使用自定义 hooks
  const {
    filters,
    searchFilters,
    updatePagination,
    clearFilters,
    hasActiveFilters
  } = usePermissionFilters();
  const {
    permissions,
    loading,
    pagination,
    dialogState,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    openCreateDialog,
    openCreateChildDialog,
    openEditDialog,
    closeDialog
  } = usePermissionManagement();
  const {
    tree,
    loading: treeLoading,
    fetchPermissionTree
  } = usePermissionTree();
  const {
    usage,
    loading: usageLoading,
    fetchUsage,
    clearUsage
  } = usePermissionUsage();

  // 初始加载权限树（如果是树形视图）
  useEffect(() => {
    if (viewMode === 'tree') {
      fetchPermissionTree();
    }
  }, [viewMode, fetchPermissionTree]);

  // 监听 filters 变化，获取权限数据
  useEffect(() => {
    if (viewMode === 'table') {
      fetchPermissions(filters);
    }
  }, [filters, fetchPermissions, viewMode]);

  // 业务处理函数
  const handleSearch = (newFilters: Partial<PermissionFilters>) => {
    searchFilters(newFilters);
  };

  const handleReset = () => {
    clearFilters();
  };

  const handleFormSubmit = async (data: PermissionFormData) => {
    let success = false;

    if (dialogState.type === 'create') {
      // 如果有父权限，将其 ID 添加到数据中
      const submitData = dialogState.parentPermission
        ? { ...data, parentId: dialogState.parentPermission.id }
        : data;
      success = await createPermission(submitData);
    } else if (dialogState.type === 'edit' && dialogState.permission) {
      success = await updatePermission(dialogState.permission.id, data);
    }

    if (success) {
      closeDialog();
      // 重新获取数据
      if (viewMode === 'tree') {
        fetchPermissionTree();
      } else {
        fetchPermissions(filters);
      }
    }
  };

  const handleDeletePermission = async (permission: Permission) => {
    const success = await deletePermission(permission.id);
    if (success) {
      // 重新获取数据
      if (viewMode === 'tree') {
        fetchPermissionTree();
      } else {
        fetchPermissions(filters);
      }
    }
  };

  // 查看权限使用情况
  const handleViewUsage = useCallback(
    async (permission: Permission | PermissionTreeNode) => {
      await fetchUsage(permission.id);
    },
    [fetchUsage]
  );

  // 创建子权限
  const handleCreateChild = useCallback(
    (parentId: number) => {
      const parentPermission = tree.find((p) => p.id === parentId);
      if (parentPermission) {
        openCreateChildDialog(parentPermission);
      }
    },
    [openCreateChildDialog, tree]
  );

  // 刷新数据
  const handleRefresh = useCallback(() => {
    if (viewMode === 'tree') {
      fetchPermissionTree();
    } else {
      fetchPermissions(filters);
    }
  }, [viewMode, fetchPermissionTree, fetchPermissions, filters]);

  // 获取当前总数
  const totalCount = viewMode === 'tree' ? tree.length : pagination.total;

  return (
    <PermissionGuard permissions={PERMISSIONS.PERMISSION.READ}>
      <PageContainer scrollable={false}>
        <div className='flex h-[calc(100vh-8rem)] w-full flex-col space-y-4'>
          {/* 页面头部 */}
          <PermissionPageHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onCreatePermission={openCreateDialog}
            onTemplateManage={() => setTemplateDialogOpen(true)}
            onRefresh={handleRefresh}
            loading={viewMode === 'tree' ? treeLoading : loading}
            totalCount={totalCount}
          />

          {/* 搜索和筛选（仅列表视图） */}
          {viewMode === 'table' && (
            <PermissionFiltersComponent
              filters={filters}
              onSearch={handleSearch}
              onReset={handleReset}
              loading={loading}
            />
          )}

          {/* 内容区域 */}
          <div className='flex min-h-0 flex-1 flex-col'>
            {viewMode === 'tree' ? (
              /* 树形视图 */
              <PermissionTree
                tree={tree}
                loading={treeLoading}
                onEdit={(p) => openEditDialog(p)}
                onDelete={handleDeletePermission}
                onCreateChild={handleCreateChild}
                onViewUsage={handleViewUsage}
              />
            ) : (
              /* 列表视图 */
              <>
                <PermissionTable
                  permissions={permissions}
                  loading={loading}
                  pagination={pagination}
                  onEdit={openEditDialog}
                  onDelete={handleDeletePermission}
                  onViewUsage={handleViewUsage}
                />

                {/* 分页控件 */}
                <Pagination
                  pagination={pagination}
                  onPageChange={(page) => updatePagination(page)}
                  onPageSizeChange={(limit) => updatePagination(1, limit)}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                />
              </>
            )}
          </div>

          {/* 对话框 */}
          <PermissionDialogs
            dialogState={dialogState}
            onClose={closeDialog}
            onSubmit={handleFormSubmit}
          />

          {/* 使用情况对话框 */}
          <PermissionUsageDialog
            usage={usage}
            open={usage !== null}
            onClose={clearUsage}
          />

          {/* 模板管理对话框 */}
          <PermissionTemplateDialog
            open={templateDialogOpen}
            onClose={() => setTemplateDialogOpen(false)}
          />
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}

export default function PermissionManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PermissionManagementPageContent />
    </Suspense>
  );
}
