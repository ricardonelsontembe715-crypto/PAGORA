import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Invoice, InvoiceFormData, PaymentMethod } from '../../types/database';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { isValidUrl } from '../../lib/formatters';
import {
  Receipt,
  User,
  Plus,
  Calendar,
  CreditCard,
  Link as LinkIcon,
  FileText,
  AlertCircle,
  Search,
  Building2,
} from 'lucide-react';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice;
  preselectedCustomerId?: string;
  onSuccess?: (invoice: Invoice) => void;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  preselectedCustomerId,
  onSuccess,
}) => {
  const { customers, getCustomerById } = useCustomers();
  const { createInvoice, updateInvoice, generateInvoiceNumber, checkInvoiceNumberUnique } = useInvoices();
  const { showToast } = useNotifications();

  // Estados do formulário
  const [customerId, setCustomerId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Estados auxiliares
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inicialização das datas e valores
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (invoiceToEdit) {
        setCustomerId(invoiceToEdit.customerId);
        setInvoiceNumber(invoiceToEdit.invoiceNumber);
        setDescription(invoiceToEdit.description || '');
        setAmount(invoiceToEdit.amount.toString());
        setIssueDate(invoiceToEdit.issueDate);
        setDueDate(invoiceToEdit.dueDate);
        setPaymentMethod(invoiceToEdit.paymentMethod || 'bank_transfer');
        setPaymentLink(invoiceToEdit.paymentLink || '');
        setNotes(invoiceToEdit.notes || '');
      } else {
        const today = new Date();
        const issueStr = today.toISOString().split('T')[0];
        
        // Vencimento predefinido a 15 dias
        const defaultDue = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        const dueStr = defaultDue.toISOString().split('T')[0];

        setCustomerId(preselectedCustomerId || '');
        setInvoiceNumber(generateInvoiceNumber());
        setDescription('');
        setAmount('');
        setIssueDate(issueStr);
        setDueDate(dueStr);
        setPaymentMethod('bank_transfer');
        setPaymentLink('');
        setNotes('');
      }
    }
  }, [isOpen, invoiceToEdit, preselectedCustomerId, generateInvoiceNumber]);

  // Lista filtrada de clientes para o seletor com pesquisa
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const query = customerSearchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.taxId && c.taxId.includes(query))
    );
  }, [customers, customerSearchQuery]);

  const selectedCustomer = useMemo(() => {
    if (!customerId) return undefined;
    return getCustomerById(customerId);
  }, [customerId, getCustomerById]);

  // Validação do formulário
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerId) {
      newErrors.customerId = 'Selecione um cliente para associar à cobrança.';
    }

    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'A referência da cobrança é obrigatória.';
    } else if (!checkInvoiceNumberUnique(invoiceNumber, invoiceToEdit?.id)) {
      newErrors.invoiceNumber = 'Esta referência já se encontra registada nesta conta.';
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Introduza um montante positivo válido.';
    }

    if (!issueDate) {
      newErrors.issueDate = 'A data de emissão é obrigatória.';
    }

    if (!dueDate) {
      newErrors.dueDate = 'A data de vencimento é obrigatória.';
    }

    if (issueDate && dueDate && new Date(dueDate) < new Date(issueDate)) {
      newErrors.dueDate = 'A data de vencimento não pode ser anterior à data de emissão.';
    }

    if (paymentLink.trim() && !isValidUrl(paymentLink.trim())) {
      newErrors.paymentLink = 'Introduza um URL válido (ex: https://mbway.pt/pay/...).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const numAmount = parseFloat(amount.replace(',', '.'));

    const formData: InvoiceFormData = {
      customerId,
      invoiceNumber: invoiceNumber.trim(),
      description: description.trim() || undefined,
      amount: numAmount,
      issueDate,
      dueDate,
      paymentMethod,
      paymentLink: paymentLink.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (invoiceToEdit) {
      const res = await updateInvoice(invoiceToEdit.id, formData);
      setIsSubmitting(false);
      if (res.success && res.invoice) {
        showToast('Cobrança atualizada com sucesso!', 'success');
        onSuccess?.(res.invoice);
        onClose();
      } else {
        showToast(res.error || 'Erro ao atualizar cobrança.', 'error');
      }
    } else {
      const res = await createInvoice(formData);
      setIsSubmitting(false);
      if (res.success && res.invoice) {
        showToast('Cobrança registada com sucesso!', 'success');
        onSuccess?.(res.invoice);
        onClose();
      } else {
        showToast(res.error || 'Erro ao registar cobrança.', 'error');
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={invoiceToEdit ? 'Editar Cobrança' : 'Nova Cobrança'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seletor de Cliente */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Cliente <span className="text-rose-500">*</span>
            </label>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-xs">
                    {selectedCustomer.type === 'company' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{selectedCustomer.name}</div>
                    <div className="text-xs text-slate-500">
                      {selectedCustomer.email || selectedCustomer.phone || selectedCustomer.taxId || 'Sem contactos'}
                    </div>
                  </div>
                </div>

                {!invoiceToEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomerId('');
                      setIsCustomerDropdownOpen(true);
                    }}
                  >
                    Alterar
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar cliente por nome, e-mail ou NIF..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewCustomerModalOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Novo cliente
                  </Button>
                </div>

                {/* Dropdown com resultados da pesquisa */}
                {isCustomerDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            setCustomerId(cust.id);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearchQuery('');
                            setErrors((prev) => ({ ...prev, customerId: '' }));
                          }}
                          className="w-full text-left p-2.5 hover:bg-indigo-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
                              {cust.type === 'company' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{cust.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {cust.taxId ? `NIF: ${cust.taxId}` : cust.email || 'Cliente ativo'}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-indigo-600 font-medium">Selecionar</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500">
                        Nenhum cliente encontrado.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomerDropdownOpen(false);
                            setIsNewCustomerModalOpen(true);
                          }}
                          className="text-indigo-600 font-medium hover:underline ml-1"
                        >
                          Criar novo cliente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {errors.customerId && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.customerId}
              </p>
            )}
          </div>

          {/* Referência e Montante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Referência da cobrança"
                required
                value={invoiceNumber}
                onChange={(e) => {
                  setInvoiceNumber(e.target.value);
                  setErrors((prev) => ({ ...prev, invoiceNumber: '' }));
                }}
                placeholder="Ex: PG-2026-0001"
                error={errors.invoiceNumber}
                helperText="Identificador único dentro da sua conta."
              />
            </div>

            <div>
              <Input
                label="Valor a receber (€)"
                required
                type="text"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="0,00"
                error={errors.amount}
                helperText="Montante total da fatura / cobrança."
              />
            </div>
          </div>

          {/* Descrição do Serviço / Produto */}
          <div>
            <Input
              label="Descrição do serviço ou fornecimento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Consultoria de estratégia e marketing - Agosto 2026"
              helperText="Breve resumo para identificar o objetivo da cobrança."
            />
          </div>

          {/* Datas de Emissão e Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Data de emissão"
                type="date"
                required
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  setErrors((prev) => ({ ...prev, issueDate: '', dueDate: '' }));
                }}
                error={errors.issueDate}
              />
            </div>

            <div>
              <Input
                label="Data de vencimento"
                type="date"
                required
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setErrors((prev) => ({ ...prev, dueDate: '' }));
                }}
                error={errors.dueDate}
                helperText="Prazo limite para a regularização."
              />
            </div>
          </div>

          {/* Método de Pagamento e Link Opcional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Select
                label="Método de pagamento sugerido"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'bank_transfer', label: 'Transferência bancária' },
                  { value: 'mbway', label: 'MB WAY' },
                  { value: 'multibanco', label: 'Multibanco' },
                  { value: 'card', label: 'Cartão de crédito / débito' },
                  { value: 'paypal', label: 'PayPal' },
                  { value: 'cash', label: 'Numerário / Outro' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Link de pagamento (opcional)"
                type="url"
                value={paymentLink}
                onChange={(e) => {
                  setPaymentLink(e.target.value);
                  setErrors((prev) => ({ ...prev, paymentLink: '' }));
                }}
                placeholder="https://..."
                error={errors.paymentLink}
                helperText="Link para checkout externo (ex: Stripe, MB WAY, Ifthenpay)."
              />
            </div>
          </div>

          {/* Notas Internas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas internas (confidenciais)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas para a sua equipa sobre acordos, condições de entrega ou histórico..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          {/* Ações do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              leftIcon={<Receipt className="w-4 h-4" />}
            >
              {invoiceToEdit ? 'Guardar alterações' : 'Registar cobrança'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal integrado de criação rápida de cliente */}
      {isNewCustomerModalOpen && (
        <CustomerFormModal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          onSuccess={(newCustomer: Customer) => {
            setCustomerId(newCustomer.id);
            setIsNewCustomerModalOpen(false);
            setErrors((prev) => ({ ...prev, customerId: '' }));
            showToast(`Cliente ${newCustomer.name} adicionado e selecionado!`, 'success');
          }}
        />
      )}
    </>
  );
};
