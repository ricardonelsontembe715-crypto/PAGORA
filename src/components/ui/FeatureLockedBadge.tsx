import React from 'react';
import { Lock } from 'lucide-react';
import { PlanType } from '../../types/database';

export interface FeatureLockedBadgeProps {
  requiredPlan: PlanType;
  onClick?: () => void;
  className?: string;
}

export const FeatureLockedBadge: React.FC<FeatureLockedBadgeProps> = ({
  requiredPlan,
  onClick,
  className = '',
}) => {
  const planLabels = {
    free: 'FREE',
    plus: 'PLUS',
    pro: 'PRO',
  };

  const planColors = {
    free: 'bg-slate-100 text-slate-700 border-slate-200',
    plus: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pro: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border cursor-pointer hover:opacity-80 transition-opacity ${planColors[requiredPlan]} ${className}`}
      title={`Requer plano ${planLabels[requiredPlan]}`}
    >
      <Lock className="w-2.5 h-2.5" />
      <span>Plano {planLabels[requiredPlan]}</span>
    </button>
  );
};
