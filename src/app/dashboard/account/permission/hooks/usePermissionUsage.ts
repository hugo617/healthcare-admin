import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { PermissionUsage } from '../types';

export function usePermissionUsage() {
  const [usage, setUsage] = useState<PermissionUsage | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsage = useCallback(async (permissionId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/permissions/${permissionId}/usage`);
      const data = await res.json();

      if (data.code === 0) {
        setUsage(data.data);
      } else {
        toast.error(data.message || '获取使用情况失败');
      }
    } catch (error) {
      toast.error('获取使用情况失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    usage,
    loading,
    fetchUsage,
    clearUsage: () => setUsage(null)
  };
}
