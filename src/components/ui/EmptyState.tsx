import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  actionLabel,
  onAction,
  secondaryAction,
  className = '',
}) => {
  const effectivePrimary = primaryAction || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 max-w-lg mx-auto my-6 ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 mb-4 shadow-2xs">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {(effectivePrimary || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {effectivePrimary && (
            <Button
              size="sm"
              variant="primary"
              onClick={effectivePrimary.onClick}
              leftIcon={effectivePrimary.icon}
            >
              {effectivePrimary.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
