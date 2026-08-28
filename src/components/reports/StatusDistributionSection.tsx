import React, { useState } from 'react';
import { StatusDistributionItem } from '../../lib/reportsAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { PieChart, ListFilter } from 'lucide-react';

interface StatusDistributionSectionProps {
  distribution: StatusDistributionItem[];
  totalCount: number;
}

export const StatusDistributionSection: React.FC<StatusDistributionSectionProps> = ({
  distribution,
  totalCount,
}) => {
  const [viewMode, setViewMode] = useState<'amount' | 'count'>('amount');

  const totalAmount = distribution.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Header com Toggle de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Distribuição da Carteira por Estado
            </h3>
            <span className="text-xs text-slate-400">
              ({totalCount} cobranças • {formatCurrency(totalAmount)})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Proporção de cobranças liquidadas, pendentes e em atraso.
          </p>
        </div>

        {/* Toggle Por Valor vs Por Quantidade */}
        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('amount')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'amount'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Valor (€)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('count')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'count'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Quantidade (N.º)
          </button>
        </div>
      </div>

      {/* Barra de Distribuição Proporcional */}
      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex mb-5 shadow-inner">
        {distribution.map((item) => {
          const pct = viewMode === 'amount' ? item.amountPercentage : item.countPercentage;
          if (pct <= 0) return null;
          return (
            <div
              key={item.status}
              style={{ width: `${pct}%`, backgroundColor: item.color }}
              className="h-full transition-all duration-300 relative group cursor-pointer"
              title={`${item.label}: ${pct}%`}
            />
          );
        })}
      </div>

      {/* Grelha / Tabela com Valores Detalhados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {distribution.map((item) => {
          const pct = viewMode === 'amount' ? item.amountPercentage : item.countPercentage;
          return (
            <div
              key={item.status}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-900">
                  {pct}%
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-200/50">
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(item.amount)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {item.count} doc{item.count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
