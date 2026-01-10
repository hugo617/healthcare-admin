import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  User,
  Role,
  Tenant,
  Organization,
  UserFilters,
  PaginationInfo,
  UserFormData,
  UserStatistics,
  UserSession
} from '../types';
import { DEFAULT_PAGINATION, MESSAGES } from '../constants';
import { UserAPI } from '@/service/api/user';

/**
 * 用户管理业务逻辑 Hook
 * 负责用户数据的增删改查和相关管理功能
 */
export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | undefined>();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] =
    useState<PaginationInfo>(DEFAULT_PAGINATION);

  /**
   * 获取角色列表
   */
  const fetchRoles = useCallback(async () => {
    try {
      // TODO: 实现角色API调用，暂时返回空数组
      // const res = await UserAPI.getRoles();
      // if (res.success && res.data) {
      //   setRoles(res.data);
      // }
      setRoles([]);
    } catch (error) {
      console.error('获取角色列表失败:', error);
      toast.error('获取角色列表失败');
    }
  }, []);

  /**
   * 获取租户列表（超级管理员专用）
   */
  const fetchTenants = useCallback(async () => {
    try {
      // TODO: 实现租户API调用
      setTenants([]);
    } catch (error) {
      console.error('获取租户列表失败:', error);
    }
  }, []);

  /**
   * 获取组织列表
   */
  const fetchOrganizations = useCallback(async () => {
    try {
      // TODO: 实现组织API调用
      setOrganizations([]);
    } catch (error) {
      console.error('获取组织列表失败:', error);
    }
  }, []);

  /**
   * 获取用户统计信息
   */
  const fetchStatistics = useCallback(async (tenantId?: number) => {
    try {
      const res = await UserAPI.getUserStatistics(tenantId);
      if (res && res.success && res.data) {
        setStatistics(res.data);
      } else {
        // 如果API调用失败，设置默认值
        setStatistics({
          overview: {
            total: 0,
            active: 0,
            inactive: 0,
            locked: 0,
            activeRate: 0
          },
          engagement: {
            recentLogins: 0,
            recentLoginRate: 0
          },
          growth: {
            thisMonth: 0,
            lastMonth: 0,
            growthRate: 0,
            today: 0,
            week: 0
          },
          distribution: {
            active: 0,
            inactive: 0,
            locked: 0
          }
        });
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
      // 设置默认统计信息
      setStatistics({
        overview: {
          total: 0,
          active: 0,
          inactive: 0,
          locked: 0,
          activeRate: 0
        },
        engagement: {
          recentLogins: 0,
          recentLoginRate: 0
        },
        growth: {
          thisMonth: 0,
          lastMonth: 0,
          growthRate: 0,
          today: 0,
          week: 0
        },
        distribution: {
          active: 0,
          inactive: 0,
          locked: 0
        }
      });
    }
  }, []);

  /**
   * 获取用户列表
   */
  const fetchUsers = useCallback(
    async (filters: UserFilters) => {
      try {
        setLoading(true);

        console.log('开始获取用户列表，筛选条件:', filters);

        // 构建查询参数
        const params: Record<string, any> = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (key === 'dateRange' && value) {
            // 处理日期范围
            const dateRange = value as { from: Date; to: Date };
            if (dateRange.from && dateRange.to) {
              const startDateStr = dateRange.from.toISOString().split('T')[0];
              const endDateStr = dateRange.to.toISOString().split('T')[0];
              params.startDate = startDateStr;
              params.endDate = endDateStr;
            }
          } else if (key === 'username' && value) {
            // 将username作为通用搜索参数传递
            params.search = value;
          } else if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            value !== 'all'
          ) {
            params[key] = value;
          }
        });

        console.log('API请求参数:', params);

        // 使用UserAPI调用
        const res = await UserAPI.getUsers(params);
        console.log('API响应数据:', res);

        // 检查响应格式，适配后端返回的数据结构
        console.log('检查API响应结构:', {
          hasData: !!res.data,
          code: res.code,
          success: res.success,
          dataType: typeof res.data
        });

        if ((res.code === 0 && res.data) || res.success) {
          // 处理API响应格式
          const userData = Array.isArray(res.data) ? res.data : [];
          console.log('处理后的用户数据:', userData);
          console.log('用户数量:', userData.length);

          setUsers(userData);

          // 获取分页信息，支持多种格式
          const pager = res.pager || res.pagination;
          setPagination({
            page: pager?.page || filters.page || 1,
            limit: pager?.limit || filters.limit || 10,
            total: pager?.total || userData.length,
            totalPages:
              pager?.totalPages ||
              Math.ceil(
                (pager?.total || userData.length) / (filters.limit || 10)
              )
          });

          console.log('分页信息:', {
            page: pager?.page || filters.page || 1,
            limit: pager?.limit || filters.limit || 10,
            total: pager?.total || userData.length,
            totalPages:
              pager?.totalPages ||
              Math.ceil(
                (pager?.total || userData.length) / (filters.limit || 10)
              )
          });

          // 如果统计数据还没有设置，使用当前页数据作为默认值
          if (!statistics) {
            const activeCount = userData.filter(
              (u) => u.status === 'active'
            ).length;
            setStatistics({
              overview: {
                total: pager?.total || userData.length,
                active: activeCount,
                inactive: userData.filter((u) => u.status === 'inactive')
                  .length,
                locked: userData.filter((u) => u.status === 'locked').length,
                activeRate:
                  userData.length > 0
                    ? Math.round((activeCount / userData.length) * 100 * 100) /
                      100
                    : 0
              },
              engagement: {
                recentLogins: userData.filter((u) => u.lastLoginAt).length,
                recentLoginRate:
                  userData.length > 0
                    ? Math.round(
                        (userData.filter((u) => u.lastLoginAt).length /
                          userData.length) *
                          100 *
                          100
                      ) / 100
                    : 0
              },
              growth: {
                thisMonth: userData.filter((u) => {
                  const createdThisMonth = new Date(u.createdAt);
                  return (
                    createdThisMonth.getMonth() === new Date().getMonth() &&
                    createdThisMonth.getFullYear() === new Date().getFullYear()
                  );
                }).length,
                lastMonth: 0, // TODO: 计算上月新增
                growthRate: 0, // TODO: 计算增长率
                today: 0,
                week: 0
              },
              distribution: {
                active: activeCount,
                inactive: userData.filter((u) => u.status === 'inactive')
                  .length,
                locked: userData.filter((u) => u.status === 'locked').length
              }
            });
          }
        } else {
          console.error('API调用失败:', res);
          toast.error(res.message || '获取用户列表失败');
          setUsers([]);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        toast.error(
          '获取用户列表失败: ' +
            (error instanceof Error ? error.message : '未知错误')
        );
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [statistics]
  );

  /**
   * 创建用户
   */
  const createUser = useCallback(
    async (data: UserFormData): Promise<boolean> => {
      try {
        const res = await UserAPI.createUser(data);
        // API 返回格式: { code: 0, data: {...} }
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.CREATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.CREATE);
          return false;
        }
      } catch (error) {
        console.error('创建用户失败:', error);
        toast.error(MESSAGES.ERROR.CREATE);
        return false;
      }
    },
    []
  );

  /**
   * 更新用户
   */
  const updateUser = useCallback(
    async (id: number, data: Partial<UserFormData>): Promise<boolean> => {
      try {
        const res = await UserAPI.updateUser(id, data);
        // API 返回格式: { code: 0, data: {...} }
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.UPDATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.UPDATE);
          return false;
        }
      } catch (error) {
        console.error('更新用户失败:', error);
        toast.error(MESSAGES.ERROR.UPDATE);
        return false;
      }
    },
    []
  );

  /**
   * 删除用户
   */
  const deleteUser = useCallback(
    async (id: number, reason?: string): Promise<boolean> => {
      try {
        const res = await UserAPI.deleteUser(id, reason);
        // API 返回格式: { code: 0, data: {...} }
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.DELETE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.DELETE);
          return false;
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        toast.error(MESSAGES.ERROR.DELETE);
        return false;
      }
    },
    []
  );

  /**
   * 批量操作用户
   */
  const batchOperateUsers = useCallback(
    async (
      operation: string,
      userIds: number[],
      data?: any
    ): Promise<boolean> => {
      try {
        const res = await UserAPI.batchOperateUsers(
          operation as any,
          userIds,
          data
        );
        // API 返回格式: { code: 0, data: {...} }
        if (res.code === 0) {
          const operationMessages: Record<string, string> = {
            activate: '批量激活成功',
            deactivate: '批量禁用成功',
            delete: '批量删除成功',
            assignRole: '批量分配角色成功',
            removeRole: '批量移除角色成功'
          };
          toast.success(operationMessages[operation] || '批量操作成功');
          return true;
        } else {
          toast.error(res.message || '批量操作失败');
          return false;
        }
      } catch (error) {
        console.error('批量操作失败:', error);
        toast.error('批量操作失败');
        return false;
      }
    },
    []
  );

  /**
   * 修改用户状态
   */
  const changeUserStatus = useCallback(
    async (id: number, status: string, reason?: string): Promise<boolean> => {
      try {
        const res = await UserAPI.changeUserStatus(id, status as any, reason);
        // API 返回格式: { code: 0, data: {...} }
        if (res.code === 0) {
          const statusMessages: Record<string, string> = {
            active: '用户激活成功',
            inactive: '用户禁用成功',
            locked: '用户锁定成功'
          };
          toast.success(statusMessages[status] || '状态修改成功');
          return true;
        } else {
          toast.error(res.message || '状态修改失败');
          return false;
        }
      } catch (error) {
        console.error('修改用户状态失败:', error);
        toast.error('状态修改失败');
        return false;
      }
    },
    []
  );

  /**
   * 重置用户密码
   */
  const resetUserPassword = useCallback(
    async (
      id: number,
      newPassword: string,
      sendEmail?: boolean
    ): Promise<boolean> => {
      try {
        const res = await UserAPI.resetPassword(id, newPassword, sendEmail);
        // API 返回格式: { code: 0, data: {...} }
        if (res.code === 0) {
          toast.success('密码重置成功');
          return true;
        } else {
          toast.error(res.message || '密码重置失败');
          return false;
        }
      } catch (error) {
        console.error('重置密码失败:', error);
        toast.error('重置密码失败');
        return false;
      }
    },
    []
  );

  /**
   * 获取用户会话
   */
  const getUserSessions = useCallback(
    async (id: number): Promise<UserSession[]> => {
      try {
        const sessions = await UserAPI.getUserSessions(id);
        return sessions || [];
      } catch (error) {
        console.error('获取用户会话失败:', error);
        return [];
      }
    },
    []
  );

  /**
   * 终止用户会话
   */
  const terminateUserSessions = useCallback(
    async (id: number, excludeCurrent?: boolean): Promise<boolean> => {
      try {
        const res = await UserAPI.terminateAllUserSessions(id, excludeCurrent);
        // API 返回格式: { code: 0, data: {...} }
        if (res.code === 0) {
          toast.success('会话终止成功');
          return true;
        } else {
          toast.error(res.message || '会话终止失败');
          return false;
        }
      } catch (error) {
        console.error('终止用户会话失败:', error);
        toast.error('终止用户会话失败');
        return false;
      }
    },
    []
  );

  /**
   * 切换用户选择状态
   */
  const toggleUserSelection = useCallback((userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  /**
   * 切换选择所有用户（全选/取消全选）
   */
  const selectAllUsers = useCallback(() => {
    const allUserIds = users.map((user) => user.id);
    const allSelected =
      allUserIds.length > 0 && selectedUsers.length === allUserIds.length;

    setSelectedUsers(allSelected ? [] : allUserIds);
  }, [users, selectedUsers]);

  /**
   * 清空用户选择
   */
  const clearUserSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  // 初始化时获取数据
  useEffect(() => {
    fetchRoles();
    fetchStatistics();
  }, [fetchRoles, fetchStatistics]);

  return {
    // 状态
    users,
    roles,
    tenants,
    organizations,
    loading,
    pagination,
    statistics,
    selectedUsers,

    // 方法
    fetchUsers,
    fetchRoles,
    fetchTenants,
    fetchOrganizations,
    fetchStatistics,
    createUser,
    updateUser,
    deleteUser,
    batchOperateUsers,
    changeUserStatus,
    resetUserPassword,
    getUserSessions,
    terminateUserSessions,
    toggleUserSelection,
    selectAllUsers,
    clearUserSelection
  };
}
