import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../lib/formatters';
import {
  Receipt,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FinancialSummaryCardsProps {
  totalReceivable: number;
  openInvoicesCount: number;
  overdueAmount: number;
  overdueCount: number;
  pendingAmount: number;
  pendingCount: number;
  paidInPeriod: number;
  paidPercentageChange: number | null;
  periodLabel: string;
  onNavigateToInvoices: (filter?: string) => void;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
  totalReceivable,
  openInvoicesCount,
  overdueAmount,
  overdueCount,
  pendingAmount,
  pendingCount,
  paidInPeriod,
  paidPercentageChange,
  periodLabel,
  onNavigateToInvoices,
}) => {
  const hasOverdue = overdueAmount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total a Receber (Geral em Aberto) */}
      <Card
        hoverable
        onClick={() => onNavigateToInvoices()}
        className="group relative overflow-hidden transition-all duration-200 hover:border-indigo-300"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total a Receber
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors group-hover:bg-indigo-100">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formatCurrency(totalReceivable)}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{openInvoicesCount} cobrança{openInvoicesCount === 1 ? '' : 's'} em aberto</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </div>
      </Card>

      {/* 2. Em Atraso */}
      <Card
        hoverable
        onClick={() => onNavigateToInvoices('overdue')}
        className={`group relative overflow-hidden transition-all duration-200 ${
          hasOverdue
            ? 'bg-amber-50/40 border-amber-200/90 hover:border-amber-400'
            : 'hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${hasOverdue ? 'text-amber-800' : 'text-slate-500'}`}>
            Em Atraso
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              hasOverdue
                ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-200'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className={`text-2xl font-extrabold tracking-tight ${hasOverdue ? 'text-amber-700' : 'text-slate-900'}`}>
          {formatCurrency(overdueAmount)}
        </div>

        <div className="flex items-center justify-between text-xs mt-2.5 pt-2 border-t border-slate-100/80">
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            {hasOverdue ? (
              <span className="text-amber-700 font-medium truncate">
                {overdueCount} cobrança{overdueCount === 1 ? '' : 's'} vencida{overdueCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Sem atrasos registados
              </span>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </div>
      </Card>

      {/* 3. A Receber no Prazo */}
      <Card
        hoverable
        onClick={() => onNavigateToInvoices('pending')}
        className="group relative overflow-hidden transition-all duration-200 hover:border-blue-300"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dentro do Prazo
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formatCurrency(pendingAmount)}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            <span>{pendingCount} a vencer brevemente</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </div>
      </Card>

      {/* 4. Total Recebido no Período */}
      <Card
        hoverable
        onClick={() => onNavigateToInvoices('paid')}
        className="group relative overflow-hidden transition-all duration-200 hover:border-emerald-300"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            Recebido ({periodLabel})
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors group-hover:bg-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
          {formatCurrency(paidInPeriod)}
        </div>

        <div className="flex items-center justify-between text-xs mt-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-medium truncate">
            {paidPercentageChange !== null ? (
              paidPercentageChange >= 0 ? (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  +{paidPercentageChange}% vs ant.
                </span>
              ) : (
                <span className="text-slate-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                  {paidPercentageChange}% vs ant.
                </span>
              )
            ) : (
              <span className="text-slate-500">Total liquidado no período</span>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </div>
      </Card>
    </div>
  );
};
