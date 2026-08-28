import React, { useState } from 'react';
import { CollectionReminder } from '../../types/automations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  Clock,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  User,
  Receipt,
  MoreVertical,
  Trash2,
  Edit2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface ReminderCardProps {
  reminder: CollectionReminder;
  onResolve: (id: string) => void;
  onSnooze: (reminder: CollectionReminder) => void;
  onGenerateMessage: (reminder: CollectionReminder) => void;
  onEdit: (reminder: CollectionReminder) => void;
  onDelete: (id: string) => void;
  onDirectCall?: (phone?: string) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onResolve,
  onSnooze,
  onGenerateMessage,
  onEdit,
  onDelete,
  onDirectCall,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getPriorityBadge = (priority: CollectionReminder['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="error">Urgente</Badge>;
      case 'high':
        return <Badge variant="warning">Alta</Badge>;
      case 'medium':
        return <Badge variant="info">Média</Badge>;
      case 'low':
        return <Badge variant="neutral">Baixa</Badge>;
      default:
        return <Badge variant="neutral">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: CollectionReminder['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Resolvido</Badge>;
      case 'snoozed':
        return <Badge variant="warning">Adiado</Badge>;
      case 'canceled':
        return <Badge variant="neutral">Cancelado</Badge>;
      default:
        return <Badge variant="info">Pendente</Badge>;
    }
  };

  const isOverdue =
    reminder.status === 'pending' &&
    reminder.scheduledDate < new Date().toISOString().split('T')[0];

  const isToday =
    reminder.scheduledDate === new Date().toISOString().split('T')[0];

  return (
    <div
      id={`reminder-card-${reminder.id}`}
      className={`bg-white rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-xs p-4.5 ${
        reminder.status === 'completed'
          ? 'border-slate-200 bg-slate-50/50 opacity-75'
          : isOverdue
          ? 'border-amber-300/80 bg-amber-50/10'
          : isToday
          ? 'border-indigo-300/80 bg-indigo-50/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Topo: Prioridade + Data Agendada + Menu */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {getPriorityBadge(reminder.priority)}
          {getStatusBadge(reminder.status)}
          {isOverdue && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> Ação Atrasada
            </span>
          )}
          {isToday && reminder.status === 'pending' && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Para Hoje
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 relative">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {reminder.scheduledDate} {reminder.scheduledTime ? `às ${reminder.scheduledTime}` : ''}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-xs text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(reminder);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar lembrete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(reminder.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-rose-50 text-rose-600 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-2 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {reminder.title}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
            {reminder.reason}
          </p>
        </div>

        {/* Informações do Devedor e Fatura */}
        <div className="bg-slate-50/90 rounded-lg p-3 border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">
              {reminder.customerName}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600">
              {reminder.invoiceNumber ? (
                <span>Fatura: <strong>{reminder.invoiceNumber}</strong></span>
              ) : (
                <span>Dívida Acumulada</span>
              )}
            </span>
            {reminder.amount && (
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {formatCurrency(reminder.amount)}
              </span>
            )}
          </div>

          {reminder.customerPhone && (
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{reminder.customerPhone}</span>
            </div>
          )}

          {reminder.dueDate && (
            <div className="flex items-center gap-2 sm:justify-end text-slate-500 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Vencimento: {formatDate(reminder.dueDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botões de Ação Operacional */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {reminder.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => onGenerateMessage(reminder)}
                className="text-xs h-8 px-3 font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Gerar Mensagem
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onSnooze(reminder)}
                className="text-xs h-8 px-2.5 text-slate-600"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                Adiar
              </Button>
            </>
          )}

          {reminder.status === 'completed' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Concluído
            </span>
          )}
        </div>

        {reminder.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResolve(reminder.id)}
            className="text-xs h-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
            Marcar como Resolvido
          </Button>
        )}
      </div>
    </div>
  );
};
