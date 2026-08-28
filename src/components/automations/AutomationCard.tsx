import React from 'react';
import { Automation } from '../../types/automations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Zap,
  Clock,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Bell,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import { formatDate } from '../../lib/formatters';

interface AutomationCardProps {
  automation: Automation;
  onToggleStatus: (id: string) => void;
  onEdit: (automation: Automation) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AutomationCard: React.FC<AutomationCardProps> = ({
  automation,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const getTriggerLabel = (type: Automation['trigger']['type'], offset?: number) => {
    switch (type) {
      case 'invoice_near_due':
        return `Cobrança a ${offset || 3} dias do vencimento`;
      case 'invoice_due_today':
        return 'Cobrança vence hoje';
      case 'invoice_overdue_days':
        return `Cobrança vencida há ${offset || 1} dia(s)`;
      case 'invoice_overdue':
        return 'Cobrança em atraso';
      case 'invoice_partially_paid':
        return 'Pagamento parcial registado';
      case 'invoice_paid':
        return 'Cobrança totalmente liquidada';
      case 'invoice_created':
        return 'Nova cobrança emitida';
      case 'promise_due_today':
        return 'Promessa de pagamento vence hoje';
      case 'promise_broken':
        return 'Promessa de pagamento não cumprida';
      case 'customer_debt_exceeded':
        return `Dívida do cliente > ${automation.trigger.thresholdValue || 1000} €`;
      default:
        return 'Evento do sistema';
    }
  };

  const getConditionSummary = () => {
    if (!automation.conditions || automation.conditions.length === 0) {
      return 'Todas as cobranças aplicáveis';
    }
    return automation.conditions
      .map((c) => {
        if (c.field === 'invoice_status') return `Estado é "${c.value}"`;
        if (c.field === 'invoice_amount') return `Valor ${c.operator === 'greater_than' ? '>' : '<'} ${c.value} €`;
        if (c.field === 'customer_has_broken_promise') return 'Cliente tem promessa quebrada';
        if (c.field === 'customer_total_debt') return `Dívida total > ${c.value} €`;
        return `${c.field} ${c.operator} ${c.value}`;
      })
      .join(automation.conditionLogic === 'any' ? ' OU ' : ' E ');
  };

  const getActionSummary = () => {
    if (!automation.actions || automation.actions.length === 0) return 'Sem ações';
    return automation.actions
      .map((a) => {
        if (a.type === 'create_reminder') return 'Criar lembrete operacional';
        if (a.type === 'create_task') return 'Criar tarefa prioritária';
        if (a.type === 'create_alert') return 'Gerar alerta crítico';
        if (a.type === 'send_system_notification') return 'Enviar notificação interna';
        if (a.type === 'mark_priority') return 'Marcar como prioritário';
        return a.type;
      })
      .join(' + ');
  };

  return (
    <div
      id={`automation-card-${automation.id}`}
      className={`relative bg-white rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-xs p-5 ${
        automation.status === 'active'
          ? 'border-slate-200/90 hover:border-indigo-200'
          : 'border-slate-200/60 bg-slate-50/40 opacity-80'
      }`}
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              automation.status === 'active'
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {automation.name}
              </h3>
              {automation.isPreset && (
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100/80">
                  Modelo Oficial
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {automation.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 relative">
          <button
            type="button"
            onClick={() => onToggleStatus(automation.id)}
            title={automation.status === 'active' ? 'Pausar automação' : 'Ativar automação'}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
              automation.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            {automation.status === 'active' ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Ativa</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Em pausa</span>
              </>
            )}
          </button>

          {/* Menu Dropdown de Ações */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200/90 py-1 z-30 text-xs text-slate-700 divide-y divide-slate-100">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onEdit(automation);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar regra</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDuplicate(automation.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 font-medium"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Duplicar regra</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(automation.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-rose-50 text-rose-600 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Regra Visual (QUANDO / SE / ENTÃO) */}
      <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/60 mb-4 text-xs space-y-2">
        <div className="flex items-start gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] w-14 shrink-0 mt-0.5">
            Quando:
          </span>
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {getTriggerLabel(automation.trigger.type, automation.trigger.daysOffset)}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] w-14 shrink-0 mt-0.5">
            Se:
          </span>
          <span className="text-slate-600 truncate">{getConditionSummary()}</span>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] w-14 shrink-0 mt-0.5">
            Então:
          </span>
          <span className="font-medium text-indigo-700 flex items-center gap-1">
            <ArrowRight className="w-3 h-3 shrink-0" />
            {getActionSummary()}
          </span>
        </div>
      </div>

      {/* Rodapé do Card com Métricas de Execução */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1" title="Total de execuções da regra">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <strong className="text-slate-700 font-semibold">{automation.executionCount}</strong> execuções
          </span>
          {automation.lastRunAt && (
            <span className="hidden sm:inline-block text-slate-400">
              Última: {formatDate(automation.lastRunAt)}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          {automation.settings?.preferredTime && (
            <span>Agendamento às {automation.settings.preferredTime}</span>
          )}
        </div>
      </div>
    </div>
  );
};
