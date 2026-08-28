import React, { useState } from 'react';
import {
  Automation,
  AutomationTriggerType,
  AutomationCondition,
  AutomationAction,
  AutomationSettings,
  ReminderPriority,
} from '../../types/automations';
import { MessageChannel, MessageTone, MessageCategory } from '../../types/database';
import { Button } from '../ui/Button';
import {
  X,
  Zap,
  Plus,
  Trash2,
  Clock,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Automation, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failedCount'>) => Promise<void>;
  initialData?: Automation;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<Automation['status']>(initialData?.status || 'active');
  const [category, setCategory] = useState<Automation['category']>(initialData?.category || 'preventive');

  // Gatilho
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(
    initialData?.trigger.type || 'invoice_near_due'
  );
  const [triggerDaysOffset, setTriggerDaysOffset] = useState<number>(
    initialData?.trigger.daysOffset ?? 3
  );
  const [triggerThreshold, setTriggerThreshold] = useState<number>(
    initialData?.trigger.thresholdValue ?? 1000
  );

  // Condições
  const [conditionLogic, setConditionLogic] = useState<'all' | 'any'>(
    initialData?.conditionLogic || 'all'
  );
  const [conditions, setConditions] = useState<AutomationCondition[]>(
    initialData?.conditions || [
      {
        id: 'cond_1',
        field: 'invoice_status',
        operator: 'equals',
        value: 'pending',
      },
    ]
  );

  // Ações
  const [actionTitle, setActionTitle] = useState<string>(
    initialData?.actions[0]?.config.title || 'Lembrete de Cobrança'
  );
  const [actionReason, setActionReason] = useState<string>(
    initialData?.actions[0]?.config.reason || 'Acompanhamento preventivo de fatura.'
  );
  const [actionPriority, setActionPriority] = useState<ReminderPriority>(
    initialData?.actions[0]?.config.priority || 'medium'
  );
  const [actionChannel, setActionChannel] = useState<MessageChannel>(
    initialData?.actions[0]?.config.channel || 'whatsapp'
  );
  const [actionTone, setActionTone] = useState<MessageTone>(
    initialData?.actions[0]?.config.tone || 'cordial'
  );
  const [sendNotification, setSendNotification] = useState<boolean>(
    initialData?.actions.some((a) => a.type === 'send_system_notification') ?? false
  );

  // Definições inteligentes
  const [preferredTime, setPreferredTime] = useState<string>(
    initialData?.settings?.preferredTime || '09:30'
  );
  const [stopOnPayment, setStopOnPayment] = useState<boolean>(
    initialData?.settings?.stopOnPayment ?? true
  );
  const [stopOnPromise, setStopOnPromise] = useState<boolean>(
    initialData?.settings?.stopOnPromise ?? true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    const newCond: AutomationCondition = {
      id: `cond_${Date.now()}`,
      field: 'invoice_amount',
      operator: 'greater_than',
      value: 100,
    };
    setConditions([...conditions, newCond]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, updates: Partial<AutomationCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, indique um nome para a regra de automação.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const actions: AutomationAction[] = [
        {
          id: `act_main_${Date.now()}`,
          type: 'create_reminder',
          config: {
            title: actionTitle,
            reason: actionReason,
            priority: actionPriority,
            channel: actionChannel,
            tone: actionTone,
            category: 'before_due',
            scheduledTime: preferredTime,
          },
        },
      ];

      if (sendNotification) {
        actions.push({
          id: `act_notif_${Date.now()}`,
          type: 'send_system_notification',
          config: {
            title: name,
            notificationText: `Alerta automático: ${actionReason}`,
            priority: actionPriority,
          },
        });
      }

      await onSave({
        name,
        description: description || actionReason,
        status,
        category,
        trigger: {
          type: triggerType,
          daysOffset: ['invoice_near_due', 'invoice_overdue_days'].includes(triggerType)
            ? Number(triggerDaysOffset)
            : undefined,
          thresholdValue: triggerType === 'customer_debt_exceeded' ? Number(triggerThreshold) : undefined,
        },
        conditions,
        conditionLogic,
        actions,
        settings: {
          preferredTime,
          respectBusinessHours: true,
          daysOfWeek: [1, 2, 3, 4, 5],
          stopOnPayment,
          stopOnPromise,
          maxReminders: 5,
        },
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar regra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="automation-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialData ? 'Editar Regra de Automação' : 'Criar Nova Regra de Automação'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure os gatilhos, condições e lembretes a preparar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Identificação */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600">
              1. Identificação da Regra
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome da Regra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aviso Preventivo (3 dias antes)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Automation['category'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="preventive">Preventiva (Antes do vencimento)</option>
                  <option value="due_date">No Vencimento</option>
                  <option value="overdue">Cobrança em Atraso</option>
                  <option value="promises">Promessas de Pagamento</option>
                  <option value="customers">Gestão de Risco do Cliente</option>
                  <option value="custom">Personalizada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Descrição e Motivo Operacional
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Prepara lembrete cordial antes da data de liquidação da fatura."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. QUANDO (Gatilho) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              2. Quando (Gatilho de Disparo)
            </h3>

            <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl space-y-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Evento Disparador
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <optgroup label="Cobranças e Vencimentos">
                    <option value="invoice_near_due">Cobrança próxima do vencimento (X dias antes)</option>
                    <option value="invoice_due_today">Cobrança vence hoje</option>
                    <option value="invoice_overdue_days">Cobrança vencida há X dias</option>
                    <option value="invoice_overdue">Cobrança entra em atraso</option>
                    <option value="invoice_partially_paid">Pagamento parcial registado</option>
                    <option value="invoice_created">Nova cobrança emitida</option>
                  </optgroup>
                  <optgroup label="Promessas e Acordos">
                    <option value="promise_due_today">Promessa de pagamento vence hoje</option>
                    <option value="promise_broken">Promessa de pagamento não cumprida (Quebrada)</option>
                  </optgroup>
                  <optgroup label="Gestão de Clientes e Risco">
                    <option value="customer_debt_exceeded">Cliente ultrapassa determinado valor em dívida</option>
                  </optgroup>
                </select>
              </div>

              {triggerType === 'invoice_near_due' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Disparar exatamente</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={triggerDaysOffset}
                    onChange={(e) => setTriggerDaysOffset(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold"
                  />
                  <span className="text-slate-600">dias antes do vencimento da fatura.</span>
                </div>
              )}

              {triggerType === 'invoice_overdue_days' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Disparar quando estiver há</span>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={triggerDaysOffset}
                    onChange={(e) => setTriggerDaysOffset(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold"
                  />
                  <span className="text-slate-600">dias em atraso.</span>
                </div>
              )}

              {triggerType === 'customer_debt_exceeded' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Disparar quando a dívida ultrapassar</span>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={triggerThreshold}
                    onChange={(e) => setTriggerThreshold(Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-center font-bold"
                  />
                  <span className="text-slate-600">€ em aberto.</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. SE (Condições) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                3. Se (Condições Verificadas)
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Combinar com:</span>
                <select
                  value={conditionLogic}
                  onChange={(e) => setConditionLogic(e.target.value as 'all' | 'any')}
                  className="px-2 py-1 border border-slate-300 rounded bg-white font-semibold text-slate-700 text-xs"
                >
                  <option value="all">TODAS verdadeiras (E)</option>
                  <option value="any">PELO MENOS UMA (OU)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80"
                >
                  <select
                    value={cond.field}
                    onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value as AutomationCondition['field'] })}
                    className="px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium text-slate-700 flex-1"
                  >
                    <option value="invoice_status">Estado da cobrança</option>
                    <option value="invoice_amount">Valor da cobrança (€)</option>
                    <option value="customer_has_broken_promise">Cliente tem promessa quebrada</option>
                    <option value="customer_multiple_overdue">Cliente tem múltiplas faturas vencidas</option>
                    <option value="customer_total_debt">Total em dívida do cliente (€)</option>
                    <option value="has_payment_link">Link de pagamento disponível</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => handleUpdateCondition(cond.id, { operator: e.target.value as AutomationCondition['operator'] })}
                    className="px-2 py-1.5 border border-slate-300 rounded bg-white text-xs text-slate-700"
                  >
                    <option value="equals">é igual a</option>
                    <option value="not_equals">é diferente de</option>
                    <option value="greater_than">maior que (&gt;)</option>
                    <option value="less_than">menor que (&lt;)</option>
                    <option value="is_true">é verdadeiro</option>
                    <option value="is_false">é falso</option>
                  </select>

                  {cond.field === 'invoice_status' && (
                    <select
                      value={String(cond.value)}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                      className="px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="pending">Em aberto</option>
                      <option value="overdue">Em atraso</option>
                      <option value="partially_paid">Parcialmente paga</option>
                    </select>
                  )}

                  {(cond.field === 'invoice_amount' || cond.field === 'customer_total_debt') && (
                    <input
                      type="number"
                      value={Number(cond.value)}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: Number(e.target.value) })}
                      className="w-24 px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-bold"
                    />
                  )}

                  {['customer_has_broken_promise', 'customer_multiple_overdue', 'has_payment_link'].includes(cond.field) && (
                    <span className="px-2 py-1 text-slate-500 font-medium">Sim</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Remover condição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCondition}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar outra condição
              </button>
            </div>
          </div>

          {/* 4. ENTÃO (Ações & Preparação) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              4. Então (Ação Operacional a Criar)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título do Lembrete
                </label>
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prioridade Operacional
                </label>
                <select
                  value={actionPriority}
                  onChange={(e) => setActionPriority(e.target.value as ReminderPriority)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                >
                  <option value="low">Baixa (Preventiva)</option>
                  <option value="medium">Média (Acompanhamento)</option>
                  <option value="high">Alta (Vencimento / Atraso)</option>
                  <option value="urgent">Urgente (Crítico / Promessa Quebrada)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Canal Sugerido
                </label>
                <select
                  value={actionChannel}
                  onChange={(e) => setActionChannel(e.target.value as MessageChannel)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">E-mail</option>
                  <option value="sms">SMS</option>
                  <option value="in_person">Contacto Telefónico / Presencial</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tom Recomendado da Mensagem
                </label>
                <select
                  value={actionTone}
                  onChange={(e) => setActionTone(e.target.value as MessageTone)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="cordial">Cordial (Amigável)</option>
                  <option value="professional">Profissional (Padrão)</option>
                  <option value="direct">Direto (Objetivo)</option>
                  <option value="formal">Formal (Firme)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="sendNotif"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <label htmlFor="sendNotif" className="text-slate-700 font-medium cursor-pointer">
                Enviar também notificação interna de alerta no sino da PAGORA
              </label>
            </div>
          </div>

          {/* 5. Definições Inteligentes */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              5. Horários Inteligentes e Proteções
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Horário Preferencial de Agendamento
                </label>
                <input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Evita horários noturnos e fins de semana.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="stopPay"
                    checked={stopOnPayment}
                    onChange={(e) => setStopOnPayment(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <label htmlFor="stopPay" className="text-slate-700 font-medium cursor-pointer">
                    Cancelar lembretes automaticamente se o cliente pagar
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="stopProm"
                    checked={stopOnPromise}
                    onChange={(e) => setStopOnPromise(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <label htmlFor="stopProm" className="text-slate-700 font-medium cursor-pointer">
                    Pausar cobrança se existir promessa de pagamento ativa
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : initialData ? 'Guardar Alterações' : 'Criar Automação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
