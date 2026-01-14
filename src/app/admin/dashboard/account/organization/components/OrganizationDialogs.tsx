/**
 * 组织对话框组件
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { OrganizationForm } from './OrganizationForm';
import type {
  Organization,
  OrganizationFormData,
  OrganizationDialogState
} from '../types';
import { MESSAGES } from '../constants';

interface OrganizationDialogsProps {
  dialogState: OrganizationDialogState;
  onClose: () => void;
  onCreateOrganization: (data: OrganizationFormData) => Promise<boolean>;
  onUpdateOrganization: (data: OrganizationFormData) => Promise<boolean>;
  onDeleteOrganization: (organization: Organization) => Promise<boolean>;
}

export function OrganizationDialogs({
  dialogState,
  onClose,
  onCreateOrganization,
  onUpdateOrganization,
  onDeleteOrganization
}: OrganizationDialogsProps) {
  const { type, organization, open } = dialogState;

  /**
   * 处理表单提交
   */
  const handleSubmit = async (data: OrganizationFormData) => {
    let success = false;
    if (type === 'create') {
      success = await onCreateOrganization(data);
    } else if (type === 'edit' && organization) {
      success = await onUpdateOrganization(data);
    }

    if (success) {
      onClose();
    }
  };

  /**
   * 获取对话框标题
   */
  const getDialogTitle = () => {
    switch (type) {
      case 'create':
        return '新建组织';
      case 'edit':
        return '编辑组织';
      default:
        return '';
    }
  };

  /**
   * 处理删除确认
   */
  const handleDeleteConfirm = async () => {
    if (organization) {
      const success = await onDeleteOrganization(organization);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <>
      {/* 创建/编辑对话框 */}
      <Dialog open={open && type !== 'delete'} onOpenChange={onClose}>
        <DialogContent className='flex max-w-lg flex-col p-0'>
          <DialogHeader className='relative shrink-0 border-b px-6 py-4'>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogClose className='ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none'>
              <X className='h-4 w-4' />
              <span className='sr-only'>关闭</span>
            </DialogClose>
          </DialogHeader>

          <div className='px-6 py-4'>
            {open && (type === 'create' || type === 'edit') && (
              <OrganizationForm
                initialData={type === 'edit' ? organization : null}
                isEditing={type === 'edit'}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={open && type === 'delete'} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {organization &&
                MESSAGES.CONFIRM.DELETE(
                  organization.name,
                  Number(organization.userCount) || 0,
                  organization.childCount || 0
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
