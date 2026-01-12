import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { PermissionTreeNode } from '../types';

export function usePermissionTree() {
  const [tree, setTree] = useState<PermissionTreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermissionTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/permissions/tree');
      const data = await res.json();

      if (data.code === 0) {
        setTree(data.data || []);
      } else {
        toast.error(data.message || '获取权限树失败');
        setTree([]);
      }
    } catch (error) {
      toast.error('获取权限树失败');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tree,
    loading,
    fetchPermissionTree
  };
}
