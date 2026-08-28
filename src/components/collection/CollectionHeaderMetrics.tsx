import React from 'react';
import { formatCurrency } from '../../lib/formatters';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Banknote,
  Calendar,
  Layers,
} from 'lucide-react';

interface CollectionHeaderMetricsProps {
  todayActionsCount: number;
  todayAmount: number;
  criticalOverdueCount: number;
  criticalOverdueAmount: number;
  promisesDueCount: number;
  promisesDueAmount: number;
  totalActiveDebt: number;
}

export const CollectionHeaderMetrics: React.FC<CollectionHeaderMetricsProps> = ({
  todayActionsCount,
  todayAmount,
  criticalOverdueCount,
  criticalOverdueAmount,
  promisesDueCount,
  promisesDueAmount,
  totalActiveDebt,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Ações Para Hoje */}
      <div className="bg-white rounded-xl p-4.5 border border-indigo-200 shadow-2xs relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            Ações Para Hoje
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-0.5">
          {todayActionsCount}
        </div>
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>Montante em foco:</span>
          <strong className="text-indigo-700 font-semibold">{formatCurrency(todayAmount)}</strong>
        </div>
      </div>

      {/* 2. Atraso Crítico (> 7 dias) */}
      <div className="bg-white rounded-xl p-4.5 border border-rose-200 shadow-2xs relative overflow-hidden bg-gradient-to-br from-white to-rose-50/20">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
            Atrasos Críticos
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-0.5">
          {criticalOverdueCount}
        </div>
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>Total em risco:</span>
          <strong className="text-rose-700 font-semibold">{formatCurrency(criticalOverdueAmount)}</strong>
        </div>
      </div>

      {/* 3. Promessas a Acompanhar */}
      <div className="bg-white rounded-xl p-4.5 border border-amber-200 shadow-2xs relative overflow-hidden bg-gradient-to-br from-white to-amber-50/20">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Promessas de Pagamento
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-0.5">
          {promisesDueCount}
        </div>
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>Acordos previstos:</span>
          <strong className="text-amber-700 font-semibold">{formatCurrency(promisesDueAmount)}</strong>
        </div>
      </div>

      {/* 4. Carteira Total em Gestão Ativa */}
      <div className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Carteira em Gestão
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-0.5">
          {formatCurrency(totalActiveDebt)}
        </div>
        <div className="text-xs text-slate-500">
          Saldo total pendente e em cobrança ativa
        </div>
      </div>
    </div>
  );
};
