'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { borderRadius, duration, easing, zIndex } from './theme';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-h-[60vh] max-w-sm',
  md: 'max-h-[75vh] max-w-md',
  lg: 'max-h-[85vh] max-w-lg',
  full: 'max-h-[95vh] max-w-xl'
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = ''
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // 处理 ESC 键关闭
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose]);

  // 处理焦点陷阱
  useEffect(() => {
    if (!open) return;

    // 保存当前焦点元素
    previousActiveElement.current = document.activeElement as HTMLElement;

    // 将焦点移到 modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // 禁止 body 滚动
    document.body.style.overflow = 'hidden';

    return () => {
      // 恢复焦点
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      // 恢复 body 滚动
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='animate-fade-in fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={handleBackdropClick}
      style={{ zIndex: zIndex.modal }}
    >
      <div
        ref={modalRef}
        className={`w-full ${sizeClasses[size]} shadow-elevation-xl animate-scale-in overflow-y-auto rounded-t-3xl bg-white p-6 md:rounded-3xl ${className}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {(title || showCloseButton) && (
          <div className='mb-6 flex items-center justify-between'>
            {title && (
              <h2
                id='modal-title'
                className='text-xl font-bold text-neutral-800'
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className='rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 active:scale-95'
                aria-label='关闭'
              >
                <X className='h-5 w-5' />
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className='overflow-y-auto'>{children}</div>
      </div>
    </div>
  );
}
