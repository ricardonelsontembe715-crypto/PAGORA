import React, { useState } from 'react';
import { Invoice } from '../../types/database';
import { useInvoices } from '../../context/InvoiceContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/formatters';
import { AlertTriangle, Ban } from 'lucide-react';

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess?: () => void;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const { cancelInvoice } = useInvoices();
  const { showToast } = useNotifications();

  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCancel = async () => {
    setIsSubmitting(true);
    const res = await cancelInvoice(invoice.id, reason);
    setIsSubmitting(false);

    if (res.success) {
      showToast('Cobrança cancelada com sucesso.', 'info');
      onSuccess?.();
      onClose();
    } else {
      showToast(res.error || 'Erro ao cancelar cobrança.', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancelar esta cobrança?" size="md">
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Preservação de Histórico Fiscal</span>
          </div>
          <p>
            A cobrança <strong>{invoice.invoiceNumber}</strong> (no valor de{' '}
            <strong>{formatCurrency(invoice.amount)}</strong>) será marcada como cancelada e deixará de
            aparecer como valor em aberto nos seus indicadores.
          </p>
          <p className="text-amber-800/90">
            Os dados e o histórico de atividade serão mantidos integralmente para auditoria e a cobrança
            poderá ser reaberta se necessário.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo do cancelamento (opcional)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Anulação do serviço a pedido do cliente ou emissão de nota de crédito..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            loading={isSubmitting}
            onClick={handleCancel}
            leftIcon={<Ban className="w-4 h-4" />}
          >
            Confirmar cancelamento
          </Button>
        </div>
      </div>
    </Modal>
  );
};
