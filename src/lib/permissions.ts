/**
 * 权限常量定义
 * 从 permission-constants.ts 重新导出，保持向后兼容
 */
export { PERMISSIONS, ROUTE_PERMISSIONS } from './permission-constants';

/**
 * Type alias for Session from auth module
 */
export type PermissionSession = {
  user: {
    id: number;
    isSuperAdmin: boolean;
  };
};
