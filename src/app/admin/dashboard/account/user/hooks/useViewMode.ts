'use client';

import { useState, useEffect } from 'react';

export type ViewMode = 'table' | 'card';

const STORAGE_KEY = 'user-management-view-mode';
const DEFAULT_VIEW_MODE: ViewMode = 'table';

/**
 * 视图模式管理 Hook
 * 管理用户管理界面的视图模式（表格/卡片），持久化到 localStorage
 */
export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化：从 localStorage 读取用户偏好
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'table' || stored === 'card')) {
      setViewModeState(stored as ViewMode);
    }
    setIsInitialized(true);
  }, []);

  // 切换视图模式
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  // 切换到表格视图
  const setTableView = () => {
    setViewMode('table');
  };

  // 切换到卡片视图
  const setCardView = () => {
    setViewMode('card');
  };

  // 切换视图
  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'card' : 'table');
  };

  return {
    viewMode,
    setViewMode,
    setTableView,
    setCardView,
    toggleViewMode,
    isInitialized
  };
}
