import React from 'react';
import { CollectionReminder } from '../../types/automations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  MessageSquare,
  CreditCard,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Receipt,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Flame,
  ExternalLink,
} from 'lucide-react';

interface CollectionItemCardProps {
  item: CollectionReminder;
  onGenerateMessage: (item: CollectionReminder) => void;
  onRecordPayment: (invoiceId?: string, customerId?: string) => void;
  onSnooze: (item: CollectionReminder) => void;
  onResolve: (id: string) => void;
  onNavigateCustomer: (customerId: string) => void;
  onNavigateInvoice?: (invoiceId: string) => void;
}

export const CollectionItemCard: React.FC<CollectionItemCardProps> = ({
  item,
  onGenerateMessage,
  onRecordPayment,
  onSnooze,
  onResolve,
  onNavigateCustomer,
  onNavigateInvoice,
}) => {
  const getUrgencyBadge = (priority: CollectionReminder['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Prioridade Crítica
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Prioridade Alta
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Acompanhamento
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            Preventivo
          </span>
        );
    }
  };

  return (
    <div
      id={`collection-item-${item.id}`}
      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all p-5 space-y-3.5"
    >
      {/* Topo: Prioridade, Devedor e Montante */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {getUrgencyBadge(item.priority)}
            <span className="text-xs text-slate-400 font-medium">
              Agendado para {item.scheduledDate} {item.scheduledTime ? `às ${item.scheduledTime}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <h3
              onClick={() => onNavigateCustomer(item.customerId)}
              className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
            >
              {item.customerName}
            </h3>
            {item.invoiceNumber && (
              <span
                onClick={() => item.invoiceId && onNavigateInvoice && onNavigateInvoice(item.invoiceId)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer underline decoration-slate-300"
              >
                ({item.invoiceNumber})
              </span>
            )}
          </div>
        </div>

        {/* Montante em dívida */}
        {item.amount !== undefined && (
          <div className="text-right sm:shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Valor em Cobrança
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(item.amount)}
            </span>
          </div>
        )}
      </div>

      {/* Motivo e Sugestão Operacional Inteligente */}
      <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/70 space-y-2 text-xs">
        <div className="text-slate-700 leading-relaxed font-medium">
          <strong className="text-slate-900 font-bold">Diagnóstico:</strong> {item.reason}
        </div>

        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            Canal: <strong className="capitalize">{item.recommendedChannel || 'WhatsApp'}</strong>
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            Tom: <strong className="capitalize">{item.recommendedTone || 'Profissional'}</strong>
          </span>
          {item.customerPhone && (
            <span className="flex items-center gap-1 text-slate-500">
              <Phone className="w-3 h-3 text-slate-400" />
              {item.customerPhone}
            </span>
          )}
        </div>
      </div>

      {/* Barra de Ações Operacionais de 1-Clique */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 text-xs">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => onGenerateMessage(item)}
            className="w-full sm:w-auto text-xs h-9 sm:h-8 font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-2xs justify-center"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Preparar Mensagem
          </Button>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRecordPayment(item.invoiceId, item.customerId)}
              className="text-xs h-9 sm:h-8 font-medium text-slate-700 justify-center"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Registar Pagamento
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSnooze(item)}
              className="text-xs h-9 sm:h-8 text-slate-600 hover:bg-slate-100 justify-center"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Adiar...
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onResolve(item.id)}
          className="w-full sm:w-auto text-xs h-9 sm:h-8 text-emerald-700 hover:bg-emerald-50 font-semibold justify-center"
        >
          <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
          Concluir Ação
        </Button>
      </div>
    </div>
  );
};
