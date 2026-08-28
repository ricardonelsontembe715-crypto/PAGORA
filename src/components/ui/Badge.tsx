import React from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'info' | 'neutral' | 'gray' | 'default' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-medium',
    error: 'bg-red-50 text-red-700 border border-red-200/80 font-medium',
    danger: 'bg-red-50 text-red-700 border border-red-200/80 font-medium',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    default: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    outline: 'bg-white text-slate-700 border border-slate-300 font-medium',
  };

  const dotClasses: Record<BadgeVariant, string> = {
    primary: 'bg-indigo-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
    neutral: 'bg-slate-500',
    gray: 'bg-slate-500',
    default: 'bg-slate-500',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium leading-none select-none whitespace-nowrap ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
