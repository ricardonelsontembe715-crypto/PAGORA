import React, { useState, useMemo } from 'react';
import { Customer } from '../../types/database';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useMessages } from '../../context/MessageContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';
import { CustomerBehaviorProfileCard } from '../customers/CustomerBehaviorProfileCard';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { ArchiveCustomerModal } from '../customers/ArchiveCustomerModal';
import { DeleteCustomerModal } from '../customers/DeleteCustomerModal';
import { FutureActionModal } from '../customers/FutureActionModal';
import { InvoiceFormModal } from '../invoices/InvoiceFormModal';
import { MessageGeneratorModal } from '../messages/MessageGeneratorModal';
import { analyzeCustomerBehaviorProfile } from '../../lib/collectionIntelligence';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  Receipt,
  MessageSquare,
  MoreVertical,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';

export const CustomerDetailView: React.FC = () => {
  const { selectedCustomerId, navigate, navigateToInvoice } = useNavigation();
  const {
    getCustomerById,
    getCustomerStats,
    getCustomerInvoices,
    getCustomerActivityLogs,
    restoreCustomer,
  } = useCustomers();
  const { getMessagesByCustomer } = useMessages();
  const { promises, payments } = useInvoices();
  const { showToast } = useNotifications();

  // Estados de Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isMessageGeneratorOpen, setIsMessageGeneratorOpen] = useState(false);
  const [futureModalType, setFutureModalType] = useState<'invoice' | 'message' | null>(null);
  const [previewingMessage, setPreviewingMessage] = useState<string | null>(null);

  // Busca do cliente com verificação de posse da conta ativa
  const customer = useMemo(() => {
    if (!selectedCustomerId) return undefined;
    return getCustomerById(selectedCustomerId);
  }, [selectedCustomerId, getCustomerById]);

  // Se o cliente não existir ou não pertencer a esta conta
  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('dashboard_customers')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar aos clientes
          </Button>
        </div>

        <Card className="p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Cliente não encontrado</h2>
          <p className="text-xs text-slate-500 mt-1">
            Este cliente não existe ou não pertence ao seu espaço de trabalho ativo.
          </p>
          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('dashboard_customers')}
            >
              Ir para a lista de clientes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Estatísticas e faturas reais do cliente
  const stats = getCustomerStats(customer.id);
  const invoices = getCustomerInvoices(customer.id);
  const activityLogs = getCustomerActivityLogs(customer.id);
  const customerMessages = getMessagesByCustomer(customer.id);
  const isArchived = customer.status === 'archived';

  // Análise Comportamental Determinística da PAGORA
  const behaviorProfile = useMemo(() => {
    const customerPromises = promises.filter((p) => p.customerId === customer.id);
    const customerInvoiceIds = new Set(invoices.map((i) => i.id));
    const customerPayments = payments.filter((p) => customerInvoiceIds.has(p.invoiceId));
    return analyzeCustomerBehaviorProfile(customer, invoices, customerPromises, customerPayments);
  }, [customer, invoices, promises, payments]);

  // Restauração direta
  const handleRestore = async () => {
    const res = await restoreCustomer(customer.id);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Cliente restaurado.',
        message: `${customer.name} foi reativado e voltou à lista ativa.`,
      });
    } else {
      showToast({
        type: 'error',
        title: 'Não foi possível restaurar',
        message: res.error || 'Tente novamente.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Navegação e Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('dashboard_customers')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Clientes</span>
        </button>

        {isArchived && (
          <Badge variant="neutral" size="md">
            Cliente Arquivado
          </Badge>
        )}
      </div>

      {/* Cabeçalho do Perfil */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${
                customer.type === 'company'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}
            >
              {customer.type === 'company' ? (
                <Building2 className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{customer.name}</h1>
                <Badge variant={customer.type === 'company' ? 'primary' : 'success'} size="sm">
                  {customer.type === 'company' ? 'Empresa' : 'Pessoa Individual'}
                </Badge>
                {isArchived ? (
                  <Badge variant="neutral" size="sm">
                    Arquivado
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Ativo
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.phone}</span>
                  </a>
                )}
                {customer.taxId && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>NIF: {customer.taxId}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Ação Principal */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Editar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFutureModalType('message')}
              leftIcon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Gerar mensagem
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setFutureModalType('invoice')}
              leftIcon={<Receipt className="w-3.5 h-3.5" />}
            >
              Criar cobrança
            </Button>

            <Dropdown
              trigger={
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Mais opções"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              }
              items={[
                isArchived
                  ? {
                      id: 'restore',
                      label: 'Restaurar cliente',
                      icon: <RotateCcw className="w-4 h-4 text-emerald-600" />,
                      onClick: handleRestore,
                    }
                  : {
                      id: 'archive',
                      label: 'Arquivar cliente',
                      icon: <Archive className="w-4 h-4 text-amber-600" />,
                      onClick: () => setIsArchiveModalOpen(true),
                    },
                {
                  id: 'divider',
                  label: '',
                  divider: true,
                  onClick: () => {},
                },
                {
                  id: 'delete',
                  label: 'Eliminar registo',
                  icon: <Trash2 className="w-4 h-4 text-rose-600" />,
                  danger: true,
                  onClick: () => setIsDeleteModalOpen(true),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Resumo Financeiro do Cliente (Secção 12: 4 Cartões) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card hoverable className="p-4">
          <span className="text-xs font-semibold text-slate-500">Total faturado</span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(stats.totalInvoiced)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.invoicesCount} fatura(s) emitida(s)
          </div>
        </Card>

        <Card hoverable className="p-4">
          <span className="text-xs font-semibold text-slate-500">Total recebido</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(stats.totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Valores liquidados</div>
        </Card>

        <Card hoverable className="p-4">
          <span className="text-xs font-semibold text-slate-500">Total em aberto</span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(stats.totalPending)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dentro do prazo de vencimento</div>
        </Card>

        <Card hoverable className="p-4">
          <span className="text-xs font-semibold text-slate-500">Total em atraso</span>
          <div
            className={`text-xl sm:text-2xl font-bold mt-1 ${
              stats.totalOverdue > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {formatCurrency(stats.totalOverdue)}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            {stats.overdueInvoicesCount > 0
              ? `${stats.overdueInvoicesCount} fatura(s) vencida(s)`
              : 'Sem atrasos registados'}
          </div>
        </Card>
      </div>

      {/* Perfil Comportamental de Pagamento da Pagora */}
      <CustomerBehaviorProfileCard profile={behaviorProfile} />

      {/* Grelha Principal com Dados e Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda (2/3): Dados do Cliente e Faturas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Dados do cliente</CardTitle>
                <CardDescription>
                  Informações de contacto, endereço e dados fiscais registados
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Editar dados
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Nome / Razão Social
                  </span>
                  <div className="font-bold text-slate-900">{customer.name}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Tipo de Cliente
                  </span>
                  <div className="font-bold text-slate-900">
                    {customer.type === 'company' ? 'Pessoa Coletiva (Empresa)' : 'Pessoa Singular'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Endereço de E-mail
                  </span>
                  <div className="font-medium text-slate-900">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:underline">
                        {customer.email}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Telefone / Telemóvel
                  </span>
                  <div className="font-medium text-slate-900">
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="text-indigo-600 hover:underline">
                        {customer.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    NIF / Identificador Fiscal
                  </span>
                  <div className="font-bold text-slate-900">
                    {customer.taxId || <span className="text-slate-400 italic font-normal">Não informado</span>}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">País</span>
                  <div className="font-medium text-slate-900">{customer.country || 'Portugal'}</div>
                </div>
              </div>

              {/* Endereço Completo */}
              {(customer.address || customer.city || customer.postalCode) && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase font-semibold">
                    Morada e Localização
                  </span>
                  <div className="text-slate-900">
                    {customer.address && <span>{customer.address}</span>}
                    {(customer.city || customer.postalCode) && (
                      <span className="text-slate-600 block mt-0.5">
                        {[customer.postalCode, customer.city].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Notas Internas */}
              {customer.notes && (
                <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs space-y-1">
                  <span className="text-amber-800 text-[11px] uppercase font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Notas Internas Confidenciais
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secção de Cobranças Associadas */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Cobranças e faturas</CardTitle>
                <CardDescription>
                  Histórico de faturas emitidas para {customer.name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInvoiceModalOpen(true)}
                leftIcon={<Receipt className="w-3.5 h-3.5 text-indigo-600" />}
              >
                + Nova cobrança
              </Button>
            </CardHeader>

            <CardContent>
              {invoices.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    Nenhuma cobrança associada a este cliente
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Ao emitir faturas no módulo de Cobranças, os valores e prazos serão
                    consolidados automaticamente neste perfil.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setIsInvoiceModalOpen(true)}
                  >
                    Preparar primeira cobrança
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => navigateToInvoice(inv.id)}
                      className="py-3 flex items-center justify-between text-xs gap-3 hover:bg-slate-50 p-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          FT
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 hover:text-indigo-600">
                            {inv.invoiceNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Emissão: {formatDate(inv.issueDate)} • Vencimento: {formatDate(inv.dueDate)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(inv.amount)}
                        </div>
                        <div>
                          {inv.status === 'paid' ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Liquidada
                            </span>
                          ) : inv.status === 'overdue' ? (
                            <span className="text-[10px] text-amber-700 font-semibold">
                              Vencida
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">Pendente</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Mensagens Geradas (Secção 40) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Mensagens Geradas</CardTitle>
                  <CardDescription>
                    Comunicações preparadas para este cliente ({customerMessages.length})
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsMessageGeneratorOpen(true)}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  Nova mensagem
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {customerMessages.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Ainda não foram geradas mensagens para este cliente.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customerMessages.map((msg) => (
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

                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.body);
                            showToast({
                              type: 'success',
                              title: 'Mensagem copiada',
                              message: 'Texto copiado para a área de transferência.',
                            });
                          }}
                          className="text-xs h-7 px-2"
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita (1/3): Timeline de Atividade & Ações de Comunicação */}
        <div className="space-y-6">
          {/* Histórico Real de Atividades (Secção 14) */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Histórico de atividade</CardTitle>
                <CardDescription>Acontecimentos registados no sistema</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Sem atividades registadas até ao momento.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      {/* Ponto na timeline */}
                      <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <div>
                        <div className="font-bold text-slate-900">{log.action}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Preparação para Cobranças e Mensagens (Secção 29 e 30) */}
          <Card className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 border-indigo-100">
            <CardHeader>
              <div>
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Próximos Passos
                </div>
                <CardTitle>Comunicações & Cobranças</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="text-xs text-slate-600 space-y-3">
              <p className="leading-relaxed">
                Este cliente está pronto para o motor de cobrança cordial da Pagora. Ao emitir faturas ou gerar mensagens:
              </p>

              <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Nome e tratamento respeitoso</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>NIF e morada para cabeçalho fiscal</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Canal preferencial (Email / WhatsApp)</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMessageGeneratorOpen(true)}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  Gerar mensagem para este cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customerToEdit={customer}
      />

      <ArchiveCustomerModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        customer={customer}
      />

      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        customer={customer}
        onSuccess={() => navigate('dashboard_customers')}
        onOpenArchiveInstead={() => setIsArchiveModalOpen(true)}
      />

      <FutureActionModal
        isOpen={!!futureModalType}
        onClose={() => setFutureModalType(null)}
        actionType={futureModalType || 'invoice'}
        customer={customer}
      />

      {isInvoiceModalOpen && (
        <InvoiceFormModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          preselectedCustomerId={customer.id}
        />
      )}

      {isMessageGeneratorOpen && (
        <MessageGeneratorModal
          isOpen={isMessageGeneratorOpen}
          onClose={() => setIsMessageGeneratorOpen(false)}
          preselectedCustomerId={customer.id}
        />
      )}
    </div>
  );
};
