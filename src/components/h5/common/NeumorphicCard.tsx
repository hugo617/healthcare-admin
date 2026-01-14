import React from 'react';

interface NeumorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'inset' | 'soft';
}

export function NeumorphicCard({
  children,
  className,
  variant = 'default'
}: NeumorphicCardProps) {
  const shadowClasses = {
    default: 'shadow-neumorphic',
    inset: 'shadow-neumorphic-inset',
    soft: 'shadow-neumorphic-soft'
  };

  return (
    <div
      className={`rounded-3xl bg-white ${shadowClasses[variant]} ${className || ''}`}
    >
      {children}
    </div>
  );
}
