import React, { useState } from 'react';
import { Customer } from '../../types/database';
import { useCustomers } from '../../context/CustomerContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Archive, AlertCircle } from 'lucide-react';

interface ArchiveCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess?: () => void;
}

export const ArchiveCustomerModal: React.FC<ArchiveCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { archiveCustomer } = useCustomers();
  const { showToast } = useNotifications();
  const [isArchiving, setIsArchiving] = useState(false);

  if (!customer) return null;

  const handleConfirmArchive = async () => {
    setIsArchiving(true);
    const res = await archiveCustomer(customer.id);
    setIsArchiving(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Cliente arquivado.',
        message: `${customer.name} foi movido para os clientes arquivados.`,
      });
      onSuccess?.();
      onClose();
    } else {
      showToast({
        type: 'error',
        title: 'Não foi possível concluir esta ação.',
        message: res.error || 'Tente novamente.',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arquivar este cliente?"
      description="Os dados serão mantidos e poderá restaurá-los mais tarde."
      maxWidth="sm"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200/80">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{customer.name}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {customer.email || customer.phone || customer.taxId || 'Registo de cliente'}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Ao arquivar este cliente, ele deixará de surgir na lista principal de clientes ativos.
          Todo o histórico de faturas, contactos e notas será preservado e pode ser restaurado a qualquer momento no filtro de arquivados.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isArchiving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirmArchive}
            isLoading={isArchiving}
            leftIcon={<Archive className="w-3.5 h-3.5" />}
          >
            Arquivar cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
};
