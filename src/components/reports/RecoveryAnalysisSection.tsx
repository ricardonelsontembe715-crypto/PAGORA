import React from 'react';
import { RecoveryReportSummary } from '../../lib/reportsAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { RotateCcw, CheckCircle2, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

interface RecoveryAnalysisSectionProps {
  recovery: RecoveryReportSummary;
  totalOverdue: number;
}

export const RecoveryAnalysisSection: React.FC<RecoveryAnalysisSectionProps> = ({
  recovery,
  totalOverdue,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Recuperação de Valores e Regularizações
            </h3>
            <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Pós-Vencimento
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de liquidação de faturas que ultrapassaram a data limite inicial e foram regularizadas com sucesso.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Recuperado */}
        <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">Total Recuperado</span>
            <RotateCcw className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-teal-950 tracking-tight">
              {formatCurrency(recovery.recoveredAmount)}
            </div>
          </div>
          <span className="text-[11px] text-teal-700">
            {recovery.recoveredInvoicesCount} cobrança{recovery.recoveredInvoicesCount !== 1 ? 's' : ''} regularizada{recovery.recoveredInvoicesCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* 2. Taxa de Recuperação */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Taxa de Eficácia</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {recovery.recoveryRate !== null ? `${recovery.recoveryRate}%` : '—'}
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Recuperado face ao total em atraso
          </span>
        </div>

        {/* 3. Tempo Médio até Regularização */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Tempo Médio de Atraso</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {recovery.averageRecoveryDays !== null ? `${recovery.averageRecoveryDays} dias` : '—'}
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Dias decorridos após a data de vencimento
          </span>
        </div>

        {/* 4. Total Restante em Atraso */}
        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">Em Atraso Ativo</span>
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-rose-950 tracking-tight">
              {formatCurrency(totalOverdue)}
            </div>
          </div>
          <span className="text-[11px] text-rose-700">
            Pendente de intervenção de cobrança
          </span>
        </div>
      </div>
    </div>
  );
};
