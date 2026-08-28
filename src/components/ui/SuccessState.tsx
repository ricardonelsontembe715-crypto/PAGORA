import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export interface SuccessStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-emerald-200 rounded-xl bg-emerald-50/40 max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-emerald-950 mb-1">{title}</h3>
      <p className="text-xs text-emerald-700 max-w-sm mb-4 leading-relaxed">{message}</p>
      {action && (
        <Button size="sm" variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
