import React, { useState, useMemo } from 'react';
import { Invoice, PaymentPromise, PaymentPromiseStatus } from '../../types/database';
import { useInvoices } from '../../context/InvoiceContext';
import { useCustomers } from '../../context/CustomerContext';
import { useMessages } from '../../context/MessageContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';
import { ProgressBar } from '../ui/ProgressBar';
import { InvoiceFormModal } from '../invoices/InvoiceFormModal';
import { RecordPaymentModal } from '../invoices/RecordPaymentModal';
import { RecordPromiseModal } from '../invoices/RecordPromiseModal';
import { CancelInvoiceModal } from '../invoices/CancelInvoiceModal';
import { InvoiceMessageModal } from '../invoices/InvoiceMessageModal';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getDaysOverdue,
  isDatePassed,
} from '../../lib/formatters';
import {
  ArrowLeft,
  Receipt,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Edit2,
  Ban,
  RotateCcw,
  History,
  FileText,
  DollarSign,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

export const InvoiceDetailView: React.FC = () => {
  const { selectedInvoiceId, navigate, navigateToCustomer } = useNavigation();
  const {
    getInvoiceById,
    getInvoicePayments,
    getInvoicePromises,
    getInvoiceTimeline,
    updatePromiseStatus,
    reopenInvoice,
  } = useInvoices();
  const { getCustomerById } = useCustomers();
  const { showToast } = useNotifications();

  // Estados de Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isPromiseModalOpen, setIsPromiseModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Busca dos dados da fatura e cliente
  const invoice = useMemo(() => {
    if (!selectedInvoiceId) return undefined;
    return getInvoiceById(selectedInvoiceId);
  }, [selectedInvoiceId, getInvoiceById]);

  const customer = useMemo(() => {
    if (!invoice) return undefined;
    return getCustomerById(invoice.customerId);
  }, [invoice, getCustomerById]);

  const payments = useMemo(() => {
    if (!invoice) return [];
    return getInvoicePayments(invoice.id);
  }, [invoice, getInvoicePayments]);

  const promises = useMemo(() => {
    if (!invoice) return [];
    return getInvoicePromises(invoice.id);
  }, [invoice, getInvoicePromises]);

  const timelineEvents = useMemo(() => {
    if (!invoice) return [];
    return getInvoiceTimeline(invoice.id);
  }, [invoice, getInvoiceTimeline]);

  const { getMessagesByInvoice } = useMessages();
  const invoiceMessages = useMemo(() => {
    if (!invoice) return [];
    return getMessagesByInvoice(invoice.id);
  }, [invoice, getMessagesByInvoice]);

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('dashboard_invoices')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar às cobranças
          </Button>
        </div>

        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Cobrança não encontrada</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            A cobrança solicitada não existe ou não pertence a este espaço de trabalho.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => navigate('dashboard_invoices')}
          >
            Ver todas as cobranças
          </Button>
        </Card>
      </div>
    );
  }

  // Cálculos Financeiros
  const remainingBalance = Math.max(0, Math.round((invoice.amount - invoice.paidAmount) * 100) / 100);
  const paidPercent = Math.min(100, Math.round((invoice.paidAmount / invoice.amount) * 100));
  const overdueDays = getDaysOverdue(invoice.dueDate);
  const isOverdue = overdueDays > 0 && invoice.status !== 'paid' && invoice.status !== 'canceled';

  // Promessa ativa
  const activePromise = promises.find((p) => p.status === 'pending');
  const isPromiseExpired =
    activePromise && isDatePassed(activePromise.promisedDate) && remainingBalance > 0;

  const handleCopyPaymentLink = async () => {
    if (!invoice.paymentLink) return;
    try {
      await navigator.clipboard.writeText(invoice.paymentLink);
      setCopiedLink(true);
      showToast('Link de pagamento copiado para a área de transferência!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('Não foi possível copiar o link automaticamente.', 'error');
    }
  };

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Transferência bancária';
      case 'mbway':
        return 'MB WAY';
      case 'multibanco':
        return 'Multibanco';
      case 'card':
        return 'Cartão de crédito / débito';
      case 'paypal':
        return 'PayPal';
      case 'cash':
        return 'Numerário';
      default:
        return method || 'Não especificado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Navegação de Retorno */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('dashboard_invoices')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Voltar às cobranças
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Cobranças</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-700">{invoice.invoiceNumber}</span>
        </div>
      </div>

      {/* Cartão de Cabeçalho e Ações Principais */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0 font-bold">
              <Receipt className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {invoice.invoiceNumber}
                </h1>
                {invoice.status === 'canceled' ? (
                  <Badge variant="gray" size="sm">
                    Cancelada
                  </Badge>
                ) : invoice.status === 'paid' ? (
                  <Badge variant="success" size="sm">
                    Paga na totalidade
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="danger" size="sm">
                    {overdueDays} dias em atraso
                  </Badge>
                ) : invoice.status === 'partially_paid' ? (
                  <Badge variant="info" size="sm">
                    Parcialmente paga
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    Em aberto
                  </Badge>
                )}
              </div>

              {invoice.description && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1">{invoice.description}</p>
              )}

              {/* Informações Rápidas do Cliente */}
              {customer && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-slate-500">Cliente associado:</span>
                  <button
                    onClick={() => navigateToCustomer(customer.id)}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                  >
                    {customer.name}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grupo de Ações */}
          <div className="flex flex-wrap items-center gap-2">
            {invoice.status !== 'canceled' && invoice.status !== 'paid' && (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsPaymentModalOpen(true)}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  Registar pagamento
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsPromiseModalOpen(true)}
                  leftIcon={<Clock className="w-4 h-4" />}
                >
                  Registar promessa
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={() => setIsMessageModalOpen(true)}
              leftIcon={<MessageSquare className="w-4 h-4 text-indigo-600" />}
              className="border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-900"
            >
              Gerar mensagem
            </Button>

            <Dropdown
              trigger={
                <Button variant="ghost" size="md">
                  Mais opções
                </Button>
              }
              items={[
                ...(invoice.status !== 'canceled'
                  ? [
                      {
                        label: 'Editar dados da cobrança',
                        icon: <Edit2 className="w-3.5 h-3.5 text-slate-600" />,
                        onClick: () => setIsEditModalOpen(true),
                      },
                      {
                        label: 'Cancelar cobrança',
                        icon: <Ban className="w-3.5 h-3.5 text-rose-600" />,
                        onClick: () => setIsCancelModalOpen(true),
                        danger: true,
                      },
                    ]
                  : [
                      {
                        label: 'Reabrir cobrança',
                        icon: <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />,
                        onClick: async () => {
                          const res = await reopenInvoice(invoice.id);
                          if (res.success) {
                            showToast('Cobrança reaberta com sucesso.', 'success');
                          }
                        },
                      },
                    ]),
              ]}
            />
          </div>
        </div>

        {/* Resumo Financeiro da Cobrança */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Valor total</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {formatCurrency(invoice.amount)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Valor recebido</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                {formatCurrency(invoice.paidAmount)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Saldo em aberto</span>
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  remainingBalance > 0 && isOverdue ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>

          {/* Barra de Progresso de Liquidação */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Progresso de liquidação</span>
              <span>{paidPercent}% pago</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Promessa de Pagamento Ativa */}
      {activePromise && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            isPromiseExpired
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                isPromiseExpired ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold">
                  {isPromiseExpired
                    ? 'Promessa de pagamento não cumprida'
                    : 'Promessa de pagamento agendada'}
                </h4>
                <Badge variant={isPromiseExpired ? 'danger' : 'warning'} size="sm">
                  {formatDate(activePromise.promisedDate)}
                </Badge>
              </div>
              <p className="text-xs mt-0.5">
                Valor prometido:{' '}
                <strong className="font-semibold">{formatCurrency(activePromise.amount)}</strong>
                {activePromise.notes && (
                  <span className="block text-slate-700 italic mt-0.5">
                    "{activePromise.notes}"
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updatePromiseStatus(activePromise.id, 'kept')}
              className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 text-xs"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Marcar cumprida
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updatePromiseStatus(activePromise.id, 'canceled')}
              className="bg-white hover:bg-slate-100 text-slate-700 border-slate-300 text-xs"
            >
              Cancelar promessa
            </Button>
          </div>
        </div>
      )}

      {/* Grelha Principal: Dados da Cobrança + Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Informações da Cobrança e Pagamentos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Gerais */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Dados da Cobrança
              </h3>
              {invoice.status !== 'canceled' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Editar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Referência:</span>
                <span className="font-mono font-semibold text-slate-900">{invoice.invoiceNumber}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Data de emissão:</span>
                <span className="font-medium text-slate-800">{formatDate(invoice.issueDate)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Data de vencimento:</span>
                <span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span>
                {isOverdue && (
                  <span className="text-rose-600 font-bold block text-[10px]">
                    ({overdueDays} dias em atraso)
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Método sugerido:</span>
                <span className="font-medium text-slate-800">
                  {getMethodLabel(invoice.paymentMethod)}
                </span>
              </div>

              {invoice.paymentLink && (
                <div className="sm:col-span-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <span className="text-slate-600 block text-[11px] font-semibold flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Link de pagamento online:
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-indigo-900 truncate font-mono">
                      {invoice.paymentLink}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyPaymentLink}
                        leftIcon={
                          copiedLink ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {copiedLink ? 'Copiado' : 'Copiar link'}
                      </Button>
                      <a
                        href={invoice.paymentLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-600"
                        title="Abrir link externo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {invoice.notes && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Notas internas:</span>
                  <p className="text-slate-700 mt-0.5 italic">{invoice.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Histórico de Pagamentos */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Histórico de Pagamentos ({payments.length})
              </h3>
              {invoice.status !== 'canceled' && invoice.status !== 'paid' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                  leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                >
                  + Registar pagamento
                </Button>
              )}
            </div>

            {payments.length > 0 ? (
              <div className="divide-y divide-slate-100 pt-2">
                {payments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{formatCurrency(p.amount)}</div>
                      <div className="text-slate-500 flex items-center gap-2 text-[11px]">
                        <span>{formatDate(p.paymentDate)}</span>
                        <span>•</span>
                        <span>{getMethodLabel(p.method)}</span>
                        {p.reference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-600">Ref: {p.reference}</span>
                          </>
                        )}
                      </div>
                      {p.notes && <p className="text-slate-600 italic text-[11px]">{p.notes}</p>}
                    </div>

                    <Badge variant="success" size="sm">
                      Liquidado
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Ainda não foi registado qualquer pagamento para esta cobrança.
              </div>
            )}
          </Card>

          {/* Histórico de Mensagens Desta Cobrança (Secção 40) */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Mensagens Geradas ({invoiceMessages.length})
              </h3>
              {invoice.status !== 'canceled' && invoice.status !== 'paid' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMessageModalOpen(true)}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  Gerar mensagem
                </Button>
              )}
            </div>

            {invoiceMessages.length > 0 ? (
              <div className="divide-y divide-slate-100 pt-2">
                {invoiceMessages.map((msg) => (
                  <div key={msg.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {msg.channel}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(msg.createdAt)}
                        </span>
                        <Badge
                          size="sm"
                          variant={msg.status === 'sent_manually' ? 'success' : msg.status === 'copied' ? 'info' : 'neutral'}
                        >
                          {msg.status === 'sent_manually' ? 'Enviada' : msg.status === 'copied' ? 'Copiada' : 'Gerada'}
                        </Badge>
                      </div>
                      <p className="text-slate-600 line-clamp-2 text-xs italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{msg.body}"
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.body);
                        showToast('Mensagem copiada para a área de transferência.', 'success');
                      }}
                      className="text-xs h-7 px-2 shrink-0 pt-1"
                    >
                      Copiar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Ainda não foram preparadas mensagens para esta cobrança.
              </div>
            )}
          </Card>

          {/* Linha do Tempo / Timeline de Auditoria */}
          <Card>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Histórico e Auditoria de Acontecimentos
              </h3>
            </div>

            <div className="pt-4">
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-600" />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900">{evt.action}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(evt.createdAt)}
                      </div>
                      {evt.details && Object.keys(evt.details).length > 0 && (
                        <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {Object.entries(evt.details).map(([k, v]) => (
                            <span key={k} className="mr-3 inline-block">
                              <strong className="text-slate-700">{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Evento inicial de criação */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-400" />
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">Cobrança registada no sistema</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateTime(invoice.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Direita: Ficha do Cliente e Ações Rápidas */}
        <div className="space-y-6">
          {/* Ficha do Cliente */}
          {customer ? (
            <Card>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {customer.type === 'company' ? (
                    <Building2 className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <User className="w-4 h-4 text-indigo-600" />
                  )}
                  Cliente
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToCustomer(customer.id)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Ver ficha
                </Button>
              </div>

              <div className="pt-3 space-y-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                  <div className="text-slate-500">
                    {customer.type === 'company' ? 'Empresa / Pessoa Coletiva' : 'Pessoa Individual'}
                  </div>
                </div>

                {customer.taxId && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">NIF:</span>
                    <span className="font-mono font-medium text-slate-800">{customer.taxId}</span>
                  </div>
                )}

                {customer.email && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">E-mail:</span>
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-indigo-600 hover:underline break-all"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}

                {customer.phone && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Telemóvel:</span>
                    <a href={`tel:${customer.phone}`} className="text-indigo-600 hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}

                {customer.address && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Morada:</span>
                    <span className="text-slate-700">
                      {customer.address}
                      {customer.city ? `, ${customer.city}` : ''}
                      {customer.postalCode ? ` (${customer.postalCode})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-4 text-xs text-slate-500 text-center">
              Informação do cliente não disponível.
            </Card>
          )}

          {/* Dica de Cobrança Cordial */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Abordagem Cordial Pagora
            </div>
            <p className="text-indigo-900/80 leading-relaxed">
              Mantenha uma comunicação frequente e respeitosa. O envio de um lembrete cordial antes ou
              imediatamente após a data de vencimento reduz o prazo médio de recebimento em mais de 40%.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMessageModalOpen(true)}
              className="w-full bg-white text-indigo-700 border-indigo-200 mt-1"
            >
              Preparar mensagem personalizada
            </Button>
          </div>
        </div>
      </div>

      {/* Modais */}
      {isEditModalOpen && (
        <InvoiceFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          invoiceToEdit={invoice}
        />
      )}

      {isPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={invoice}
        />
      )}

      {isPromiseModalOpen && (
        <RecordPromiseModal
          isOpen={isPromiseModalOpen}
          onClose={() => setIsPromiseModalOpen(false)}
          invoice={invoice}
        />
      )}

      {isCancelModalOpen && (
        <CancelInvoiceModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          invoice={invoice}
        />
      )}

      {isMessageModalOpen && (
        <InvoiceMessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          invoice={invoice}
          customer={customer}
        />
      )}
    </div>
  );
};
