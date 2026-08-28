import React from 'react';
import { PlanType } from '../../types/database';
import { useNavigation } from '../../context/NavigationContext';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface PlanLockedFeatureProps {
  requiredPlan: PlanType;
  featureTitle: string;
  featureDescription: string;
  bulletPoints?: string[];
  className?: string;
}

export const PlanLockedFeature: React.FC<PlanLockedFeatureProps> = ({
  requiredPlan,
  featureTitle,
  featureDescription,
  bulletPoints = [],
  className = '',
}) => {
  const { navigate } = useNavigation();

  const planName = requiredPlan === 'pro' ? 'Plano PRO' : 'Plano PLUS';
  const planBadgeClass =
    requiredPlan === 'pro'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-indigo-100 text-indigo-900 border-indigo-300';

  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-slate-300 bg-linear-to-b from-slate-50/90 to-white p-8 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
        <Lock className="w-7 h-7" />
      </div>

      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-3 uppercase tracking-wider shadow-2xs ${planBadgeClass}`}>
        <Sparkles className="w-3.5 h-3.5" />
        Disponível no {planName}
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">{featureTitle}</h3>
      <p className="text-xs text-slate-600 max-w-lg mb-6 leading-relaxed">
        {featureDescription}
      </p>

      {bulletPoints.length > 0 && (
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-xl p-4 mb-6 text-left shadow-2xs">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            O que desbloqueia com este plano:
          </p>
          <ul className="space-y-2">
            {bulletPoints.map((bp, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                {bp}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          onClick={() => navigate('dashboard_plans')}
          className="gap-2 px-6 shadow-sm"
        >
          Desbloquear no {planName}
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate('dashboard_plans')}
        >
          Comparar todos os planos
        </Button>
      </div>
    </div>
  );
};
