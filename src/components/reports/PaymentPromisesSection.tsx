import React from 'react';
import { PromiseReportSummary } from '../../lib/reportsAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { Handshake, CheckCircle2, Clock, AlertCircle, Percent } from 'lucide-react';

interface PaymentPromisesSectionProps {
  promises: PromiseReportSummary;
}

export const PaymentPromisesSection: React.FC<PaymentPromisesSectionProps> = ({
  promises,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Análise de Promessas de Pagamento e Acordos
            </h3>
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Compromissos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitorização do índice de cumprimento de datas acordadas e taxas de conversão de compromissos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total de Compromissos */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Total de Promessas</span>
            <Handshake className="w-4 h-4 text-purple-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {promises.totalCount}
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            {formatCurrency(promises.totalAmount)} acordados
          </span>
        </div>

        {/* 2. Cumpridas com Sucesso */}
        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Cumpridas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-emerald-950 tracking-tight">
              {promises.keptCount}
            </div>
          </div>
          <span className="text-[11px] text-emerald-700">
            {formatCurrency(promises.keptAmount)} liquidados na data
          </span>
        </div>

        {/* 3. Pendentes (Aguardam data) */}
        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-amber-950 tracking-tight">
              {promises.pendingCount}
            </div>
          </div>
          <span className="text-[11px] text-amber-700">
            {formatCurrency(promises.pendingAmount)} a vencer
          </span>
        </div>

        {/* 4. Taxa de Cumprimento */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Taxa de Cumprimento</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold text-indigo-950 tracking-tight">
              {promises.fulfillmentRate !== null ? `${promises.fulfillmentRate}%` : '—'}
            </div>
          </div>
          <span className="text-[11px] text-indigo-700">
            {promises.brokenCount} compromisso{promises.brokenCount !== 1 ? 's' : ''} não cumprido{promises.brokenCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
