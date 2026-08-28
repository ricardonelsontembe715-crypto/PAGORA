import React, { useState, useEffect } from 'react';
import { Customer, CustomerFormData, CustomerType } from '../../types/database';
import { useCustomers } from '../../context/CustomerContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { User, Building2, Mail, Phone, FileText, MapPin, Globe, AlertTriangle } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSuccess?: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSuccess,
}) => {
  const { createCustomer, updateCustomer, checkDuplicate } = useCustomers();
  const { showToast } = useNotifications();

  // Estados dos campos
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomerType>('company');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Portugal');
  const [notes, setNotes] = useState('');

  // Erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deteção de duplicados
  const [duplicateWarning, setDuplicateWarning] = useState<Customer | null>(null);
  const [confirmedDuplicateBypass, setConfirmedDuplicateBypass] = useState(false);

  // Inicialização quando abre ou muda customerToEdit
  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setName(customerToEdit.name || '');
        setType(customerToEdit.type || 'company');
        setEmail(customerToEdit.email || '');
        setPhone(customerToEdit.phone || '');
        setTaxId(customerToEdit.taxId || '');
        setAddress(customerToEdit.address || '');
        setCity(customerToEdit.city || '');
        setPostalCode(customerToEdit.postalCode || '');
        setCountry(customerToEdit.country || 'Portugal');
        setNotes(customerToEdit.notes || '');
      } else {
        setName('');
        setType('company');
        setEmail('');
        setPhone('');
        setTaxId('');
        setAddress('');
        setCity('');
        setPostalCode('');
        setCountry('Portugal');
        setNotes('');
      }
      setErrors({});
      setDuplicateWarning(null);
      setConfirmedDuplicateBypass(false);
    }
  }, [isOpen, customerToEdit]);

  // Validação em tempo real
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'O nome do cliente é obrigatório.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'O nome deve conter pelo menos 2 caracteres.';
    } else if (name.length > 150) {
      newErrors.name = 'O nome não deve exceder 150 caracteres.';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Endereço de e-mail inválido.';
      }
    }

    if (phone.trim()) {
      const phoneDigits = phone.replace(/[\s\-\+\(\)]/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        newErrors.phone = 'Número de telefone/telemóvel inválido.';
      }
    }

    if (taxId.trim()) {
      const cleanTax = taxId.replace(/\s+/g, '');
      if (cleanTax.length < 6 || cleanTax.length > 20) {
        newErrors.taxId = 'Formato de NIF/identificador fiscal inválido.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, forceBypass = false) => {
    e.preventDefault();
    if (!validate()) return;

    // Verificação de duplicação caso não tenha sido ignorada
    if (!confirmedDuplicateBypass && !forceBypass) {
      const dup = checkDuplicate(
        { name, email: email || undefined, taxId: taxId || undefined },
        customerToEdit?.id
      );
      if (dup) {
        setDuplicateWarning(dup);
        return;
      }
    }

    setIsSubmitting(true);

    const formData: CustomerFormData = {
      name: name.trim(),
      type,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      country: country.trim() || 'Portugal',
      notes: notes.trim() || undefined,
    };

    if (customerToEdit) {
      const res = await updateCustomer(customerToEdit.id, formData);
      setIsSubmitting(false);

      if (res.success && res.customer) {
        showToast({
          type: 'success',
          title: 'Dados do cliente atualizados.',
          message: `As informações de ${res.customer.name} foram atualizadas com sucesso.`,
        });
        onSuccess?.(res.customer);
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Não foi possível concluir esta ação.',
          message: res.error || 'Tente novamente.',
        });
      }
    } else {
      const res = await createCustomer(formData);
      setIsSubmitting(false);

      if (res.success && res.customer) {
        showToast({
          type: 'success',
          title: 'Cliente adicionado com sucesso.',
          message: `${res.customer.name} foi adicionado à sua lista de clientes.`,
        });
        onSuccess?.(res.customer);
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Não foi possível concluir esta ação.',
          message: res.error || 'Tente novamente.',
        });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Editar dados do cliente' : 'Adicionar novo cliente'}
      description={
        customerToEdit
          ? 'Atualize os dados de contacto, endereço e identificação fiscal.'
          : 'Registe as informações essenciais para gerir cobranças e comunicações.'
      }
      maxWidth="lg"
    >
      <form onSubmit={(e) => handleSubmit(e)} className="p-6 space-y-6">
        {/* Aviso de Duplicação Potencial */}
        {duplicateWarning && !confirmedDuplicateBypass && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-900">
                  Aviso: Já existe um cliente com dados semelhantes
                </span>
                <p className="text-amber-800 mt-0.5">
                  Foi encontrado o cliente <strong>&ldquo;{duplicateWarning.name}&rdquo;</strong>{' '}
                  {duplicateWarning.email ? `(${duplicateWarning.email})` : ''} com nome, e-mail ou
                  NIF idêntico nesta conta.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDuplicateWarning(null)}
              >
                Rever dados
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  setConfirmedDuplicateBypass(true);
                  setDuplicateWarning(null);
                  handleSubmit(e, true);
                }}
              >
                Continuar de qualquer forma
              </Button>
            </div>
          </div>
        )}

        {/* Secção 1: Informações Principais */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span>Informações principais</span>
          </div>

          {/* Tipo de Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de cliente <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('company')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  type === 'company'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Empresa / Entidade</span>
              </button>

              <button
                type="button"
                onClick={() => setType('person')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  type === 'person'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span>Pessoa Individual</span>
              </button>
            </div>
          </div>

          {/* Nome */}
          <Input
            label={type === 'company' ? 'Nome da empresa' : 'Nome completo'}
            type="text"
            placeholder={type === 'company' ? 'Ex: Vanguard Solutions Lda' : 'Ex: Dra. Mariana Costa'}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            required
          />

          {/* Contactos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Endereço de e-mail"
              type="email"
              placeholder="exemplo@cliente.pt"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Utilizado no envio automático de avisos e faturas."
            />

            <Input
              label="Telemóvel / Telefone"
              type="tel"
              placeholder="Ex: 912 345 678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              error={errors.phone}
              leftIcon={<Phone className="w-4 h-4" />}
              helperText="Contacto direto para mensagens e lembretes."
            />
          </div>
        </div>

        {/* Secção 2: Informações Adicionais */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Informações fiscais e localização</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="NIF / Identificação Fiscal"
              type="text"
              placeholder="Ex: 508 123 456"
              value={taxId}
              onChange={(e) => {
                setTaxId(e.target.value);
                if (errors.taxId) setErrors((prev) => ({ ...prev, taxId: '' }));
              }}
              error={errors.taxId}
              leftIcon={<FileText className="w-4 h-4" />}
            />

            <Input
              label="País"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              leftIcon={<Globe className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Morada / Sede"
            type="text"
            placeholder="Ex: Av. da Liberdade 100, 3º Dto"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cidade"
              type="text"
              placeholder="Ex: Lisboa"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <Input
              label="Código postal"
              type="text"
              placeholder="Ex: 1250-001"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notas internas (opcional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações confidenciais sobre acordos, preferências de pagamento ou histórico de relacionamento..."
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            {customerToEdit ? 'Guardar alterações' : 'Adicionar cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
