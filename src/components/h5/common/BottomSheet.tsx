'use client';

import React, { useEffect, useRef } from 'react';
import { X, GripVertical } from 'lucide-react';
import { borderRadius, duration, easing, zIndex } from './theme';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
  showCloseButton?: boolean;
  showHandle?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const heightClasses = {
  auto: 'max-h-[60vh]',
  half: 'h-[50vh]',
  full: 'h-[90vh]'
};

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  height = 'auto',
  showCloseButton = true,
  showHandle = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = ''
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

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

    previousActiveElement.current = document.activeElement as HTMLElement;

    const focusableElements = sheetRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    document.body.style.overflow = 'hidden';

    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      document.body.style.overflow = '';
    };
  }, [open]);

  // 处理拖动手势
  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      e.target === sheetRef.current ||
      (e.target as HTMLElement).closest('[data-drag-handle]')
    ) {
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    const deltaY = currentY.current - startY.current;

    if (deltaY > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }

    isDragging.current = false;
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='animate-fade-in fixed inset-0 z-[1050] flex items-end justify-center bg-black/50 backdrop-blur-sm'
      onClick={handleBackdropClick}
      style={{ zIndex: zIndex.modal }}
    >
      <div
        ref={sheetRef}
        className={`w-full ${heightClasses[height]} shadow-elevation-xl animate-slide-up w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white ${className}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? 'bottomsheet-title' : undefined}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transition: isDragging.current
            ? 'none'
            : `transform ${duration.base}ms ${easing.outQuint}`
        }}
      >
        {/* 拖动手柄 */}
        {showHandle && (
          <div className='flex justify-center pt-3 pb-1' data-drag-handle>
            <div className='h-1.5 w-12 rounded-full bg-neutral-300' />
          </div>
        )}

        {/* 标题栏 */}
        {(title || showCloseButton) && (
          <div className='flex items-center justify-between px-6 py-4'>
            {title && (
              <h2
                id='bottomsheet-title'
                className='text-lg font-bold text-neutral-800'
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
        <div className='overflow-y-auto px-6 pb-6'>{children}</div>
      </div>
    </div>
  );
}
