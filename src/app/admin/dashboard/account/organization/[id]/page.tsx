/**
 * 组织详情页面
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  ChevronRight,
  Edit,
  Trash2,
  ArrowLeft,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import { toast } from 'sonner';
import { OrganizationAPI } from '@/service/api/organization';
import { OrganizationDialogs } from '../components/OrganizationDialogs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  Organization,
  UserOrganization,
  OrganizationDialogState,
  AddUserToOrganizationData,
  User
} from '../types';
import { STATUS_MAP } from '../constants';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<UserOrganization[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  // 编辑/删除对话框状态
  const [dialogState, setDialogState] = useState<OrganizationDialogState>({
    type: null,
    organization: null,
    open: false
  });

  // 添加用户对话框状态
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState<AddUserToOrganizationData>({
    userId: 0,
    position: '',
    isMain: false
  });

  const fetchOrganizationDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await OrganizationAPI.getOrganization(id);
      if (res.code === 0 && res.data) {
        setOrganization(res.data);
      } else {
        toast.error(res.message || '获取组织详情失败');
        router.push('/admin/dashboard/account/organization');
      }
    } catch (error) {
      console.error('获取组织详情失败:', error);
      toast.error('获取组织详情失败');
      router.push('/admin/dashboard/account/organization');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchOrganizationUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await OrganizationAPI.getOrganizationUsers(id, {
        page: 1,
        limit: 100
      });
      if (res.code === 0 && res.data) {
        setUsers(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('获取组织用户失败:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [id]);

  // 获取所有用户列表（用于添加用户）
  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users?limit=1000');
      const res = await response.json();
      if (res.code === 0 && res.data) {
        setAllUsers(res.data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchOrganizationDetail();
      fetchOrganizationUsers();
      fetchAllUsers();
    }
  }, [id, fetchOrganizationDetail, fetchOrganizationUsers, fetchAllUsers]);

  // 打开编辑对话框
  const handleEdit = () => {
    setDialogState({
      type: 'edit',
      organization,
      open: true
    });
  };

  // 打开删除确认
  const handleDelete = () => {
    setDialogState({
      type: 'delete',
      organization,
      open: true
    });
  };

  // 打开添加用户对话框
  const handleAddUser = () => {
    setAddUserForm({
      userId: 0,
      position: '',
      isMain: false
    });
    setAddUserDialogOpen(true);
  };

  // 处理组织更新成功
  const handleUpdateSuccess = () => {
    fetchOrganizationDetail();
  };

  // 处理组织删除成功
  const handleDeleteSuccess = () => {
    toast.success('组织删除成功');
    router.push('/admin/dashboard/account/organization');
  };

  // 创建组织（在详情页不需要）
  const handleCreateOrganization = async () => {
    return false;
  };

  // 更新组织
  const handleUpdateOrganization = async (data: any) => {
    if (!organization) return false;

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const res = await response.json();

      if (res.code === 0) {
        toast.success('组织更新成功');
        handleUpdateSuccess();
        return true;
      } else {
        toast.error(res.message || '组织更新失败');
        return false;
      }
    } catch (error) {
      console.error('更新组织失败:', error);
      toast.error('更新组织失败');
      return false;
    }
  };

  // 删除组织
  const handleDeleteOrganization = async (org: Organization) => {
    try {
      const response = await fetch(`/api/organizations/${org.id}`, {
        method: 'DELETE'
      });
      const res = await response.json();

      if (res.code === 0) {
        return true;
      } else {
        toast.error(res.message || '组织删除失败');
        return false;
      }
    } catch (error) {
      console.error('删除组织失败:', error);
      toast.error('删除组织失败');
      return false;
    }
  };

  // 添加用户到组织
  const handleAddUserSubmit = async () => {
    if (!addUserForm.userId) {
      toast.error('请选择用户');
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm)
      });
      const res = await response.json();

      if (res.code === 0) {
        toast.success('用户添加成功');
        setAddUserDialogOpen(false);
        fetchOrganizationUsers();
        fetchOrganizationDetail(); // 更新用户数量
      } else {
        toast.error(res.message || '添加用户失败');
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      toast.error('添加用户失败');
    }
  };

  // 从组织移除用户
  const handleRemoveUser = async (userId: number) => {
    try {
      const response = await fetch(
        `/api/organizations/${id}/users?userId=${userId}`,
        {
          method: 'DELETE'
        }
      );
      const res = await response.json();

      if (res.code === 0) {
        toast.success('用户移除成功');
        fetchOrganizationUsers();
        fetchOrganizationDetail(); // 更新用户数量
      } else {
        toast.error(res.message || '移除用户失败');
      }
    } catch (error) {
      console.error('移除用户失败:', error);
      toast.error('移除用户失败');
    }
  };

  // 获取未添加到组织的用户
  const availableUsers = allUsers.filter(
    (u) => !users.some((orgUser) => orgUser.id === u.id)
  );

  if (loading) {
    return (
      <PageContainer scrollable={true}>
        <div className='flex h-[400px] items-center justify-center'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!organization) {
    return (
      <PageContainer scrollable={true}>
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-muted-foreground'>组织不存在</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='flex w-full flex-col space-y-4 p-4'>
        {/* 面包屑导航 */}
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 px-0'
            onClick={() => router.push('/admin/dashboard/account/organization')}
          >
            组织架构
          </Button>
          <ChevronRight className='h-4 w-4' />
          <span className='text-foreground font-medium'>
            {organization.name}
          </span>
        </div>

        {/* 页面头部 */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Building2 className='text-muted-foreground h-8 w-8' />
            <div>
              <h1 className='text-2xl font-bold'>{organization.name}</h1>
              {organization.code && (
                <p className='text-muted-foreground text-sm'>
                  编码: {organization.code}
                </p>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                router.push('/admin/dashboard/account/organization')
              }
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              返回
            </Button>
            <Button variant='outline' size='sm' onClick={handleEdit}>
              <Edit className='mr-2 h-4 w-4' />
              编辑
            </Button>
            <Button variant='outline' size='sm' onClick={handleAddUser}>
              <UserPlus className='mr-2 h-4 w-4' />
              添加成员
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDelete}>
              <Trash2 className='mr-2 h-4 w-4' />
              删除
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                成员数量
              </CardTitle>
              <Users className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{organization.userCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                子组织数
              </CardTitle>
              <Building2 className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {organization.childCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={STATUS_MAP[organization.status].color}>
                {STATUS_MAP[organization.status].label}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                排序值
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{organization.sortOrder}</div>
            </CardContent>
          </Card>
        </div>

        {/* 详情选项卡 */}
        <Tabs defaultValue='members' className='flex-1'>
          <TabsList>
            <TabsTrigger value='members'>成员列表</TabsTrigger>
            <TabsTrigger value='details'>详细信息</TabsTrigger>
          </TabsList>

          <TabsContent value='members' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>组织成员</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className='text-muted-foreground flex items-center justify-center py-8'>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    加载中...
                  </div>
                ) : users.length === 0 ? (
                  <div className='text-muted-foreground py-8 text-center'>
                    暂无成员，点击"添加成员"按钮添加
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className='flex items-center justify-between rounded-md border p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className='font-medium'>
                              {user.realName || user.username}
                            </div>
                            <div className='text-muted-foreground text-sm'>
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {user.position && (
                            <Badge variant='outline'>{user.position}</Badge>
                          )}
                          {user.isMain && (
                            <Badge className='bg-primary/10 text-primary'>
                              主组织
                            </Badge>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive'
                            onClick={() => handleRemoveUser(user.id)}
                          >
                            移除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='details' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>组织信息</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      组织名称
                    </div>
                    <div className='font-medium'>{organization.name}</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      组织编码
                    </div>
                    <div className='font-medium'>
                      {organization.code || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>组织 ID</div>
                    <div className='font-medium'>{organization.id}</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      父组织 ID
                    </div>
                    <div className='font-medium'>
                      {organization.parentId || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      负责人 ID
                    </div>
                    <div className='font-medium'>
                      {organization.leaderId || '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>排序值</div>
                    <div className='font-medium'>{organization.sortOrder}</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      创建时间
                    </div>
                    <div className='font-medium'>
                      {new Date(organization.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      更新时间
                    </div>
                    <div className='font-medium'>
                      {new Date(organization.updatedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 编辑/删除对话框 */}
      <OrganizationDialogs
        dialogState={dialogState}
        onClose={() =>
          setDialogState({ type: null, organization: null, open: false })
        }
        onCreateOrganization={handleCreateOrganization}
        onUpdateOrganization={handleUpdateOrganization}
        onDeleteOrganization={handleDeleteOrganization}
      />

      {/* 添加用户对话框 */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='user'>
                选择用户 <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={addUserForm.userId?.toString() || ''}
                onValueChange={(value) =>
                  setAddUserForm({ ...addUserForm, userId: parseInt(value) })
                }
              >
                <SelectTrigger id='user'>
                  <SelectValue placeholder='请选择用户' />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className='text-muted-foreground px-2 py-1 text-sm'>
                      没有可添加的用户
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.realName || user.username}
                        {user.email && ` <${user.email}>`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='position'>职位</Label>
              <input
                id='position'
                type='text'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                value={addUserForm.position}
                onChange={(e) =>
                  setAddUserForm({ ...addUserForm, position: e.target.value })
                }
                placeholder='请输入职位（可选）'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='isMain'>设为主组织</Label>
                <p className='text-muted-foreground text-sm'>
                  勾选后，该组织将成为用户的主组织
                </p>
              </div>
              <Checkbox
                id='isMain'
                checked={addUserForm.isMain}
                onCheckedChange={(checked) =>
                  setAddUserForm({ ...addUserForm, isMain: !!checked })
                }
              />
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setAddUserDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleAddUserSubmit}>添加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
