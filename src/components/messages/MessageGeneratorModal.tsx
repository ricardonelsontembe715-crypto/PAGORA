import React, { useState, useEffect, useMemo } from 'react';
import {
  Customer,
  Invoice,
  MessageChannel,
  MessageTone,
  MessageCategory,
  MessageIntent,
  MessageStatus,
  InPersonStep,
} from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useMessages } from '../../context/MessageContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ApproachExplanationCard } from './ApproachExplanationCard';
import { explainRecommendedApproach } from '../../lib/collectionIntelligence';
import { formatCurrency, formatDate, getDaysOverdue } from '../../lib/formatters';
import { hasFeature } from '../../lib/permissions';
import {
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Send,
  RefreshCw,
  BookmarkPlus,
  Mail,
  Smartphone,
  UserCheck,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface MessageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
  preselectedInvoiceId?: string;
  onTemplateSaved?: () => void;
}

export const MessageGeneratorModal: React.FC<MessageGeneratorModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
  preselectedInvoiceId,
  onTemplateSaved,
}) => {
  const { account } = useAuth();
  const { customers, getCustomerById } = useCustomers();
  const { invoices, promises, getInvoiceById } = useInvoices();
  const {
    analyzeContext,
    generateDraft,
    saveGeneratedMessage,
    updateMessageStatus,
    createTemplate,
    generationStats,
    signature,
  } = useMessages();
  const { showToast } = useNotifications();

  // Seleção de cliente e cobrança
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoiceId || '');

  // Configurações do Gerador
  const [channel, setChannel] = useState<MessageChannel>('whatsapp');
  const [tone, setTone] = useState<MessageTone>('cordial');
  const [category, setCategory] = useState<MessageCategory>('cordial_reminder');
  const [intent, setIntent] = useState<MessageIntent>('remind');
  const [variationIndex, setVariationIndex] = useState<number>(0);

  // Opções adicionais
  const [includePaymentLink, setIncludePaymentLink] = useState<boolean>(true);
  const [includePaymentMethod, setIncludePaymentMethod] = useState<boolean>(true);
  const [includeDueDate, setIncludeDueDate] = useState<boolean>(true);
  const [includeOverdueDays, setIncludeOverdueDays] = useState<boolean>(true);
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);

  // Texto editável da mensagem
  const [editableSubject, setEditableSubject] = useState<string>('');
  const [editableBody, setEditableBody] = useState<string>('');
  const [inPersonSteps, setInPersonSteps] = useState<InPersonStep[]>([]);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  // Estados de feedback e processamento profissional (Parte 36)
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStepText, setGenerationStepText] = useState<string>('A analisar a cobrança…');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [showTemplateInput, setShowTemplateInput] = useState<boolean>(false);
  const [isSentManually, setIsSentManually] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Cliente e Fatura carregados
  const currentCustomer = useMemo(
    () => (selectedCustomerId ? getCustomerById(selectedCustomerId) : undefined),
    [selectedCustomerId, getCustomerById]
  );

  const currentInvoice = useMemo(
    () => (selectedInvoiceId ? getInvoiceById(selectedInvoiceId) : undefined),
    [selectedInvoiceId, getInvoiceById]
  );

  // Lista de cobranças do cliente selecionado
  const customerInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return invoices.filter((i) => i.customerId === selectedCustomerId && i.status !== 'canceled');
  }, [selectedCustomerId, invoices]);

  // Se o cliente mudar e tiver faturas, auto-seleciona a primeira pendente/vencida
  useEffect(() => {
    if (selectedCustomerId && !selectedInvoiceId && customerInvoices.length > 0) {
      const overdueOrPending = customerInvoices.find(
        (i) => i.status === 'overdue' || i.status === 'pending' || i.status === 'partially_paid'
      );
      if (overdueOrPending) {
        setSelectedInvoiceId(overdueOrPending.id);
      }
    }
  }, [selectedCustomerId, selectedInvoiceId, customerInvoices]);

  // Análise de Contexto Inteligente da PAGORA
  const recommendation = useMemo(() => {
    if (!selectedCustomerId) return null;
    return analyzeContext(selectedCustomerId, selectedInvoiceId || undefined);
  }, [selectedCustomerId, selectedInvoiceId, analyzeContext]);

  // Explicação Detalhada e Factual da Abordagem
  const approachExplanation = useMemo(() => {
    if (!currentCustomer) return null;
    return explainRecommendedApproach(currentCustomer, currentInvoice, promises);
  }, [currentCustomer, currentInvoice, promises]);

  // Ao carregar ou mudar a fatura, aplica as recomendações da PAGORA
  useEffect(() => {
    if (recommendation) {
      setCategory(recommendation.recommendedCategory);
      setTone(recommendation.recommendedTone);
      setIntent(recommendation.recommendedIntent);
      setVariationIndex(0);
    }
  }, [recommendation]);

  // Re-gera o texto sempre que as opções mudam com processamento natural de 900ms a 1200ms
  useEffect(() => {
    if (!selectedCustomerId) {
      setEditableBody('');
      setEditableSubject('');
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setGenerationStepText('A analisar a cobrança e contexto do cliente…');

    const step1Timer = setTimeout(() => {
      if (isMounted) {
        setGenerationStepText('A personalizar o tom e a abordagem…');
      }
    }, 400);

    const step2Timer = setTimeout(() => {
      if (isMounted) {
        setGenerationStepText('A preparar a mensagem…');
      }
    }, 750);

    const finalTimer = setTimeout(() => {
      if (!isMounted) return;

      const res = generateDraft({
        customerId: selectedCustomerId,
        invoiceId: selectedInvoiceId || undefined,
        options: {
          channel,
          tone,
          category,
          intent,
          includePaymentLink,
          includePaymentMethod,
          includeDueDate,
          includeOverdueDays,
          includeSignature,
          variationIndex,
        },
      });

      if (res.success && res.output) {
        setEditableBody(res.output.body);
        setEditableSubject(res.output.subject || '');
        setInPersonSteps(res.output.inPersonSteps || []);
      } else if (res.error) {
        showToast(res.error, 'warning');
      }
      setIsGenerating(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      clearTimeout(finalTimer);
    };
  }, [
    selectedCustomerId,
    selectedInvoiceId,
    channel,
    tone,
    category,
    intent,
    includePaymentLink,
    includePaymentMethod,
    includeDueDate,
    includeOverdueDays,
    includeSignature,
    variationIndex,
    generateDraft,
    showToast,
  ]);

  // Ciclo de novas variações
  const handleRegenerateVariation = () => {
    setVariationIndex((prev) => prev + 1);
    showToast('Nova variação gerada com sucesso!', 'info');
  };

  // Regista a mensagem no histórico se ainda não tiver ID
  const ensureMessageSaved = async (status: MessageStatus = 'generated') => {
    if (!selectedCustomerId) return null;

    if (currentMessageId) {
      await updateMessageStatus(currentMessageId, status);
      return currentMessageId;
    }

    const res = await saveGeneratedMessage({
      customerId: selectedCustomerId,
      invoiceId: selectedInvoiceId || undefined,
      channel,
      category,
      tone,
      intent,
      subject: channel === 'email' ? editableSubject : undefined,
      body: editableBody,
      inPersonSteps: channel === 'in_person' ? inPersonSteps : undefined,
      status,
    });

    if (res.success && res.message) {
      setCurrentMessageId(res.message.id);
      return res.message.id;
    }
    return null;
  };

  // Copiar mensagem
  const handleCopy = async () => {
    if (!editableBody) return;

    try {
      const textToCopy = channel === 'email' && editableSubject
        ? `Assunto: ${editableSubject}\n\n${editableBody}`
        : editableBody;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      showToast('Mensagem copiada para a área de transferência!', 'success');

      await ensureMessageSaved('copied');

      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Não foi possível copiar o texto automaticamente.', 'error');
    }
  };

  // Continuar no WhatsApp
  const handleOpenWhatsApp = async () => {
    if (!editableBody) return;

    const phone = currentCustomer?.phone?.replace(/[^0-9]/g, '') || '';
    const encodedText = encodeURIComponent(editableBody);
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    await ensureMessageSaved('prepared');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    showToast('A abrir o WhatsApp no seu dispositivo para envio manual…', 'info');
  };

  // Abrir no cliente de e-mail (mailto:)
  const handleOpenEmailClient = async () => {
    if (!editableBody) return;

    const recipient = currentCustomer?.email || '';
    const subject = encodeURIComponent(editableSubject || 'Aviso de Cobrança — Pagora');
    const body = encodeURIComponent(editableBody);
    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;

    await ensureMessageSaved('prepared');
    window.location.href = mailtoUrl;
    showToast('A abrir a aplicação de e-mail padrão…', 'info');
  };

  // Marcar como enviada manualmente
  const handleMarkAsSentManually = async () => {
    await ensureMessageSaved('sent_manually');
    setIsSentManually(true);
    showToast('Mensagem registada como enviada manualmente.', 'success');
  };

  // Guardar como modelo personalizado
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      showToast('Indique um nome para o modelo.', 'warning');
      return;
    }

    setIsSavingTemplate(true);
    const res = await createTemplate({
      title: templateName.trim(),
      category,
      channel,
      tone,
      intent,
      subject: channel === 'email' ? editableSubject : undefined,
      content: editableBody,
    });
    setIsSavingTemplate(false);

    if (res.success) {
      showToast('Modelo personalizado guardado com sucesso!', 'success');
      setShowTemplateInput(false);
      setTemplateName('');
      if (onTemplateSaved) onTemplateSaved();
    } else {
      showToast(res.error || 'Erro ao guardar modelo.', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Motor Profissional de Mensagens" size="xl">
      <div className="space-y-5">
        {/* Banner do Contexto Inteligente */}
        {approachExplanation ? (
          <ApproachExplanationCard explanation={approachExplanation} />
        ) : recommendation ? (
          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-300">Análise de Contexto da Cobrança</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{recommendation.headline}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-medium border border-indigo-500/40">
                      {recommendation.badge}
                    </span>
                  </div>
                </div>
              </div>


              {/* Resumo da cobrança */}
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400">Cliente: </span>
                  <strong className="text-white">{recommendation.contextSummary.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Saldo em aberto: </span>
                  <strong className="text-emerald-400">{recommendation.contextSummary.remainingAmount}</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Porquê esta abordagem? </strong>
                {recommendation.reason}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Selecione o cliente e a cobrança correspondente para carregar a inteligência de contexto.
          </div>
        )}

        {/* Seletores de Cliente e Cobrança */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente Destinatário *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedInvoiceId('');
              }}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="">Selecione um cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.type === 'company' ? '(Empresa)' : '(Particular)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cobrança Associada (Opcional)
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              disabled={!selectedCustomerId || customerInvoices.length === 0}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {customerInvoices.length === 0
                  ? 'Sem faturas registadas para este cliente'
                  : 'Selecione uma cobrança...'}
              </option>
              {customerInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {formatCurrency(inv.amount)} ({inv.status === 'overdue' ? 'Vencida' : inv.status === 'paid' ? 'Paga' : 'Pendente'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Seleção de Canal & Tom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Canal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Canal de Comunicação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center sm:flex-col justify-center gap-1.5 sm:gap-1 transition-all min-h-[40px] ${
                  channel === 'whatsapp'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center sm:flex-col justify-center gap-1.5 sm:gap-1 transition-all min-h-[40px] ${
                  channel === 'sms'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
                <span>SMS</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center sm:flex-col justify-center gap-1.5 sm:gap-1 transition-all min-h-[40px] ${
                  channel === 'email'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                <span>E-mail</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('in_person')}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center sm:flex-col justify-center gap-1.5 sm:gap-1 transition-all min-h-[40px] ${
                  channel === 'in_person'
                    ? 'bg-white text-amber-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                <span>Presencial</span>
              </button>
            </div>
          </div>

          {/* Tom */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tom da Mensagem
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
              {(
                [
                  { id: 'cordial', label: 'Cordial' },
                  { id: 'professional', label: 'Profissional' },
                  { id: 'direct', label: 'Direto' },
                  { id: 'formal', label: 'Formal' },
                  { id: 'friendly', label: 'Amigável' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`py-2 px-1.5 text-center rounded-lg text-[11px] font-medium transition-all min-h-[36px] flex items-center justify-center ${
                    tone === t.id
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categoria e Intenção da Mensagem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Situação da Mensagem
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MessageCategory)}
              className="w-full h-10 sm:h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="cordial_reminder">Cobrança cordial</option>
              <option value="professional_collection">Cobrança profissional</option>
              <option value="direct_collection">Cobrança direta</option>
              <option value="before_due">Lembrete antes do vencimento</option>
              <option value="due_date">Lembrete no dia do vencimento</option>
              <option value="overdue_first">Primeiro contacto após vencimento</option>
              <option value="broken_promise">Promessa de pagamento não cumprida</option>
              <option value="promise_reminder">Lembrete de promessa próxima</option>
              <option value="high_value">Cobrança de valor elevado</option>
              <option value="no_response">Cobrança após ausência de resposta</option>
              <option value="last_friendly">Último lembrete amigável</option>
              <option value="payment_confirmation">Confirmação de pagamento</option>
              <option value="payment_proof_request">Pedido de comprovativo</option>
              <option value="friend_acquaintance">Mensagem para amigo / conhecido</option>
              <option value="company_client">Mensagem empresarial (B2B)</option>
              <option value="individual_client">Mensagem para pessoa individual</option>
              <option value="follow_up">Mensagem de acompanhamento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Intenção Principal
            </label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value as MessageIntent)}
              className="w-full h-10 sm:h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="remind">Lembrar</option>
              <option value="request_payment">Pedir pagamento</option>
              <option value="request_forecast">Pedir previsão de data</option>
              <option value="confirm_promise">Confirmar promessa acordada</option>
              <option value="recover_response">Recuperar resposta</option>
              <option value="confirm_receipt">Confirmar recebimento</option>
            </select>
          </div>
        </div>

        {/* Toggles de Personalização */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 text-xs text-slate-700">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePaymentLink}
                onChange={(e) => setIncludePaymentLink(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 sm:h-3.5 sm:w-3.5"
              />
              <span>Link pagamento</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePaymentMethod}
                onChange={(e) => setIncludePaymentMethod(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 sm:h-3.5 sm:w-3.5"
              />
              <span>Método pag.</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeOverdueDays}
                onChange={(e) => setIncludeOverdueDays(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 sm:h-3.5 sm:w-3.5"
              />
              <span>Dias em atraso</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 sm:h-3.5 sm:w-3.5"
              />
              <span>Assinatura</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleRegenerateVariation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-2 sm:py-1 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gerar outra versão</span>
          </button>
        </div>

        {/* PRÉ-VISUALIZAÇÃO POR CANAL & EDITOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Pré-visualização do Canal & Editor</span>
              <span className="text-[11px] font-normal text-slate-400">
                (Pode editar livremente antes de copiar ou partilhar)
              </span>
            </div>

            {channel === 'sms' && (
              <span className={`text-[11px] font-mono font-medium ${editableBody.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                {editableBody.length} caracteres ({Math.max(1, Math.ceil(editableBody.length / 160))} SMS)
              </span>
            )}
          </div>

          {/* Avisos de Canal e Dados */}
          {channel === 'sms' && editableBody.length > 160 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Aviso: O texto ultrapassa os 160 caracteres padrão e poderá ser faturado como múltiplos SMS pelas operadoras.</span>
            </div>
          )}

          {channel === 'whatsapp' && !currentCustomer?.phone && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cliente sem número de telefone associado. Poderá copiar o texto e enviar manualmente através do WhatsApp.</span>
            </div>
          )}

          {channel === 'email' && !currentCustomer?.email && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cliente sem endereço de e-mail registado na ficha.</span>
            </div>
          )}

          {/* Estado de Processamento Realista */}
          {isGenerating ? (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800 tracking-tight">
                  {generationStepText}
                </p>
                <p className="text-[11px] text-slate-400">
                  A ajustar parâmetros de cordialidade, prazos e saldo em dívida
                </p>
              </div>
            </div>
          ) : channel === 'in_person' ? (
            /* Modo Presencial (Roteiro) */
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-amber-900 font-semibold text-xs border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Roteiro de Abordagem Pessoal e Direta</span>
                </div>
                <span className="text-[11px] font-normal text-amber-800">
                  Fluxo conversacional estruturado para reuniões ou contactos telefónicos
                </span>
              </div>

              <div className="space-y-3">
                {inPersonSteps.map((step) => (
                  <div key={step.step} className="p-3 bg-white rounded-lg border border-amber-100 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                      <span>Passo {step.step}: {step.title}</span>
                    </div>
                    <p className="text-xs text-slate-700 italic font-sans leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 mb-1.5">
                      {step.dialogue}
                    </p>
                    {step.tip && (
                      <p className="text-[11px] text-amber-800 flex items-center gap-1">
                        <span className="font-semibold">Dica de condução:</span> {step.tip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Se for E-mail, exibe campo de Assunto e Destinatário */}
              {channel === 'email' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-slate-100/80 rounded-lg border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-600 pl-1">Para:</span>
                    <span className="font-medium text-slate-800">
                      {currentCustomer?.email || 'Endereço não definido'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-100/80 rounded-lg border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-600 pl-1">Assunto:</span>
                    <input
                      type="text"
                      value={editableSubject}
                      onChange={(e) => setEditableSubject(e.target.value)}
                      className="flex-1 bg-white px-2.5 py-1 text-xs border border-slate-200 rounded font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Caixa de Texto do Corpo */}
              <div
                className={`relative rounded-xl border p-3.5 transition-all ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : channel === 'email'
                    ? 'bg-blue-50/20 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <textarea
                  rows={8}
                  value={editableBody}
                  onChange={(e) => setEditableBody(e.target.value)}
                  className="w-full text-xs bg-transparent border-0 font-sans text-slate-800 leading-relaxed focus:outline-none resize-y"
                  placeholder="O texto gerado da mensagem será apresentado aqui..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Link de Pagamento - Info */}
        {currentInvoice && (
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <div>
              {currentInvoice.paymentLink ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Link de pagamento associado: {currentInvoice.paymentLink}
                </span>
              ) : (
                <span className="text-slate-400">
                  Esta cobrança não possui link direto de pagamento configurado.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Formulário rápido para guardar como modelo */}
        {showTemplateInput && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-indigo-950">
              Nome do Modelo Personalizado
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Cobrança VIP Clientes Recorrentes"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1 px-3 py-2 sm:py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAsTemplate}
                  isLoading={isSavingTemplate}
                  className="flex-1 sm:flex-initial"
                >
                  Gravar modelo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateInput(false)}
                  className="flex-1 sm:flex-initial"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Ações Finais Responsivas (Mobile-first Stack) */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1 sm:flex-initial text-slate-500 hover:text-slate-800">
              Fechar
            </Button>

            {!showTemplateInput && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateInput(true)}
                leftIcon={<BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />}
                className="flex-1 sm:flex-initial text-xs"
              >
                Guardar modelo
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {channel === 'whatsapp' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    className="w-full sm:w-auto justify-center text-xs font-semibold"
                  >
                    {copied ? 'Copiada!' : 'Copiar'}
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleMarkAsSentManually}
                    leftIcon={<Check className="w-3.5 h-3.5 text-slate-600" />}
                    className="w-full sm:w-auto justify-center text-xs"
                  >
                    {isSentManually ? 'Enviada' : 'Marcar enviada'}
                  </Button>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenWhatsApp}
                  leftIcon={<Send className="w-4 h-4" />}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white justify-center font-bold"
                >
                  Continuar no WhatsApp
                </Button>
              </div>
            ) : channel === 'email' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check className="w-4 h-4 text-blue-600" /> : <Copy className="w-4 h-4" />}
                    className="w-full sm:w-auto justify-center text-xs font-semibold"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleMarkAsSentManually}
                    leftIcon={<Check className="w-3.5 h-3.5 text-slate-600" />}
                    className="w-full sm:w-auto justify-center text-xs"
                  >
                    {isSentManually ? 'Enviada' : 'Marcar enviada'}
                  </Button>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenEmailClient}
                  leftIcon={<Mail className="w-4 h-4" />}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white justify-center font-bold"
                >
                  Abrir no E-mail
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleMarkAsSentManually}
                  leftIcon={<Check className="w-3.5 h-3.5 text-slate-600" />}
                  className="w-full sm:w-auto justify-center text-xs"
                >
                  {isSentManually ? 'Marcada como enviada' : 'Marcar como enviada'}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCopy}
                  leftIcon={copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  className="w-full sm:w-auto justify-center font-bold"
                >
                  {copied ? 'Mensagem copiada!' : 'Copiar mensagem'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
