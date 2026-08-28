import React, { useState, useEffect } from 'react';
import {
  MessageTemplate,
  MessageCategory,
  MessageChannel,
  MessageTone,
  MessageIntent,
} from '../../types/database';
import { useMessages } from '../../context/MessageContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tag, Sparkles, AlertCircle } from 'lucide-react';

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: MessageTemplate | null;
  onSaved?: () => void;
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSaved,
}) => {
  const { createTemplate, updateTemplate } = useMessages();
  const { showToast } = useNotifications();

  const isEditing = Boolean(templateToEdit && !templateToEdit.isDefault);

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<MessageCategory>('cordial_reminder');
  const [channel, setChannel] = useState<MessageChannel>('whatsapp');
  const [tone, setTone] = useState<MessageTone>('cordial');
  const [intent, setIntent] = useState<MessageIntent>('remind');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (templateToEdit) {
      setTitle(templateToEdit.title);
      setCategory(templateToEdit.category);
      setChannel(templateToEdit.channel);
      setTone(templateToEdit.tone);
      setIntent(templateToEdit.intent);
      setSubject(templateToEdit.subject || '');
      setContent(templateToEdit.content);
    } else {
      setTitle('');
      setCategory('cordial_reminder');
      setChannel('whatsapp');
      setTone('cordial');
      setIntent('remind');
      setSubject('');
      setContent('');
    }
    setErrorMessage(null);
  }, [templateToEdit, isOpen]);

  // Inserir tag de variável no cursor / final do texto
  const insertVariableTag = (tag: string) => {
    setContent((prev) => `${prev} {{${tag}}}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Por favor, indique um título para o modelo.');
      return;
    }

    if (!content.trim()) {
      setErrorMessage('O conteúdo da mensagem não pode estar vazio.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && templateToEdit) {
        const res = await updateTemplate(templateToEdit.id, {
          title: title.trim(),
          category,
          channel,
          tone,
          intent,
          subject: channel === 'email' ? subject.trim() : undefined,
          content: content.trim(),
        });

        if (res.success) {
          showToast('Modelo atualizado com sucesso!', 'success');
          if (onSaved) onSaved();
          onClose();
        } else {
          setErrorMessage(res.error || 'Erro ao atualizar modelo.');
        }
      } else {
        const res = await createTemplate({
          title: title.trim(),
          category,
          channel,
          tone,
          intent,
          subject: channel === 'email' ? subject.trim() : undefined,
          content: content.trim(),
        });

        if (res.success) {
          showToast('Novo modelo personalizado criado com sucesso!', 'success');
          if (onSaved) onSaved();
          onClose();
        } else {
          setErrorMessage(res.error || 'Erro ao criar modelo.');
        }
      }
    } catch {
      setErrorMessage('Ocorreu um erro inesperado ao guardar o modelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableVariables = [
    { tag: 'nome', label: 'Nome do cliente' },
    { tag: 'empresa', label: 'Empresa do cliente' },
    { tag: 'valor', label: 'Valor total' },
    { tag: 'saldo', label: 'Saldo em aberto' },
    { tag: 'vencimento', label: 'Data de vencimento' },
    { tag: 'dias_atraso', label: 'Dias de atraso' },
    { tag: 'referencia', label: 'Referência da fatura' },
    { tag: 'link_pagamento', label: 'Link de pagamento' },
    { tag: 'metodo_pagamento', label: 'Método de pagamento' },
    { tag: 'data_prometida', label: 'Data de promessa' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Modelo de Mensagem' : 'Novo Modelo Personalizado'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Título do Modelo *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Lembrete Especial para Clientes VIP"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Canal</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as MessageChannel)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">E-mail</option>
              <option value="in_person">Presencial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tom</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as MessageTone)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="cordial">Cordial</option>
              <option value="professional">Profissional</option>
              <option value="direct">Direto</option>
              <option value="formal">Formal</option>
              <option value="friendly">Amigável</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MessageCategory)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="cordial_reminder">Cobrança cordial</option>
              <option value="professional_collection">Cobrança profissional</option>
              <option value="direct_collection">Cobrança direta</option>
              <option value="before_due">Lembrete pré-vencimento</option>
              <option value="due_date">Lembrete no dia</option>
              <option value="overdue_first">Primeiro contacto de atraso</option>
              <option value="broken_promise">Promessa não cumprida</option>
              <option value="high_value">Cobrança de valor elevado</option>
              <option value="company_client">Empresarial (B2B)</option>
              <option value="friend_acquaintance">Amigo / Conhecido</option>
              <option value="payment_confirmation">Confirmação de recebimento</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>
        </div>

        {channel === 'email' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assunto do E-mail
            </label>
            <input
              type="text"
              placeholder="Ex: Regularização de pagamento pendente — {{referencia}}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Conteúdo da Mensagem *
            </label>
            <span className="text-[11px] text-slate-400">
              Clique nas variáveis abaixo para as inserir no texto
            </span>
          </div>

          {/* Tags de variáveis dinâmicas */}
          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2">
            {availableVariables.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => insertVariableTag(v.tag)}
                className="px-2 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer"
                title={`Inserir {{${v.tag}}}`}
              >
                {`{{${v.tag}}}`}
              </button>
            ))}
          </div>

          <textarea
            required
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o texto do modelo aqui..."
            className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-slate-900 leading-relaxed resize-y"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Guardar alterações' : 'Criar modelo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
