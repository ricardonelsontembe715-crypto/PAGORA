import React from 'react';
import { X, Search, RotateCcw } from 'lucide-react';
import { Customer } from '../../types/database';
import { ReportsFilterState, AgingBucketId } from '../../lib/reportsAnalytics';

interface ReportsFilterBarProps {
  filters: ReportsFilterState;
  onFilterChange: (newFilters: Partial<ReportsFilterState>) => void;
  onResetFilters: () => void;
  customers: Customer[];
  activeFilterCount: number;
  isOpen: boolean;
  onClose: () => void;
}

const AGING_BUCKET_OPTIONS: { id: AgingBucketId | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas as faixas' },
  { id: 'current', label: 'No prazo (Não vencidas)' },
  { id: 'days_1_7', label: '1 a 7 dias' },
  { id: 'days_8_15', label: '8 a 15 dias' },
  { id: 'days_16_30', label: '16 a 30 dias' },
  { id: 'days_31_60', label: '31 a 60 dias' },
  { id: 'days_61_90', label: '61 a 90 dias' },
  { id: 'days_over_90', label: 'Mais de 90 dias' },
];

export const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  customers,
  activeFilterCount,
  isOpen,
  onClose,
}) => {
  if (!isOpen && activeFilterCount === 0) {
    return null;
  }

  const selectedCustomer = customers.find((c) => c.id === filters.customerId);

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 transition-all duration-200 animate-in fade-in">
      {/* Linha de Controles Expansíveis */}
      {isOpen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filtros Avançados de Análise
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              aria-label="Fechar painel de filtros"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Cliente Específico */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cliente
              </label>
              <select
                value={filters.customerId || ''}
                onChange={(e) =>
                  onFilterChange({ customerId: e.target.value ? e.target.value : undefined })
                }
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              >
                <option value="">Todos os clientes</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.taxId ? `(${c.taxId})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Tipo de Cliente */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Segmento / Tipo
              </label>
              <select
                value={filters.customerType || 'all'}
                onChange={(e) =>
                  onFilterChange({
                    customerType: e.target.value as 'all' | 'company' | 'person',
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              >
                <option value="all">Empresas e Particulares</option>
                <option value="company">Apenas Empresas (B2B)</option>
                <option value="person">Apenas Particulares (B2C)</option>
              </select>
            </div>

            {/* 3. Faixa de Atraso (Aging) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Faixa de Vencimento
              </label>
              <select
                value={filters.agingBucket || 'all'}
                onChange={(e) =>
                  onFilterChange({
                    agingBucket:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as AgingBucketId),
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              >
                {AGING_BUCKET_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Valor Mínimo / Máximo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Intervalo de Valor (€)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Mín."
                  value={filters.minAmount !== undefined ? filters.minAmount : ''}
                  onChange={(e) =>
                    onFilterChange({
                      minAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-1/2 text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
                <span className="text-slate-400 text-xs">—</span>
                <input
                  type="number"
                  placeholder="Máx."
                  value={filters.maxAmount !== undefined ? filters.maxAmount : ''}
                  onChange={(e) =>
                    onFilterChange({
                      maxAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-1/2 text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chips de Filtros Ativos */}
      {activeFilterCount > 0 && (
        <div className={`flex flex-wrap items-center gap-2 ${isOpen ? 'pt-3 border-t border-slate-200/60 mt-3' : ''}`}>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Filtros ativos:
          </span>

          {filters.customerId && selectedCustomer && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <span>Cliente: {selectedCustomer.name}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ customerId: undefined })}
                className="hover:text-indigo-950 p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.customerType && filters.customerType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <span>
                Tipo: {filters.customerType === 'company' ? 'Empresas' : 'Particulares'}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ customerType: 'all' })}
                className="hover:text-indigo-950 p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.agingBucket && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <span>
                Faixa:{' '}
                {AGING_BUCKET_OPTIONS.find((o) => o.id === filters.agingBucket)?.label}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ agingBucket: undefined })}
                className="hover:text-amber-950 p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.minAmount !== undefined || filters.maxAmount !== undefined) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300">
              <span>
                Valor:{' '}
                {filters.minAmount !== undefined ? `≥ ${filters.minAmount} €` : ''}{' '}
                {filters.maxAmount !== undefined ? `≤ ${filters.maxAmount} €` : ''}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ minAmount: undefined, maxAmount: undefined })}
                className="hover:text-slate-950 p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline px-2 py-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar todos</span>
          </button>
        </div>
      )}
    </div>
  );
};
