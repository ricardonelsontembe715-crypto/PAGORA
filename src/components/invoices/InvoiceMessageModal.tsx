import React from 'react';
import { Customer, Invoice } from '../../types/database';
import { MessageGeneratorModal } from '../messages/MessageGeneratorModal';

interface InvoiceMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  customer?: Customer;
}

export const InvoiceMessageModal: React.FC<InvoiceMessageModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
}) => {
  return (
    <MessageGeneratorModal
      isOpen={isOpen}
      onClose={onClose}
      preselectedCustomerId={customer?.id || invoice.customerId}
      preselectedInvoiceId={invoice.id}
    />
  );
};
