import React, { useState, useEffect } from 'react';
import { Invoice, InvoicePaymentFormData, PaymentMethod } from '../../types/database';
import { useInvoices } from '../../context/InvoiceContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const { recordPayment } = useInvoices();
  const { showToast } = useNotifications();

  const remainingBalance = Math.max(0, Math.round((invoice.amount - invoice.paidAmount) * 100) / 100);

  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setAmount(remainingBalance.toFixed(2));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setMethod((invoice.paymentMethod as PaymentMethod) || 'bank_transfer');
      setReference('');
      setNotes('');
    }
  }, [isOpen, invoice, remainingBalance]);

  const fillFullAmount = () => {
    setAmount(remainingBalance.toFixed(2));
    setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Introduza um montante positivo válido.';
    } else if (numAmount > remainingBalance + 0.001) {
      newErrors.amount = `O valor indicado (${formatCurrency(numAmount)}) é superior ao saldo em aberto (${formatCurrency(remainingBalance)}).`;
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'A data do recebimento é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const numAmount = parseFloat(amount.replace(',', '.'));

    const formData: InvoicePaymentFormData = {
      amount: numAmount,
      paymentDate,
      method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const res = await recordPayment(invoice.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      showToast(
        numAmount >= remainingBalance - 0.001
          ? 'Cobrança liquidada na totalidade!'
          : 'Pagamento parcial registado com sucesso!',
        'success'
      );
      onSuccess?.();
      onClose();
    } else {
      showToast(res.error || 'Erro ao registar o pagamento.', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registar Pagamento" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumo da Cobrança */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Cobrança:</span>
            <span className="font-semibold text-slate-900">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Valor total da fatura:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(invoice.amount)}</span>
          </div>
          {invoice.paidAmount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Já recebido anteriormente:</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(invoice.paidAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200 font-medium">
            <span className="text-slate-700">Saldo em aberto:</span>
            <span className="text-indigo-600 font-bold text-sm">
              {formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>

        {/* Campo do Valor */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Valor recebido (€) <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={fillFullAmount}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Liquidar totalidade ({formatCurrency(remainingBalance)})
            </button>
          </div>
          <Input
            required
            type="text"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErrors((prev) => ({ ...prev, amount: '' }));
            }}
            placeholder="0,00"
            error={errors.amount}
            helperText="Pode registar o valor total ou uma amortização parcial."
          />
        </div>

        {/* Data e Método */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Data do pagamento"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => {
                setPaymentDate(e.target.value);
                setErrors((prev) => ({ ...prev, paymentDate: '' }));
              }}
              error={errors.paymentDate}
            />
          </div>

          <div>
            <Select
              label="Método de liquidação"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              options={[
                { value: 'bank_transfer', label: 'Transferência bancária' },
                { value: 'mbway', label: 'MB WAY' },
                { value: 'multibanco', label: 'Multibanco' },
                { value: 'card', label: 'Cartão' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'cash', label: 'Numerário / Outro' },
              ]}
            />
          </div>
        </div>

        {/* Referência da Transação */}
        <div>
          <Input
            label="Comprovativo / Referência da transação"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ex: TRF-BPI-88910 ou ID do recibo"
            helperText="Opcional. Ajuda na reconciliação contabilística."
          />
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observações adicionais
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Pagamento confirmado por extrato bancário emitido às 15:30..."
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
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirmar pagamento
          </Button>
        </div>
      </form>
    </Modal>
  );
};
