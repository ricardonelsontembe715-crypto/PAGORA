import React, { useState } from 'react';
import { CollectionReminder, ReminderPriority } from '../../types/automations';
import { Customer, Invoice, MessageChannel, MessageTone } from '../../types/database';
import { Button } from '../ui/Button';
import {
  X,
  Calendar,
  Clock,
  User,
  Receipt,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  invoices: Invoice[];
  onSave: (data: Omit<CollectionReminder, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  initialData?: CollectionReminder;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  customers,
  invoices,
  onSave,
  initialData,
}) => {
  const [customerId, setCustomerId] = useState(initialData?.customerId || customers[0]?.id || '');
  const [invoiceId, setInvoiceId] = useState(initialData?.invoiceId || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [reason, setReason] = useState(initialData?.reason || '');
  const [priority, setPriority] = useState<ReminderPriority>(initialData?.priority || 'medium');
  const [scheduledDate, setScheduledDate] = useState(
    initialData?.scheduledDate || new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState(
    initialData?.scheduledTime || '09:30'
  );
  const [recommendedChannel, setRecommendedChannel] = useState<MessageChannel>(
    initialData?.recommendedChannel || 'whatsapp'
  );
  const [recommendedTone, setRecommendedTone] = useState<MessageTone>(
    initialData?.recommendedTone || 'cordial'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Faturas do cliente selecionado
  const customerInvoices = invoices.filter((i) => i.customerId === customerId && i.status !== 'paid' && i.status !== 'canceled');
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedInvoice = invoices.find((i) => i.id === invoiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Indique o título do lembrete.');
      return;
    }
    if (!customerId) {
      setError('Selecione o cliente associado.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        customerId,
        customerName: selectedCustomer?.name || 'Cliente',
        customerPhone: selectedCustomer?.phone,
        customerEmail: selectedCustomer?.email,
        invoiceId: invoiceId || undefined,
        invoiceNumber: selectedInvoice?.invoiceNumber,
        amount: selectedInvoice ? selectedInvoice.amount - selectedInvoice.paidAmount : undefined,
        dueDate: selectedInvoice?.dueDate,
        title,
        reason: reason || 'Lembrete operacional criado manualmente.',
        priority,
        scheduledDate,
        scheduledTime,
        recommendedAction: 'generate_message',
        recommendedChannel,
        recommendedTone,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar lembrete.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="reminder-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {initialData ? 'Editar Lembrete de Cobrança' : 'Novo Lembrete de Cobrança'}
              </h3>
              <p className="text-xs text-slate-500">
                Agende uma tarefa de acompanhamento para hoje ou dias futuros.
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cliente e Fatura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cliente <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setInvoiceId('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                <option value="">Selecione um cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Fatura Associada (Opcional)
              </label>
              <select
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              >
                <option value="">Geral / Sem fatura específica</option>
                {customerInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} ({(inv.amount - inv.paidAmount).toFixed(2)} €)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Título e Motivo */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Título do Lembrete <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Contacto prévio de regularização"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motivo e Notas de Acompanhamento
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Cliente solicitou contacto para envio de comprovativo via WhatsApp."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Data, Hora e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data do Lembrete
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hora
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ReminderPriority)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Canal e Tom Recomendados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Canal Recomendado
              </label>
              <select
                value={recommendedChannel}
                onChange={(e) => setRecommendedChannel(e.target.value as MessageChannel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="sms">SMS</option>
                <option value="in_person">Contacto Telefónico</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tom Sugerido
              </label>
              <select
                value={recommendedTone}
                onChange={(e) => setRecommendedTone(e.target.value as MessageTone)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              >
                <option value="cordial">Cordial (Amigável)</option>
                <option value="professional">Profissional (Padrão)</option>
                <option value="direct">Direto (Objetivo)</option>
                <option value="formal">Formal (Firme)</option>
              </select>
            </div>
          </div>

          {/* Rodapé */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : initialData ? 'Guardar Alterações' : 'Criar Lembrete'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
