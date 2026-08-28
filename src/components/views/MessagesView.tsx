import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessageContext';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigation } from '../../context/NavigationContext';
import { GeneratedMessage, MessageChannel, MessageStatus } from '../../types/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { MessageGeneratorModal } from '../messages/MessageGeneratorModal';
import {
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Copy,
  Check,
  Send,
  Trash2,
  ExternalLink,
  Smartphone,
  Mail,
  UserCheck,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  ArrowUpRight,
  Plus,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const { account } = useAuth();
  const {
    messages,
    generationStats,
    deleteMessage,
    updateMessageStatus,
    templates,
  } = useMessages();
  const { customers, getCustomerById } = useCustomers();
  const { invoices, getInvoiceById } = useInvoices();
  const { showToast } = useNotifications();
  const { navigate, navigateToCustomer, navigateToInvoice } = useNavigation();

  // Estados de filtro e pesquisa
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<MessageChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all');

  // Modal de geração
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtro de mensagens
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Filtro de canal
      if (channelFilter !== 'all' && msg.channel !== channelFilter) return false;

      // Filtro de estado
      if (statusFilter !== 'all' && msg.status !== statusFilter) return false;

      // Filtro de pesquisa
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const customer = getCustomerById(msg.customerId);
        const invoice = msg.invoiceId ? getInvoiceById(msg.invoiceId) : undefined;

        const matchCustomer = customer?.name.toLowerCase().includes(term);
        const matchInvoice = invoice?.invoiceNumber.toLowerCase().includes(term);
        const matchBody = msg.body.toLowerCase().includes(term);
        const matchSubject = msg.subject?.toLowerCase().includes(term);

        if (!matchCustomer && !matchInvoice && !matchBody && !matchSubject) {
          return false;
        }
      }

      return true;
    });
  }, [messages, channelFilter, statusFilter, searchTerm, getCustomerById, getInvoiceById]);

  const handleCopyMessage = async (msg: GeneratedMessage) => {
    try {
      const textToCopy = msg.channel === 'email' && msg.subject
        ? `Assunto: ${msg.subject}\n\n${msg.body}`
        : msg.body;

      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(msg.id);
      await updateMessageStatus(msg.id, 'copied');
      showToast('Mensagem copiada para a área de transferência!', 'success');

      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Não foi possível copiar o texto automaticamente.', 'error');
    }
  };

  const handleOpenWhatsApp = (msg: GeneratedMessage) => {
    const customer = getCustomerById(msg.customerId);
    const phone = customer?.phone?.replace(/[^0-9]/g, '') || '';
    const encoded = encodeURIComponent(msg.body);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    updateMessageStatus(msg.id, 'prepared');
  };

  const handleDelete = async (id: string) => {
    const res = await deleteMessage(id);
    if (res.success) {
      showToast('Mensagem removida do histórico.', 'info');
    } else {
      showToast(res.error || 'Erro ao remover mensagem.', 'error');
    }
  };

  const getChannelBadge = (ch: MessageChannel) => {
    switch (ch) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            WhatsApp
          </span>
        );
      case 'sms':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Smartphone className="w-3 h-3 text-indigo-600" />
            SMS
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Mail className="w-3 h-3 text-blue-600" />
            E-mail
          </span>
        );
      case 'in_person':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" />
            Presencial
          </span>
        );
    }
  };

  const getStatusBadge = (st: MessageStatus) => {
    switch (st) {
      case 'sent_manually':
        return (
          <Badge variant="success" size="sm">
            Enviada manualmente
          </Badge>
        );
      case 'copied':
        return (
          <Badge variant="info" size="sm">
            Copiada
          </Badge>
        );
      case 'prepared':
        return (
          <Badge variant="neutral" size="sm">
            Preparada
          </Badge>
        );
      case 'generated':
        return (
          <Badge variant="neutral" size="sm">
            Gerada
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="neutral" size="sm">
            Arquivada
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Rascunho
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Mensagens de Cobrança</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Motor inteligente para gerar abordagens cordiais, profissionais e contextualizadas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('dashboard_templates')}
            leftIcon={<Layers className="w-4 h-4 text-indigo-600" />}
          >
            Modelos ({templates.length})
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setSelectedCustomerId(undefined);
              setSelectedInvoiceId(undefined);
              setIsGeneratorOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Gerar mensagem
          </Button>
        </div>
      </div>

      {/* Cartões de Métricas e Limite do Plano */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gerações neste mês
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {generationStats.currentMonthCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Limite do Plano ({account?.plan?.toUpperCase() || 'FREE'})
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {generationStats.maxAllowed === 'unlimited'
                  ? 'Ilimitado'
                  : `${generationStats.remaining} restantes`}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total no Histórico
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {messages.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Input de Pesquisa */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por cliente, fatura ou texto da mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
              />
            </div>

            {/* Filtro por Canal */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'sms', label: 'SMS' },
                  { id: 'email', label: 'E-mail' },
                  { id: 'in_person', label: 'Presencial' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChannelFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    channelFilter === tab.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mensagens no Histórico */}
      {filteredMessages.length === 0 ? (
        <Card className="bg-white border-slate-200 text-center py-12 px-4">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Nenhuma mensagem encontrada
            </h3>
            <p className="text-xs text-slate-500">
              Gere comunicações profissionais para enviar por WhatsApp, SMS, E-mail ou consultar o roteiro presencial.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedCustomerId(undefined);
                  setSelectedInvoiceId(undefined);
                  setIsGeneratorOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                + Gerar primeira mensagem
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredMessages.map((msg) => {
            const customer = getCustomerById(msg.customerId);
            const invoice = msg.invoiceId ? getInvoiceById(msg.invoiceId) : undefined;
            const isCopied = copiedId === msg.id;

            return (
              <Card
                key={msg.id}
                className="bg-white border-slate-200 hover:border-slate-300 transition-shadow hover:shadow-2xs"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Topo do cartão: Canal, Estado, Cliente, Fatura */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      {getChannelBadge(msg.channel)}
                      {getStatusBadge(msg.status)}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        Tom {msg.tone}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {formatDate(msg.createdAt)}
                    </div>
                  </div>

                  {/* Informação do Cliente e Cobrança */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {customer && (
                      <button
                        type="button"
                        onClick={() => navigateToCustomer(customer.id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {customer.name}
                      </button>
                    )}

                    {invoice && (
                      <button
                        type="button"
                        onClick={() => navigateToInvoice(invoice.id)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100/80 transition-colors"
                      >
                        {invoice.invoiceNumber} ({formatCurrency(invoice.amount)})
                      </button>
                    )}
                  </div>

                  {/* Prévia do texto */}
                  {msg.channel === 'email' && msg.subject && (
                    <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-slate-400 font-normal">Assunto: </span>
                      {msg.subject}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50/70 rounded-xl text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed border border-slate-100 max-h-48 overflow-y-auto">
                    {msg.body}
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateMessageStatus(msg.id, 'sent_manually')}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Marcar como enviada
                      </button>

                      <button
                        type="button"
                        onClick={() => updateMessageStatus(msg.id, 'archived')}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        Arquivar
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(msg.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      {msg.channel === 'whatsapp' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenWhatsApp(msg)}
                          leftIcon={<Send className="w-3.5 h-3.5 text-emerald-600" />}
                          className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                          Abrir WhatsApp
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCopyMessage(msg)}
                        leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {isCopied ? 'Copiada!' : 'Copiar texto'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal do Gerador */}
      {isGeneratorOpen && (
        <MessageGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          preselectedCustomerId={selectedCustomerId}
          preselectedInvoiceId={selectedInvoiceId}
        />
      )}
    </div>
  );
};
