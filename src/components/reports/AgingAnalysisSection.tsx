import React from 'react';
import { AgingBucket, AgingBucketId } from '../../lib/reportsAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { AlertCircle, Clock, ChevronRight, ShieldAlert } from 'lucide-react';

interface AgingAnalysisSectionProps {
  agingBuckets: AgingBucket[];
  totalAtRiskAmount: number;
  totalAtRiskCount: number;
  atRiskPercentage: number | null;
  selectedBucketId?: AgingBucketId;
  onSelectBucket: (bucketId: AgingBucketId) => void;
}

export const AgingAnalysisSection: React.FC<AgingAnalysisSectionProps> = ({
  agingBuckets,
  totalAtRiskAmount,
  totalAtRiskCount,
  atRiskPercentage,
  selectedBucketId,
  onSelectBucket,
}) => {
  const getSeverityStyle = (severity: AgingBucket['severity'], isSelected: boolean) => {
    if (isSelected) {
      return 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20';
    }

    switch (severity) {
      case 'safe':
        return 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30';
      case 'low':
        return 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30';
      case 'medium':
        return 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30';
      case 'high':
        return 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/30';
      case 'critical':
        return 'border-slate-200 bg-white hover:border-rose-400 hover:bg-rose-50/50';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const getSeverityBadge = (severity: AgingBucket['severity']) => {
    switch (severity) {
      case 'safe':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">No prazo</span>;
      case 'low':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">Atraso recente</span>;
      case 'medium':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">Atenção</span>;
      case 'high':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">Risco Elevado</span>;
      case 'critical':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">Crítico</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Header do Aging */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Análise de Faixas de Vencimento (Aging de Recebíveis)
            </h3>
            <span className="text-xs text-slate-400">7 faixas temporais</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Segmentação por antiguidade da dívida para priorizar ações de cobrança preventivas e reativas.
          </p>
        </div>

        {/* Callout de Valores em Risco */}
        {totalAtRiskAmount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">{formatCurrency(totalAtRiskAmount)}</span>
              <span className="text-rose-600 ml-1">em risco (&gt; 30 dias • {totalAtRiskCount} doc{totalAtRiskCount !== 1 ? 's' : ''})</span>
            </div>
          </div>
        )}
      </div>

      {/* Grelha de Buckets de Vencimento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        {agingBuckets.map((bucket) => {
          const isSelected = selectedBucketId === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              onClick={() => onSelectBucket(bucket.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${getSeverityStyle(
                bucket.severity,
                isSelected
              )}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {bucket.shortLabel}
                  </span>
                  {getSeverityBadge(bucket.severity)}
                </div>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(bucket.amount)}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>{bucket.count} fatura{bucket.count !== 1 ? 's' : ''}</span>
                {bucket.percentageOfTotal > 0 && (
                  <span className="font-bold text-slate-700">{bucket.percentageOfTotal}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Rodapé Informativo */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Clique numa faixa para filtrar ou ver a listagem correspondente de cobranças.</span>
        </span>
      </div>
    </div>
  );
};
