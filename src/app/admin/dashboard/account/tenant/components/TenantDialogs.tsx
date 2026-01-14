import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  AlertTriangle,
  Trash2,
  Power,
  PowerOff,
  Ban
} from 'lucide-react';
import { TenantForm } from './TenantForm';
import type { TenantDialogState, TenantFormData, Tenant } from '../types';
import { DIALOG_TYPES, STATUS_ACTIONS } from '../constants';

interface TenantDialogsProps {
  /** 对话框状态 */
  dialogState: TenantDialogState;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 创建租户回调 */
  onCreateTenant: (data: TenantFormData) => Promise<boolean>;
  /** 更新租户回调 */
  onUpdateTenant: (data: TenantFormData) => Promise<boolean>;
  /** 删除租户回调 */
  onDeleteTenant: (tenant: Tenant) => Promise<boolean>;
  /** 切换状态回调 */
  onToggleStatus: (
    tenant: Tenant,
    action: 'activate' | 'deactivate' | 'suspend'
  ) => Promise<boolean>;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 租户对话框组件
 * 包含创建、编辑、删除、状态切换等对话框
 */
export function TenantDialogs({
  dialogState,
  onClose,
  onCreateTenant,
  onUpdateTenant,
  onDeleteTenant,
  onToggleStatus,
  loading
}: TenantDialogsProps) {
  const { type, tenant, open, action } = dialogState;

  /**
   * 处理表单提交
   */
  const handleFormSubmit = async (data: TenantFormData) => {
    if (type === DIALOG_TYPES.CREATE) {
      return await onCreateTenant(data);
    } else if (type === DIALOG_TYPES.EDIT && tenant) {
      return await onUpdateTenant(data);
    }
    return false;
  };

  /**
   * 处理状态切换确认
   */
  const handleStatusConfirm = async () => {
    if (!tenant || !action) return;
    await onToggleStatus(tenant, action);
  };

  /**
   * 处理删除确认
   */
  const handleDeleteConfirm = async () => {
    if (!tenant) return;
    await onDeleteTenant(tenant);
  };

  /**
   * 获取状态操作信息
   */
  const getStatusActionInfo = () => {
    if (!action) return null;
    return STATUS_ACTIONS[action];
  };

  return (
    <>
      {/* 创建/编辑租户对话框 */}
      {(type === DIALOG_TYPES.CREATE || type === DIALOG_TYPES.EDIT) && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>
                {type === DIALOG_TYPES.CREATE ? '创建租户' : '编辑租户'}
              </DialogTitle>
              <DialogDescription>
                {type === DIALOG_TYPES.CREATE
                  ? '填写租户基本信息和配置选项来创建新的租户账户'
                  : '修改租户的基本信息和配置设置'}
              </DialogDescription>
            </DialogHeader>

            <TenantForm
              tenant={tenant}
              onSubmit={handleFormSubmit}
              onCancel={onClose}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* 状态切换对话框 */}
      {type === DIALOG_TYPES.STATUS && tenant && action && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center space-x-2'>
                {action === 'activate' && (
                  <Power className='h-5 w-5 text-green-600' />
                )}
                {action === 'deactivate' && (
                  <PowerOff className='h-5 w-5 text-yellow-600' />
                )}
                {action === 'suspend' && (
                  <Ban className='h-5 w-5 text-red-600' />
                )}
                <span>{getStatusActionInfo()?.label}租户</span>
              </DialogTitle>
              <DialogDescription>
                确定要{getStatusActionInfo()?.label}租户 "{tenant.name}" 吗？
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* 租户信息 */}
              <div className='rounded-lg border bg-gray-50 p-4'>
                <h4 className='font-medium text-gray-900'>租户信息</h4>
                <div className='mt-2 space-y-1 text-sm text-gray-600'>
                  <div>名称: {tenant.name}</div>
                  <div>代码: {tenant.code}</div>
                  <div>当前状态: {tenant.status}</div>
                </div>
              </div>

              {/* 操作说明 */}
              <div className='flex items-start space-x-2 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4'>
                <AlertTriangle className='mt-0.5 h-5 w-5 text-blue-600' />
                <div className='text-sm text-blue-800'>
                  {getStatusActionInfo()?.description}
                  {getStatusActionInfo()?.confirmationMessage && (
                    <p className='mt-1 font-medium'>
                      {getStatusActionInfo()?.confirmationMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button
                onClick={handleStatusConfirm}
                disabled={loading}
                variant={action === 'suspend' ? 'destructive' : 'default'}
              >
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {getStatusActionInfo()?.label}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 删除租户对话框 */}
      {type === DIALOG_TYPES.DELETE && tenant && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center space-x-2 text-red-600'>
                <Trash2 className='h-5 w-5' />
                <span>删除租户</span>
              </DialogTitle>
              <DialogDescription>
                此操作不可撤销，请谨慎操作。
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* 租户信息 */}
              <div className='rounded-lg border bg-gray-50 p-4'>
                <h4 className='font-medium text-gray-900'>租户信息</h4>
                <div className='mt-2 space-y-1 text-sm text-gray-600'>
                  <div>名称: {tenant.name}</div>
                  <div>代码: {tenant.code}</div>
                  <div>
                    创建时间: {new Date(tenant.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 删除警告 */}
              <div className='flex items-start space-x-2 rounded-lg border-l-4 border-red-400 bg-red-50 p-4'>
                <AlertTriangle className='mt-0.5 h-5 w-5 text-red-600' />
                <div className='text-sm text-red-800'>
                  <p className='font-medium'>删除操作将产生以下影响：</p>
                  <ul className='mt-2 list-disc space-y-1 pl-5'>
                    <li>租户下的所有用户将无法登录</li>
                    <li>租户的所有数据将被标记为删除</li>
                    <li>此操作不可恢复</li>
                  </ul>
                  <p className='mt-2 font-medium'>
                    请输入租户代码 "
                    <span className='rounded bg-red-100 px-1 font-mono'>
                      {tenant.code}
                    </span>
                    " 确认删除操作。
                  </p>
                </div>
              </div>

              {/* 确认输入框 */}
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  确认租户代码
                </label>
                <input
                  type='text'
                  placeholder={`请输入 ${tenant.code}`}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  id='delete-confirm-input'
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button
                variant='destructive'
                onClick={handleDeleteConfirm}
                disabled={loading}
                id='delete-confirm-button'
              >
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
