import React from 'react';
import {
  Users,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';

interface OperationalMetricsBarProps {
  activeCustomersCount: number;
  openInvoicesCount: number;
  overdueInvoicesCount: number;
  paidInvoicesCount: number;
  activePromisesCount: number;
  brokenPromisesCount: number;
  monthlyMessagesCount: number;
  onNavigateToCustomers: () => void;
  onNavigateToInvoices: (filter?: string) => void;
  onNavigateToMessages: () => void;
}

export const OperationalMetricsBar: React.FC<OperationalMetricsBarProps> = ({
  activeCustomersCount,
  openInvoicesCount,
  overdueInvoicesCount,
  paidInvoicesCount,
  activePromisesCount,
  brokenPromisesCount,
  monthlyMessagesCount,
  onNavigateToCustomers,
  onNavigateToInvoices,
  onNavigateToMessages,
}) => {
  const metrics = [
    {
      label: 'Clientes Ativos',
      value: activeCustomersCount,
      icon: <Users className="w-3.5 h-3.5 text-indigo-600" />,
      bg: 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100',
      textColor: 'text-indigo-950',
      badgeColor: 'text-indigo-700 font-bold',
      onClick: onNavigateToCustomers,
    },
    {
      label: 'Em Aberto',
      value: openInvoicesCount,
      icon: <Receipt className="w-3.5 h-3.5 text-slate-600" />,
      bg: 'bg-slate-50 hover:bg-slate-100/80 border-slate-200',
      textColor: 'text-slate-900',
      badgeColor: 'text-slate-800 font-bold',
      onClick: () => onNavigateToInvoices('pending'),
    },
    {
      label: 'Em Atraso',
      value: overdueInvoicesCount,
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      bg: overdueInvoicesCount > 0 ? 'bg-amber-50 hover:bg-amber-100/80 border-amber-200' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200',
      textColor: overdueInvoicesCount > 0 ? 'text-amber-950' : 'text-slate-900',
      badgeColor: overdueInvoicesCount > 0 ? 'text-amber-700 font-bold' : 'text-slate-800 font-bold',
      onClick: () => onNavigateToInvoices('overdue'),
    },
    {
      label: 'Pagas',
      value: paidInvoicesCount,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      bg: 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100',
      textColor: 'text-emerald-950',
      badgeColor: 'text-emerald-700 font-bold',
      onClick: () => onNavigateToInvoices('paid'),
    },
    {
      label: 'Promessas',
      value: `${activePromisesCount}${brokenPromisesCount > 0 ? ` (${brokenPromisesCount} venc.)` : ''}`,
      icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
      bg: brokenPromisesCount > 0 ? 'bg-red-50 hover:bg-red-100/80 border-red-200' : 'bg-blue-50/50 hover:bg-blue-50 border-blue-100',
      textColor: brokenPromisesCount > 0 ? 'text-red-950' : 'text-blue-950',
      badgeColor: brokenPromisesCount > 0 ? 'text-red-700 font-bold' : 'text-blue-700 font-bold',
      onClick: () => onNavigateToInvoices(),
    },
    {
      label: 'Mensagens / Mês',
      value: monthlyMessagesCount,
      icon: <MessageSquare className="w-3.5 h-3.5 text-violet-600" />,
      bg: 'bg-violet-50/50 hover:bg-violet-50 border-violet-100',
      textColor: 'text-violet-950',
      badgeColor: 'text-violet-700 font-bold',
      onClick: onNavigateToMessages,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {metrics.map((m, idx) => (
        <button
          key={idx}
          type="button"
          onClick={m.onClick}
          className={`flex flex-col justify-between p-2.5 rounded-lg border transition-all text-left group shadow-2xs ${m.bg}`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 truncate">
              {m.icon}
              <span className="text-[11px] font-medium text-slate-600 truncate">{m.label}</span>
            </div>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
          </div>

          <div className={`text-base font-bold tracking-tight ${m.badgeColor}`}>
            {m.value}
          </div>
        </button>
      ))}
    </div>
  );
};
