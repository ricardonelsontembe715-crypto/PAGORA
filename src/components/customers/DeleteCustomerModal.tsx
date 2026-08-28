import React, { useState } from 'react';
import { Customer } from '../../types/database';
import { useCustomers } from '../../context/CustomerContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, ShieldAlert, Archive } from 'lucide-react';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess?: () => void;
  onOpenArchiveInstead?: () => void;
}

export const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
  onOpenArchiveInstead,
}) => {
  const { deleteCustomer, getCustomerInvoices } = useCustomers();
  const { showToast } = useNotifications();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!customer) return null;

  const invoices = getCustomerInvoices(customer.id);
  const hasInvoices = invoices.length > 0;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const res = await deleteCustomer(customer.id);
    setIsDeleting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Cliente eliminado',
        message: `O registo de ${customer.name} foi removido com sucesso.`,
      });
      onSuccess?.();
      onClose();
    } else {
      showToast({
        type: 'error',
        title: 'Não foi possível eliminar',
        message: res.error || 'Não é possível eliminar clientes com histórico fiscal.',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminação de cliente"
      description="Política de integridade de dados e conformidade fiscal."
      maxWidth="sm"
    >
      <div className="p-6 space-y-4">
        {hasInvoices ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">
                  Eliminação bloqueada por proteção fiscal
                </span>
                <p className="text-rose-900 mt-1 leading-relaxed">
                  O cliente <strong>{customer.name}</strong> possui{' '}
                  <strong>{invoices.length} cobrança(s)/fatura(s)</strong> registadas no sistema.
                  Para preservar a rastreabilidade financeira e o histórico contabilístico, a
                  eliminação definitiva está desativada.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Em vez de eliminar, pode <strong>arquivar o cliente</strong>. O cliente deixará de ser
              apresentado nas listas ativas sem quebrar a integridade das suas faturas.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Fechar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenArchiveInstead?.();
                }}
                leftIcon={<Archive className="w-3.5 h-3.5" />}
              >
                Arquivar em vez de eliminar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold text-amber-950">Pretende eliminar este registo?</span>
                <p className="mt-1">
                  O cliente <strong>{customer.name}</strong> não possui faturas associadas. Esta
                  ação removerá definitivamente os dados e o histórico do cliente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Eliminar definitivamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
