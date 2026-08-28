import React from 'react';
import { CustomerBehaviorProfile } from '../../lib/collectionIntelligence';
import { formatCurrency } from '../../lib/formatters';
import { Badge } from '../ui/Badge';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Flame,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface CustomerBehaviorProfileCardProps {
  profile: CustomerBehaviorProfile;
}

export const CustomerBehaviorProfileCard: React.FC<CustomerBehaviorProfileCardProps> = ({
  profile,
}) => {
  const getCategoryIcon = () => {
    switch (profile.category) {
      case 'ON_TIME':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'OCCASIONALLY_LATE':
        return <Clock className="w-5 h-5 text-indigo-600" />;
      case 'RECURRENT_LATE':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'HIGH_RISK':
        return <Flame className="w-5 h-5 text-rose-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getContainerBg = () => {
    switch (profile.category) {
      case 'ON_TIME':
        return 'bg-emerald-50/50 border-emerald-200/80';
      case 'OCCASIONALLY_LATE':
        return 'bg-indigo-50/50 border-indigo-200/80';
      case 'RECURRENT_LATE':
        return 'bg-amber-50/50 border-amber-200/80';
      case 'HIGH_RISK':
        return 'bg-rose-50/50 border-rose-200/80';
      default:
        return 'bg-slate-50/70 border-slate-200/80';
    }
  };

  return (
    <div
      id="customer-behavior-profile-card"
      className={`rounded-2xl p-5 border shadow-2xs transition-all ${getContainerBg()}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-200/60">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Perfil de Comportamento
              </span>
              <Badge variant={profile.badgeVariant} size="sm">
                {profile.label}
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Análise Contextual de Pagamento
            </h3>
          </div>
        </div>

        <span className="text-[11px] font-medium text-slate-500 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200/60 self-start sm:self-auto">
          Confiança: <strong className="capitalize text-slate-800">{profile.confidence === 'high' ? 'Elevada' : profile.confidence === 'medium' ? 'Média' : 'Inicial'}</strong>
        </span>
      </div>

      {/* Explicação transparente baseada em dados reais */}
      <div className="mt-3.5 space-y-3">
        <div className="bg-white/90 rounded-xl p-3.5 border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-medium">
          <strong className="text-slate-900 font-bold block mb-1">Diagnóstico Fundamentado:</strong>
          {profile.explanation}
        </div>

        {/* Métricas Comportamentais Verificáveis */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/60 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Pagas no Prazo
            </span>
            <span className="text-sm font-bold text-emerald-700 font-mono">
              {profile.metrics.onTimePaidCount} / {profile.metrics.paidInvoices}
            </span>
          </div>

          <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/60 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Atraso Médio
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {profile.metrics.averageLateDays > 0 ? `${profile.metrics.averageLateDays} dias` : '0 dias'}
            </span>
          </div>

          <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/60 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Maior Atraso
            </span>
            <span className={`text-sm font-bold font-mono ${profile.metrics.maxLateDays > 15 ? 'text-rose-600' : 'text-slate-900'}`}>
              {profile.metrics.maxLateDays > 0 ? `${profile.metrics.maxLateDays} dias` : '0 dias'}
            </span>
          </div>

          <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/60 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Promessas Cumpridas
            </span>
            <span className="text-sm font-bold text-indigo-700 font-mono">
              {profile.metrics.keptPromisesCount} / {profile.metrics.keptPromisesCount + profile.metrics.brokenPromisesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
