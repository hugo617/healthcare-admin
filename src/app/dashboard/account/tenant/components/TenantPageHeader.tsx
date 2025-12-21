import React from 'react';
import { Building2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/table/page-header';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';

interface TenantPageHeaderProps {
  /** 创建租户回调 */
  onCreateTenant: () => void;
}

/**
 * 租户页面头部组件
 * 负责页面标题和创建租户按钮
 */
export function TenantPageHeader({ onCreateTenant }: TenantPageHeaderProps) {
  return (
    <PermissionGuard permissions={[PERMISSIONS.TENANT.CREATE]}>
      <PageHeader
        title='租户管理'
        description='管理多租户系统的租户账户和配置'
        action={{
          label: '创建租户',
          onClick: onCreateTenant,
          icon: <Building2 className='mr-2 h-4 w-4' />
        }}
      />
    </PermissionGuard>
  );
}