import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Percent,
  HelpCircle,
} from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

interface ExecutiveSummaryCardsProps {
  totalInvoiced: number;
  invoicedPercentageChange: number | null;
  totalReceived: number;
  receivedPercentageChange: number | null;
  totalOutstanding: number;
  outstandingPercentageChange: number | null;
  totalOverdue: number;
  overduePercentageChange: number | null;
  recoveredAmount: number;
  recoveredPercentageChange: number | null;
  collectionRate: number | null;
  collectionRateChange: number | null;
  periodLabel: string;
}

export const ExecutiveSummaryCards: React.FC<ExecutiveSummaryCardsProps> = ({
  totalInvoiced,
  invoicedPercentageChange,
  totalReceived,
  receivedPercentageChange,
  totalOutstanding,
  outstandingPercentageChange,
  totalOverdue,
  overduePercentageChange,
  recoveredAmount,
  recoveredPercentageChange,
  collectionRate,
  collectionRateChange,
  periodLabel,
}) => {
  const renderTrendBadge = (
    pctChange: number | null,
    isGoodPositive: boolean = true,
    customSuffix: string = 'vs. período anterior'
  ) => {
    if (pctChange === null) {
      return (
        <span className="text-[10px] text-slate-400 font-medium">
          Sem comparativo anterior
        </span>
      );
    }

    const isPositive = pctChange > 0;
    const isZero = pctChange === 0;

    if (isZero) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
          0% {customSuffix}
        </span>
      );
    }

    const isGood = isGoodPositive ? isPositive : !isPositive;

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
          isGood
            ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
            : 'text-rose-700 bg-rose-50 border border-rose-100'
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-3 h-3 text-emerald-600" />
        ) : (
          <TrendingDown className="w-3 h-3 text-rose-600" />
        )}
        <span>
          {isPositive ? '+' : ''}
          {pctChange}% {customSuffix}
        </span>
      </span>
    );
  };

  const cards = [
    {
      id: 'metric_invoiced',
      title: 'Total cobrado',
      tooltip: 'Soma total de cobranças emitidas no período selecionado.',
      value: formatCurrency(totalInvoiced),
      icon: <Receipt className="w-4 h-4 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      trend: renderTrendBadge(invoicedPercentageChange, true),
      borderColor: 'hover:border-indigo-200',
    },
    {
      id: 'metric_received',
      title: 'Total recebido',
      tooltip: 'Pagamentos efetivamente liquidados e confirmados dentro da janela temporal selecionada.',
      value: formatCurrency(totalReceived),
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      trend: renderTrendBadge(receivedPercentageChange, true),
      borderColor: 'hover:border-emerald-200',
    },
    {
      id: 'metric_outstanding',
      title: 'Total em aberto',
      tooltip: 'Montante global de faturas pendentes de liquidação na sua carteira.',
      value: formatCurrency(totalOutstanding),
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      trend: renderTrendBadge(outstandingPercentageChange, false),
      borderColor: 'hover:border-amber-200',
    },
    {
      id: 'metric_overdue',
      title: 'Total em atraso',
      tooltip: 'Valor de cobranças cuja data limite de vencimento já foi ultrapassada.',
      value: formatCurrency(totalOverdue),
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
      trend: renderTrendBadge(overduePercentageChange, false),
      borderColor: 'hover:border-rose-200',
    },
    {
      id: 'metric_recovered',
      title: 'Valor recuperado',
      tooltip: 'Montantes liquidados que estiveram anteriormente em atraso (pagamentos pós-vencimento).',
      value: formatCurrency(recoveredAmount),
      icon: <RotateCcw className="w-4 h-4 text-teal-600" />,
      iconBg: 'bg-teal-50 border-teal-100',
      trend: renderTrendBadge(recoveredPercentageChange, true),
      borderColor: 'hover:border-teal-200',
    },
    {
      id: 'metric_collection_rate',
      title: 'Taxa de recebimento',
      tooltip: 'Percentagem de liquidação face ao total faturado e pendente no período.',
      value: collectionRate !== null ? `${collectionRate}%` : '—',
      icon: <Percent className="w-4 h-4 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-100',
      trend:
        collectionRateChange !== null ? (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              collectionRateChange >= 0
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                : 'text-rose-700 bg-rose-50 border border-rose-100'
            }`}
          >
            {collectionRateChange >= 0 ? '+' : ''}
            {collectionRateChange}% pts vs. ant.
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Em linha</span>
        ),
      borderColor: 'hover:border-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          className={`bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs transition-all duration-150 ${card.borderColor} flex flex-col justify-between`}
        >
          {/* Header do Card */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-slate-600 truncate">
                {card.title}
              </span>
              <div className="relative group cursor-help">
                <HelpCircle className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] leading-tight rounded-md shadow-lg z-30 pointer-events-none">
                  {card.tooltip}
                </div>
              </div>
            </div>
            <div className={`p-1.5 rounded-lg border shrink-0 ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>

          {/* Valor Principal */}
          <div className="my-1">
            <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {card.value}
            </div>
          </div>

          {/* Comparativo de Tendência */}
          <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
            {card.trend}
          </div>
        </div>
      ))}
    </div>
  );
};
