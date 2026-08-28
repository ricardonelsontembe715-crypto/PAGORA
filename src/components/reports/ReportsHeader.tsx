import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Printer,
  ChevronDown,
  Sparkles,
  Filter,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { PeriodOption, DateRange } from '../../lib/reportsAnalytics';
import { formatDate } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { hasFeature } from '../../lib/permissions';

interface ReportsHeaderProps {
  period: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  dateRange: DateRange;
  customStart: string;
  customEnd: string;
  onCustomDateChange: (start: string, end: string) => void;
  onExportCSV: () => void;
  onPrint: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  activeFilterCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const PERIOD_LABELS: Record<PeriodOption, string> = {
  today: 'Hoje',
  last_7_days: 'Últimos 7 dias',
  last_30_days: 'Últimos 30 dias',
  this_month: 'Este mês',
  last_month: 'Mês anterior',
  last_3_months: 'Últimos 3 meses',
  last_6_months: 'Últimos 6 meses',
  this_year: 'Este ano',
  custom: 'Personalizado',
};

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  period,
  onPeriodChange,
  dateRange,
  customStart,
  customEnd,
  onCustomDateChange,
  onExportCSV,
  onPrint,
  isFilterOpen,
  onToggleFilter,
  activeFilterCount,
  onRefresh,
  isRefreshing = false,
}) => {
  const { account } = useAuth();
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(customStart);
  const [tempEnd, setTempEnd] = useState(customEnd);

  const canExport = hasFeature(account, 'feature.advanced_reports');

  const handleSelectPeriod = (p: PeriodOption) => {
    setIsPeriodDropdownOpen(false);
    if (p === 'custom') {
      setShowCustomModal(true);
    } else {
      onPeriodChange(p);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempStart && tempEnd) {
      onCustomDateChange(tempStart, tempEnd);
      onPeriodChange('custom');
      setShowCustomModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-4 border-b border-slate-200/80">
      {/* Linha Principal de Título e Ações */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Relatórios e análises
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Inteligência Financeira
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Compreenda a evolução dos seus recebimentos, analise prazos de liquidação e tome decisões com base nos dados reais da sua carteira.
          </p>
        </div>

        {/* Controlos Globais de Topo */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Seletor de Período Global */}
          <div className="relative">
            <button
              type="button"
              id="report_period_selector_btn"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{PERIOD_LABELS[period]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isPeriodDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsPeriodDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-30 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Intervalo Temporal
                  </div>
                  <div className="py-1">
                    {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map((pKey) => (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => handleSelectPeriod(pKey)}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                          period === pKey
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{PERIOD_LABELS[pKey]}</span>
                        {period === pKey && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botão de Filtros Avançados */}
          <button
            type="button"
            id="report_toggle_filters_btn"
            onClick={onToggleFilter}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shadow-2xs ${
              isFilterOpen || activeFilterCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Botão de Atualizar / Recalcular */}
          <button
            type="button"
            id="report_refresh_btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Recalcular indicadores"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Botão de Exportação CSV */}
          <button
            type="button"
            id="report_export_csv_btn"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
            title={canExport ? 'Descarregar dados em formato CSV para Excel' : 'Exportação disponível nos planos superiores'}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
            {!canExport && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
          </button>

          {/* Botão de Imprimir / PDF */}
          <button
            type="button"
            id="report_print_btn"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Faixa Informativa de Intervalo Ativo */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">Janela temporal ativa:</span>
          <span className="font-semibold text-slate-900">
            {formatDate(dateRange.start)} — {formatDate(dateRange.end)}
          </span>
          <span className="text-slate-400">•</span>
          <span>Período: <strong>{PERIOD_LABELS[period]}</strong></span>
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Todos os valores calculados em tempo real com base no histórico de pagamentos e cobranças.
        </div>
      </div>

      {/* Modal de Intervalo Personalizado */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 max-w-sm w-full animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Definir Intervalo Personalizado</h3>
            <p className="text-xs text-slate-500 mb-4">Escolha a data inicial e final para recalcular os relatórios.</p>
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Fim</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                >
                  Aplicar Intervalo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
