'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { borderRadius, duration, easing } from './theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type?: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success',
    textColor: 'text-white'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-error',
    textColor: 'text-white'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warning',
    textColor: 'text-white'
  },
  info: {
    icon: Info,
    bgColor: 'bg-info',
    textColor: 'text-white'
  }
};

export function Toast({
  type = 'info',
  message,
  duration: autoCloseDuration = 3000,
  onClose,
  action
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoCloseDuration > 0) {
      const interval = 50;
      const step = 100 / (autoCloseDuration / interval);

      const timer = setInterval(() => {
        setProgress((prev) => {
          const next = prev - step;
          if (next <= 0) {
            handleClose();
            return 0;
          }
          return next;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoCloseDuration]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  const config = toastConfig[type];
  const Icon = config.icon;

  if (!visible) return null;

  return (
    <div
      className={`animate-slide-up fixed right-4 left-4 z-[1070] mx-auto max-w-md md:right-4 md:left-auto md:mx-0`}
      style={{ maxWidth: 'calc(100% - 2rem)' }}
    >
      <div
        className={`${config.bgColor} ${config.textColor} shadow-elevation-lg flex items-start gap-3 rounded-xl p-4`}
        role='alert'
        aria-live='polite'
      >
        {/* 图标 */}
        <Icon className='mt-0.5 h-5 w-5 flex-shrink-0' />

        {/* 消息内容 */}
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium break-words'>{message}</p>

          {/* 操作按钮 */}
          {action && (
            <button
              onClick={action.onClick}
              className='mt-2 text-sm font-semibold underline underline-offset-2 active:opacity-80'
            >
              {action.label}
            </button>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className='flex-shrink-0 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100 active:scale-95'
          aria-label='关闭'
        >
          <X className='h-4 w-4' />
        </button>
      </div>

      {/* 进度条 */}
      {autoCloseDuration > 0 && (
        <div className='mt-2 h-1 overflow-hidden rounded-full bg-white/30'>
          <div
            className='h-full bg-white/80 transition-all duration-75 ease-linear'
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Toast 容器和管理器
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

let toastItems: ToastItem[] = [];
let listeners: Set<(items: ToastItem[]) => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toastItems]));
}

export const toast = {
  show: (message: string, options?: Partial<ToastProps>) => {
    const id = Math.random().toString(36).substring(7);
    const item: ToastItem = {
      id,
      type: options?.type || 'info',
      message,
      duration: options?.duration,
      action: options?.action
    };

    toastItems.push(item);
    notifyListeners();

    if (item.duration !== 0) {
      setTimeout(() => {
        toast.remove(id);
      }, item.duration || 3000);
    }

    return id;
  },
  success: (message: string, duration?: number) => {
    return toast.show(message, { type: 'success', duration });
  },
  error: (message: string, duration?: number) => {
    return toast.show(message, { type: 'error', duration });
  },
  warning: (message: string, duration?: number) => {
    return toast.show(message, { type: 'warning', duration });
  },
  info: (message: string, duration?: number) => {
    return toast.show(message, { type: 'info', duration });
  },
  remove: (id: string) => {
    toastItems = toastItems.filter((item) => item.id !== id);
    notifyListeners();
  },
  clear: () => {
    toastItems = [];
    notifyListeners();
  },
  subscribe: (listener: (items: ToastItem[]) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

// Toast 容器组件
export function ToastContainer() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    return toast.subscribe(setItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className='pointer-events-none fixed top-4 right-0 left-0 z-[1070] flex flex-col items-center gap-2'>
      {items.map((item, index) => (
        <div
          key={item.id}
          className='pointer-events-auto w-full'
          style={{ maxWidth: '400px' }}
        >
          <Toast
            type={item.type}
            message={item.message}
            duration={item.duration}
            onClose={() => toast.remove(item.id)}
            action={item.action}
          />
        </div>
      ))}
    </div>
  );
}
