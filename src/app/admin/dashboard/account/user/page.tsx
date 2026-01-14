'use client';

import React, { useEffect, useState } from 'react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { Pagination } from '@/components/table/pagination';
import PageContainer from '@/components/layout/page-container';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 导入重构后的组件和 hooks
import {
  UserTable,
  UserCardGrid,
  UserFilters,
  UserDialogs,
  UserPageHeader,
  UserStatistics,
  ViewToggle,
  FloatingBatchActions
} from './components';
import { useUserFilters, useUserManagement, useViewMode } from './hooks';
import { User, UserFormData, UserDialogState } from './types';
import { PAGE_SIZE_OPTIONS, DIALOG_TYPES } from './constants';

export default function UserManagementPage() {
  // 使用自定义 hooks
  const {
    filters,
    searchFilters,
    updatePagination,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useUserFilters();
  const {
    users,
    roles,
    loading,
    pagination,
    statistics,
    selectedUsers,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    batchOperateUsers,
    resetUserPassword,
    terminateUserSessions,
    toggleUserSelection,
    selectAllUsers,
    clearUserSelection
  } = useUserManagement();

  // 视图模式管理
  const {
    viewMode,
    setViewMode,
    isInitialized: viewModeInitialized
  } = useViewMode();

  // 对话框状态
  const [dialogState, setDialogState] = useState<UserDialogState>({
    type: null,
    user: null,
    open: false
  });

  // 监听 filters 变化，获取用户数据
  useEffect(() => {
    fetchUsers(filters);
  }, [filters, fetchUsers]);

  /**
   * 打开创建用户对话框
   */
  const handleOpenCreateDialog = () => {
    setDialogState({
      type: DIALOG_TYPES.CREATE as any,
      user: null,
      open: true
    });
  };

  /**
   * 打开编辑用户对话框
   */
  const handleOpenEditDialog = (user: User) => {
    setDialogState({
      type: DIALOG_TYPES.EDIT as any,
      user,
      open: true
    });
  };

  /**
   * 关闭对话框
   */
  const handleCloseDialog = () => {
    setDialogState({
      type: null,
      user: null,
      open: false
    });
  };

  /**
   * 创建用户
   */
  const handleCreateUser = async (data: UserFormData) => {
    const success = await createUser(data);
    if (success) {
      handleCloseDialog();
      fetchUsers(filters);
    }
  };

  /**
   * 更新用户
   */
  const handleUpdateUser = async (data: UserFormData) => {
    if (!dialogState.user) return;

    const success = await updateUser(dialogState.user.id, data);
    if (success) {
      handleCloseDialog();
      fetchUsers(filters);
    }
  };

  /**
   * 删除用户
   */
  const handleDeleteUser = async (user: User) => {
    const success = await deleteUser(user.id);
    if (success) {
      fetchUsers(filters);
    }
  };

  /**
   * 启用用户
   */
  const handleEnableUser = async (user: User) => {
    const success = await updateUser(user.id, { status: 'active' });
    if (success) {
      fetchUsers(filters);
    }
  };

  /**
   * 禁用用户
   */
  const handleDisableUser = async (user: User) => {
    const success = await updateUser(user.id, { status: 'inactive' });
    if (success) {
      fetchUsers(filters);
    }
  };

  /**
   * 批量激活用户
   */
  const handleBatchActivate = async () => {
    if (selectedUsers.length === 0) return;
    const success = await batchOperateUsers('activate', selectedUsers);
    if (success) {
      clearUserSelection();
      fetchUsers(filters);
    }
  };

  /**
   * 批量禁用用户
   */
  const handleBatchDeactivate = async () => {
    if (selectedUsers.length === 0) return;
    const success = await batchOperateUsers('deactivate', selectedUsers);
    if (success) {
      clearUserSelection();
      fetchUsers(filters);
    }
  };

  /**
   * 批量删除用户
   */
  const handleBatchDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (confirm('确定要删除选中的用户吗？此操作不可撤销。')) {
      const success = await batchOperateUsers('delete', selectedUsers);
      if (success) {
        clearUserSelection();
        fetchUsers(filters);
      }
    }
  };

  /**
   * 导出用户
   */
  const handleExportUsers = async () => {
    try {
      // TODO: 实现导出功能
      console.log('导出用户');
    } catch (error) {
      console.error('导出用户失败:', error);
    }
  };

  /**
   * 导入用户
   */
  const handleImportUsers = async () => {
    try {
      // TODO: 实现导入功能
      console.log('导入用户');
    } catch (error) {
      console.error('导入用户失败:', error);
    }
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    fetchUsers(filters);
  };

  /**
   * 重置密码
   */
  const handleResetPassword = async (user: User) => {
    if (!confirm(`确定要重置用户 "${user.username}" 的密码吗？`)) return;
    const newPassword = prompt('请输入新密码:');
    if (!newPassword) return;

    const success = await resetUserPassword(user.id, newPassword, true);
    if (success) {
      fetchUsers(filters);
    }
  };

  /**
   * 终止用户会话
   */
  const handleTerminateSessions = async (user: User) => {
    if (!confirm(`确定要终止用户 "${user.username}" 的所有会话吗？`)) return;
    const success = await terminateUserSessions(user.id, false);
    if (success) {
      fetchUsers(filters);
    }
  };

  /**
   * 处理排序
   * 字段映射: userInfo -> username, status -> status, activity -> createdAt
   */
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    // 映射列 key 到 API 字段名
    const fieldMap: Record<string, string> = {
      userInfo: 'username',
      status: 'status',
      activity: 'createdAt'
    };

    const apiField = fieldMap[sortBy] || sortBy;
    updateFilters({ sortBy: apiField, sortOrder });
  };

  return (
    // 临时移除权限检查以测试API
    <PageContainer scrollable={true} bentoMode={true}>
      <div className='flex min-h-[calc(100vh-8rem)] w-full flex-col space-y-4 p-4'>
        {/* 页面头部 */}
        <div className='flex-shrink-0'>
          <UserPageHeader
            onCreateUser={handleOpenCreateDialog}
            onExportUsers={handleExportUsers}
            onImportUsers={handleImportUsers}
            onRefresh={handleRefresh}
            totalUsers={statistics?.overview?.total}
            activeUsers={statistics?.overview?.active}
            loading={loading}
          />
        </div>

        {/* 用户统计信息 */}
        <div className='flex-shrink-0'>
          <UserStatistics statistics={statistics} loading={loading} />
        </div>

        {/* 搜索和筛选 */}
        <div className='flex-shrink-0'>
          <UserFilters
            filters={filters}
            roles={roles}
            tenants={[]} // TODO: 从hook获取租户数据
            organizations={[]} // TODO: 从hook获取组织数据
            onSearch={searchFilters}
            onReset={clearFilters}
            loading={loading}
          />
        </div>

        {/* 数据表格和分页 */}
        <div className='flex min-h-0 flex-1 flex-col'>
          {/* 视图切换 */}
          <div className='mb-4 flex-shrink-0'>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>

          {/* 数据展示 */}
          <div className='min-h-[400px] flex-1'>
            {viewMode === 'table' ? (
              <div className='bg-background overflow-hidden rounded-md border'>
                <UserTable
                  users={users}
                  loading={loading}
                  pagination={pagination}
                  selectedUsers={selectedUsers}
                  onSelectUser={toggleUserSelection}
                  onSelectAll={selectAllUsers}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleDeleteUser}
                  onEnable={handleEnableUser}
                  onDisable={handleDisableUser}
                  onResetPassword={handleResetPassword}
                  onTerminateSessions={handleTerminateSessions}
                  sortConfig={
                    filters.sortBy
                      ? {
                          sortBy:
                            {
                              username: 'userInfo',
                              status: 'status',
                              createdAt: 'activity',
                              lastLoginAt: 'activity'
                            }[filters.sortBy] || filters.sortBy,
                          sortOrder: filters.sortOrder || 'desc'
                        }
                      : null
                  }
                  onSort={handleSort}
                  emptyState={{
                    icon: <Users className='text-muted-foreground h-8 w-8' />,
                    title: hasActiveFilters ? '未找到匹配的用户' : '还没有用户',
                    description: hasActiveFilters
                      ? '请尝试调整筛选条件以查看更多结果'
                      : '开始添加用户来管理您的系统',
                    action: !hasActiveFilters ? (
                      <PermissionGuard permissions={PERMISSIONS.USER.CREATE}>
                        <Button
                          onClick={handleOpenCreateDialog}
                          size='sm'
                          className='mt-2'
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          添加用户
                        </Button>
                      </PermissionGuard>
                    ) : undefined
                  }}
                />
              </div>
            ) : (
              <UserCardGrid
                users={users}
                loading={loading}
                selectedUsers={selectedUsers}
                onSelectUser={toggleUserSelection}
                onEdit={handleOpenEditDialog}
                onDelete={handleDeleteUser}
                onEnable={handleEnableUser}
                onDisable={handleDisableUser}
                onResetPassword={handleResetPassword}
                onTerminateSessions={handleTerminateSessions}
                emptyState={{
                  icon: <Users className='text-muted-foreground h-8 w-8' />,
                  title: hasActiveFilters ? '未找到匹配的用户' : '还没有用户',
                  description: hasActiveFilters
                    ? '请尝试调整筛选条件以查看更多结果'
                    : '开始添加用户来管理您的系统',
                  action: !hasActiveFilters ? (
                    <PermissionGuard permissions={PERMISSIONS.USER.CREATE}>
                      <Button
                        onClick={handleOpenCreateDialog}
                        size='sm'
                        className='mt-2'
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        添加用户
                      </Button>
                    </PermissionGuard>
                  ) : undefined
                }}
              />
            )}
          </div>

          {/* 分页控件 */}
          <div className='bg-background flex-shrink-0 pt-4'>
            <Pagination
              pagination={pagination}
              onPageChange={(page) => updatePagination({ page })}
              onPageSizeChange={(limit) => updatePagination({ limit, page: 1 })}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        </div>

        {/* 用户对话框 */}
        <UserDialogs
          dialogState={dialogState}
          onClose={handleCloseDialog}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
        />

        {/* 浮动批量操作栏 */}
        <FloatingBatchActions
          selectedCount={selectedUsers.length}
          onBatchActivate={handleBatchActivate}
          onBatchDeactivate={handleBatchDeactivate}
          onBatchDelete={handleBatchDelete}
          onClearSelection={clearUserSelection}
          visible={selectedUsers.length > 0}
        />
      </div>
    </PageContainer>
    // </PermissionGuard>
  );
}
