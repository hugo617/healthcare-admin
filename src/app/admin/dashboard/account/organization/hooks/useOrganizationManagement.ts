/**
 * 组织管理业务逻辑 Hook
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { OrganizationAPI } from '@/service/api/organization';
import type {
  Organization,
  OrganizationTreeNode,
  OrganizationFormData,
  UserOrganization,
  AddUserToOrganizationData,
  OrganizationFilters,
  PaginationInfo,
  User
} from '../types';
import { DEFAULT_PAGINATION, MESSAGES } from '../constants';

export function useOrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tree, setTree] = useState<OrganizationTreeNode[]>([]);
  const [organizationUsers, setOrganizationUsers] = useState<
    UserOrganization[]
  >([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] =
    useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [userPagination, setUserPagination] =
    useState<PaginationInfo>(DEFAULT_PAGINATION);

  /**
   * 获取组织列表
   */
  const fetchOrganizations = useCallback(
    async (filters: OrganizationFilters) => {
      try {
        setLoading(true);

        const params: Record<string, any> = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            value !== 'all'
          ) {
            params[key] = value;
          }
        });

        const res = await OrganizationAPI.getOrganizations(params);

        if (res.code === 0 && res.data) {
          const orgData = Array.isArray(res.data) ? res.data : [];
          setOrganizations(orgData);

          const pager = res.pager;
          setPagination({
            page: pager?.page || filters.page || 1,
            limit: pager?.limit || filters.limit || 10,
            total: pager?.total || orgData.length,
            totalPages:
              pager?.totalPages ||
              Math.ceil(
                (pager?.total || orgData.length) / (filters.limit || 10)
              )
          });
        } else {
          toast.error(res.message || MESSAGES.ERROR.FETCH);
          setOrganizations([]);
        }
      } catch (error) {
        console.error('获取组织列表失败:', error);
        toast.error(MESSAGES.ERROR.FETCH);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 获取组织树
   */
  const fetchOrganizationTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await OrganizationAPI.getOrganizationTree();

      if (res.code === 0 && res.data) {
        setTree(Array.isArray(res.data) ? res.data : []);
      } else {
        toast.error(res.message || MESSAGES.ERROR.FETCH_TREE);
        setTree([]);
      }
    } catch (error) {
      console.error('获取组织树失败:', error);
      toast.error(MESSAGES.ERROR.FETCH_TREE);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取组织用户列表
   */
  const fetchOrganizationUsers = useCallback(
    async (organizationId: string, page = 1, limit = 10) => {
      try {
        setLoading(true);
        const res = await OrganizationAPI.getOrganizationUsers(organizationId, {
          page,
          limit
        });

        if (res.code === 0 && res.data) {
          const userData = Array.isArray(res.data) ? res.data : [];
          setOrganizationUsers(userData);

          const pager = res.pager;
          setUserPagination({
            page: pager?.page || page,
            limit: pager?.limit || limit,
            total: pager?.total || userData.length,
            totalPages:
              pager?.totalPages ||
              Math.ceil((pager?.total || userData.length) / limit)
          });
        } else {
          toast.error(res.message || MESSAGES.ERROR.FETCH_USERS);
          setOrganizationUsers([]);
        }
      } catch (error) {
        console.error('获取组织用户失败:', error);
        toast.error(MESSAGES.ERROR.FETCH_USERS);
        setOrganizationUsers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 创建组织
   */
  const createOrganization = useCallback(
    async (data: OrganizationFormData): Promise<boolean> => {
      try {
        const res = await OrganizationAPI.createOrganization(data);
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.CREATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.CREATE);
          return false;
        }
      } catch (error) {
        console.error('创建组织失败:', error);
        toast.error(MESSAGES.ERROR.CREATE);
        return false;
      }
    },
    []
  );

  /**
   * 更新组织
   */
  const updateOrganization = useCallback(
    async (
      id: string,
      data: Partial<OrganizationFormData>
    ): Promise<boolean> => {
      try {
        const res = await OrganizationAPI.updateOrganization(id, data);
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.UPDATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.UPDATE);
          return false;
        }
      } catch (error) {
        console.error('更新组织失败:', error);
        toast.error(MESSAGES.ERROR.UPDATE);
        return false;
      }
    },
    []
  );

  /**
   * 删除组织
   */
  const deleteOrganization = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await OrganizationAPI.deleteOrganization(id);
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.DELETE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.DELETE);
          return false;
        }
      } catch (error) {
        console.error('删除组织失败:', error);
        toast.error(MESSAGES.ERROR.DELETE);
        return false;
      }
    },
    []
  );

  /**
   * 添加用户到组织
   */
  const addUserToOrganization = useCallback(
    async (
      organizationId: string,
      data: AddUserToOrganizationData
    ): Promise<boolean> => {
      try {
        const res = await OrganizationAPI.addUserToOrganization(
          organizationId,
          data
        );
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.ADD_USER);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.ADD_USER);
          return false;
        }
      } catch (error) {
        console.error('添加用户到组织失败:', error);
        toast.error(MESSAGES.ERROR.ADD_USER);
        return false;
      }
    },
    []
  );

  /**
   * 从组织移除用户
   */
  const removeUserFromOrganization = useCallback(
    async (organizationId: string, userId: number): Promise<boolean> => {
      try {
        const res = await OrganizationAPI.removeUserFromOrganization(
          organizationId,
          userId
        );
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.REMOVE_USER);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.REMOVE_USER);
          return false;
        }
      } catch (error) {
        console.error('从组织移除用户失败:', error);
        toast.error(MESSAGES.ERROR.REMOVE_USER);
        return false;
      }
    },
    []
  );

  return {
    // 状态
    organizations,
    tree,
    organizationUsers,
    availableUsers,
    loading,
    pagination,
    userPagination,

    // 方法
    fetchOrganizations,
    fetchOrganizationTree,
    fetchOrganizationUsers,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addUserToOrganization,
    removeUserFromOrganization
  };
}
