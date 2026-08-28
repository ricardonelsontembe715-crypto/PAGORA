import React, { useState, useEffect } from 'react';
import { Invoice, PaymentPromiseFormData } from '../../types/database';
import { useInvoices } from '../../context/InvoiceContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../lib/formatters';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface RecordPromiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess?: () => void;
}

export const RecordPromiseModal: React.FC<RecordPromiseModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const { recordPromise } = useInvoices();
  const { showToast } = useNotifications();

  const remainingBalance = Math.max(0, Math.round((invoice.amount - invoice.paidAmount) * 100) / 100);

  const [promisedDate, setPromisedDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      // Data padrão: 5 dias a contar de hoje
      const defaultDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      setPromisedDate(defaultDate.toISOString().split('T')[0]);
      setAmount(remainingBalance.toFixed(2));
      setNotes('');
    }
  }, [isOpen, invoice, remainingBalance]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (!promisedDate) {
      newErrors.promisedDate = 'Indique a data combinada com o cliente.';
    }

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Introduza um montante positivo válido.';
    } else if (numAmount > remainingBalance + 0.001) {
      newErrors.amount = `O valor prometido (${formatCurrency(numAmount)}) não pode ser superior ao saldo em aberto (${formatCurrency(remainingBalance)}).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const numAmount = parseFloat(amount.replace(',', '.'));

    const formData: PaymentPromiseFormData = {
      promisedDate,
      amount: numAmount,
      notes: notes.trim() || undefined,
    };

    const res = await recordPromise(invoice.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      showToast('Promessa de pagamento registada com sucesso!', 'success');
      onSuccess?.();
      onClose();
    } else {
      showToast(res.error || 'Erro ao registar a promessa.', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registar Promessa de Pagamento" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-800">
            <Clock className="w-4 h-4 text-amber-600" />
            Controlo de Compromissos
          </div>
          <p>
            Registe a data e o montante que o cliente combinou liquidar. Se o prazo expirar sem pagamento,
            a Pagora sinalizará a promessa como pendente de atenção.
          </p>
        </div>

        {/* Resumo da Cobrança */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-500">Saldo em aberto nesta cobrança:</span>
          <span className="font-bold text-slate-900">{formatCurrency(remainingBalance)}</span>
        </div>

        {/* Data Prometida e Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Data prometida"
              type="date"
              required
              value={promisedDate}
              onChange={(e) => {
                setPromisedDate(e.target.value);
                setErrors((prev) => ({ ...prev, promisedDate: '' }));
              }}
              error={errors.promisedDate}
              helperText="Data acordada com o cliente."
            />
          </div>

          <div>
            <Input
              label="Valor prometido (€)"
              type="text"
              required
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              placeholder="0,00"
              error={errors.amount}
            />
          </div>
        </div>

        {/* Observações / Contexto */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Contexto do contacto / Observações
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Falou com a D. Teresa por telefone. Informou que aguardava fecho de faturação no dia 25..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        {/* Ações do Rodapé */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            Guardar promessa
          </Button>
        </div>
      </form>
    </Modal>
  );
};
