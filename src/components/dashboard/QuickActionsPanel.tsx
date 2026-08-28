import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  UserPlus,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  CreditCard,
  Clock,
  BarChart3,
  Sparkles,
  Compass,
  Zap,
} from 'lucide-react';

interface QuickActionsPanelProps {
  onNewCustomer: () => void;
  onNewInvoice: () => void;
  onGenerateMessage: () => void;
  onViewOverdue: () => void;
  onRecordPayment: () => void;
  onRecordPromise: () => void;
  onViewReports: () => void;
  onNavigateCollectionCenter?: () => void;
  onNavigateAutomations?: () => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onNewCustomer,
  onNewInvoice,
  onGenerateMessage,
  onViewOverdue,
  onRecordPayment,
  onRecordPromise,
  onViewReports,
  onNavigateCollectionCenter,
  onNavigateAutomations,
}) => {
  const actions = [
    ...(onNavigateCollectionCenter
      ? [
          {
            title: 'Centro de Cobrança',
            description: 'Ações operacionais prioritárias para hoje',
            icon: <Compass className="w-4 h-4 text-indigo-600" />,
            onClick: onNavigateCollectionCenter,
            primary: true,
          },
        ]
      : []),
    {
      title: 'Adicionar Cliente',
      description: 'Cadastrar nova empresa ou particular',
      icon: <UserPlus className="w-4 h-4 text-indigo-600" />,
      onClick: onNewCustomer,
      primary: true,
    },
    {
      title: 'Registar Cobrança',
      description: 'Emitir ou registar nova fatura a cobrar',
      icon: <PlusCircle className="w-4 h-4 text-emerald-600" />,
      onClick: onNewInvoice,
      primary: true,
    },
    {
      title: 'Gerar Mensagem',
      description: 'Criar mensagem de acompanhamento com IA',
      icon: <MessageSquare className="w-4 h-4 text-violet-600" />,
      onClick: onGenerateMessage,
    },
    {
      title: 'Cobranças em Atraso',
      description: 'Filtrar todas as dívidas vencidas',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      onClick: onViewOverdue,
    },
    {
      title: 'Registar Pagamento',
      description: 'Dar baixa total ou parcial numa fatura',
      icon: <CreditCard className="w-4 h-4 text-teal-600" />,
      onClick: onRecordPayment,
    },
    ...(onNavigateAutomations
      ? [
          {
            title: 'Automações & Regras',
            description: 'Gatilhos de vencimento e sequências',
            icon: <Zap className="w-4 h-4 text-amber-600" />,
            onClick: onNavigateAutomations,
          },
        ]
      : []),
    {
      title: 'Registar Promessa',
      description: 'Agendar data prometida pelo devedor',
      icon: <Clock className="w-4 h-4 text-blue-600" />,
      onClick: onRecordPromise,
    },
    {
      title: 'Ver Relatórios',
      description: 'Análise detalhada de liquidação e prazos',
      icon: <BarChart3 className="w-4 h-4 text-slate-600" />,
      onClick: onViewReports,
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 pb-2.5 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ações Rápidas & Operações
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Atalhos para operações financeiras frequentes
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            type="button"
            onClick={act.onClick}
            className={`p-2.5 rounded-lg border text-left transition-all duration-150 flex items-center gap-2.5 group ${
              act.primary
                ? 'bg-indigo-50/40 border-indigo-200/70 hover:bg-indigo-50 hover:border-indigo-300'
                : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
            }`}
          >
            <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs text-slate-700">
              {act.icon}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                {act.title}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {act.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
