'use client';

import React from 'react';
import { borderRadius, duration, easing } from './theme';

type CardVariant = 'default' | 'inset' | 'soft' | 'hover';
type CardSize = 'sm' | 'md' | 'lg';

interface NeumorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  size?: CardSize;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  padding?: boolean;
}

const shadowClasses = {
  default: 'shadow-neumorphic',
  inset: 'shadow-neumorphic-inset',
  soft: 'shadow-neumorphic-soft',
  hover: 'shadow-neumorphic-hover'
};

const sizeClasses = {
  sm: 'rounded-2xl',
  md: 'rounded-3xl',
  lg: 'rounded-[32px]'
};

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

export function NeumorphicCard({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  hover = false,
  clickable = false,
  onClick,
  padding = true
}: NeumorphicCardProps) {
  const baseClasses = ['bg-white', sizeClasses[size], shadowClasses[variant]];

  // 交互状态
  const interactionClasses = [
    hover &&
      'transition-shadow duration-base ease-out hover:shadow-neumorphic-hover',
    clickable &&
      'cursor-pointer transition-all duration-base ease-out active:scale-95 active:shadow-neumorphic-soft'
  ]
    .filter(Boolean)
    .join(' ');

  // 内边距
  const paddingClass = padding ? paddingClasses[size] : '';

  const combinedClasses = [
    ...baseClasses,
    interactionClasses,
    paddingClass,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={combinedClasses}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {children}
    </div>
  );
}
