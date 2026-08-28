import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { AdminAuthService } from '../../lib/adminAuthService';
import { Account, PlanType } from '../../types/database';
import {
  WebhookEventRecord,
  ExternalPaymentConfig,
  BillingTransaction,
  DetailedSubscription,
  PaymentTransactionStatus,
  SubscriptionStatus,
} from '../../types/billing';
import { BillingService } from '../../lib/billingService';
import { PLANS } from '../../config/plans';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  CreditCard,
  Webhook,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Play,
  FileCode,
  Search,
  Eye,
  Sliders,
  Sparkles,
  TrendingUp,
  Server,
  Lock,
  Clock,
  ArrowRight,
  Receipt,
  RotateCcw,
  CheckCircle,
  XCircle,
  Calendar,
  Layers,
  FileText,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

type AdminTab = 'metrics' | 'payments' | 'subscriptions' | 'accounts' | 'webhooks' | 'webhook_tester' | 'config';

export const AdminPortalView: React.FC = () => {
  const { isAdmin, user, allAccounts, findAccount, processExternalWebhook, signOut } = useAuth();
  const { navigate } = useNavigation();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<AdminTab>('metrics');
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  // Estado de verificação de sessão administrativa real com o backend
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [isSessionAuthorized, setIsSessionAuthorized] = useState(false);
  const [activeAdminEmail, setActiveAdminEmail] = useState<string>('admin@pagora.pt');

  // Webhook Logs
  const [webhookLogs, setWebhookLogs] = useState<WebhookEventRecord[]>(() =>
    BillingService.getWebhookLogs()
  );

  // Configuração de Pagamento Externo
  const [paymentConfig, setPaymentConfig] = useState<ExternalPaymentConfig>(() =>
    BillingService.getExternalConfig()
  );

  // Transações Globais
  const [allTransactions, setAllTransactions] = useState<BillingTransaction[]>(() =>
    BillingService.getAllGlobalTransactions(allAccounts)
  );

  // Subscrições Globais
  const [allSubscriptions, setAllSubscriptions] = useState<DetailedSubscription[]>(() =>
    BillingService.getAllGlobalSubscriptions(allAccounts)
  );

  // Filtros de Pagamentos
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentPlanFilter, setPaymentPlanFilter] = useState<string>('all');

  // Filtros de Subscrições
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('all');
  const [subPlanFilter, setSubPlanFilter] = useState<string>('all');

  // Filtros de Contas
  const [accountSearch, setAccountSearch] = useState('');
  const [accountPlanFilter, setAccountPlanFilter] = useState<string>('all');

  // Modal Ver Payload JSON
  const [selectedPayload, setSelectedPayload] = useState<Record<string, unknown> | null>(null);

  // Modal Detalhes da Linha Temporal de Pagamento (Secção 12.12)
  const [selectedTimelineTx, setSelectedTimelineTx] = useState<BillingTransaction | null>(null);

  // Modal Detalhes da Subscrição
  const [selectedSubDetail, setSelectedSubDetail] = useState<DetailedSubscription | null>(null);

  // Modal Detalhes da Conta
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<Account | null>(null);

  // Simulador de Webhook
  const [simEventType, setSimEventType] = useState('payment.approved');
  const [simAccountId, setSimAccountId] = useState(allAccounts[0]?.id || 'acc_pt_01');
  const [simPlan, setSimPlan] = useState<PlanType>('plus');
  const [simAmount, setSimAmount] = useState<number>(5.9);
  const [simulating, setSimulating] = useState(false);
  const [lastSimulatedEventId, setLastSimulatedEventId] = useState<string | null>(null);

  // Endpoint do Webhook
  const webhookUrl = `${window.location.origin}/api/webhooks/payment`;

  const refreshAllData = () => {
    setWebhookLogs(BillingService.getWebhookLogs());
    setAllTransactions(BillingService.getAllGlobalTransactions(allAccounts));
    setAllSubscriptions(BillingService.getAllGlobalSubscriptions(allAccounts));
  };

  useEffect(() => {
    refreshAllData();
  }, [allAccounts]);

  useEffect(() => {
    let isMounted = true;
    async function checkAdminSession() {
      setIsVerifyingSession(true);
      try {
        const res = await AdminAuthService.verifySession();
        if (!isMounted) return;

        if (res.isValid) {
          setIsSessionAuthorized(true);
          if (res.email) setActiveAdminEmail(res.email);
        } else {
          setIsSessionAuthorized(false);
        }
      } catch {
        if (!isMounted) return;
        setIsSessionAuthorized(false);
      } finally {
        if (isMounted) {
          setIsVerifyingSession(false);
        }
      }
    }

    checkAdminSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Se estiver a verificar sessão com o backend
  if (isVerifyingSession) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800">A validar sessão administrativa...</h3>
        <p className="text-xs text-slate-500 mt-1">Validação de credenciais e segurança de acesso ao servidor PAGORA.</p>
      </div>
    );
  }

  // Se não estiver autorizado, exibe bloqueio discreto e seguro
  if (!isSessionAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Esta área é confidencial e reservada à administração da PAGORA. É necessária autenticação válida no servidor para prosseguir.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('auth_login')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Iniciar Sessão
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate(user ? 'dashboard_overview' : 'landing')}
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  // Métricas Consolidadas
  const totalAccounts = allAccounts.length;
  const freeAccounts = allAccounts.filter((a) => a.plan === 'free').length;
  const plusAccounts = allAccounts.filter((a) => a.plan === 'plus').length;
  const proAccounts = allAccounts.filter((a) => a.plan === 'pro').length;

  const totalMRR =
    plusAccounts * PLANS.plus.priceMonthly + proAccounts * PLANS.pro.priceMonthly;

  // Métricas de Pagamentos
  const totalPaymentsCount = allTransactions.length;
  const approvedPayments = allTransactions.filter((t) => t.status === 'paid');
  const pendingPayments = allTransactions.filter((t) => t.status === 'pending');
  const declinedPayments = allTransactions.filter((t) => t.status === 'declined' || t.status === 'failed');
  const refundedPayments = allTransactions.filter((t) => t.status === 'refunded');
  const cancelledPayments = allTransactions.filter((t) => t.status === 'cancelled');

  const totalRevenue = approvedPayments.reduce((acc, t) => acc + t.amount, 0);

  // Subscrições Ativas
  const activeSubsCount = allSubscriptions.filter((s) => s.status === 'active').length;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedEndpoint(true);
    showToast('URL do Webhook copiado para a área de transferência.', 'info');
    setTimeout(() => setCopiedEndpoint(false), 3000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    BillingService.saveExternalConfig(paymentConfig);
    showToast('Configurações de integração externa guardadas com sucesso.', 'success');
  };

  // Disparo de Simulação de Webhook
  const handleSimulateWebhook = async (customEventId?: string) => {
    setSimulating(true);
    const eventId = customEventId || `evt_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setLastSimulatedEventId(eventId);

    const eventRecord: WebhookEventRecord = {
      id: `wh_${Date.now()}`,
      eventId,
      eventType: simEventType,
      receivedAt: new Date().toISOString(),
      status: 'received',
      processingAttempts: 1,
      accountId: simAccountId,
      planId: simPlan,
      payload: {
        id: eventId,
        type: simEventType,
        amount: simAmount,
        currency: 'EUR',
        metadata: {
          account_id: simAccountId,
          plan: simPlan,
        },
        payment_method: 'MB WAY Gateway',
        customer_email: 'ricardo@pagora.pt',
        customer_name: 'Ricardo Tembe',
        timestamp: new Date().toISOString(),
      },
    };

    const result = processExternalWebhook(eventRecord);
    setSimulating(false);
    refreshAllData();

    if (result.status === 'already_processed') {
      showToast(`[IDEMPOTÊNCIA] ${result.message}`, 'info');
    } else if (result.success) {
      showToast(`[${simEventType}] ${result.message}`, 'success');
    } else {
      showToast(`[${result.status.toUpperCase()}] ${result.message}`, 'warning');
    }
  };

  // Reprocessar Log de Webhook
  const handleReprocessWebhook = (event: WebhookEventRecord) => {
    const res = processExternalWebhook(event);
    refreshAllData();
    showToast(`Resultado do reprocessamento: ${res.message}`, res.success ? 'info' : 'warning');
  };

  // Filtragem de Pagamentos
  const filteredPayments = allTransactions.filter((tx) => {
    const q = paymentSearch.toLowerCase();
    const matchesSearch =
      tx.invoiceNumber.toLowerCase().includes(q) ||
      tx.accountId.toLowerCase().includes(q) ||
      (tx.accountName && tx.accountName.toLowerCase().includes(q)) ||
      (tx.userEmail && tx.userEmail.toLowerCase().includes(q)) ||
      (tx.userName && tx.userName.toLowerCase().includes(q)) ||
      (tx.externalPaymentId && tx.externalPaymentId.toLowerCase().includes(q)) ||
      (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q));

    if (paymentStatusFilter !== 'all' && tx.status !== paymentStatusFilter) return false;
    if (paymentPlanFilter !== 'all' && tx.plan !== paymentPlanFilter) return false;
    return matchesSearch;
  });

  // Filtragem de Subscrições
  const filteredSubscriptions = allSubscriptions.filter((sub) => {
    const q = subSearch.toLowerCase();
    const matchesSearch =
      sub.id.toLowerCase().includes(q) ||
      sub.accountId.toLowerCase().includes(q) ||
      (sub.accountName && sub.accountName.toLowerCase().includes(q)) ||
      (sub.userEmail && sub.userEmail.toLowerCase().includes(q)) ||
      (sub.userName && sub.userName.toLowerCase().includes(q)) ||
      (sub.externalSubscriptionId && sub.externalSubscriptionId.toLowerCase().includes(q));

    if (subStatusFilter !== 'all' && sub.status !== subStatusFilter) return false;
    if (subPlanFilter !== 'all' && sub.plan !== subPlanFilter) return false;
    return matchesSearch;
  });

  // Filtragem de Contas
  const filteredAccounts = allAccounts.filter((acc) => {
    const q = accountSearch.toLowerCase();
    const matchesSearch =
      acc.name.toLowerCase().includes(q) ||
      acc.id.toLowerCase().includes(q) ||
      (acc.taxId && acc.taxId.toLowerCase().includes(q));

    if (accountPlanFilter !== 'all' && acc.plan !== accountPlanFilter) return false;
    return matchesSearch;
  });

  // Helper para Badge de Estado do Pagamento
  const renderPaymentStatusBadge = (status: PaymentTransactionStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pendente</Badge>;
      case 'declined':
      case 'failed':
        return <Badge variant="danger" size="sm">Recusado</Badge>;
      case 'refunded':
        return <Badge variant="neutral" size="sm" className="bg-purple-100 text-purple-800 border-purple-200">Reembolsado</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="sm">Cancelado</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  // Helper para Badge de Estado da Subscrição
  const renderSubStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Ativa</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="sm">Cancelada</Badge>;
      case 'expired':
        return <Badge variant="neutral" size="sm">Expirada</Badge>;
      case 'refunded':
        return <Badge variant="neutral" size="sm" className="bg-purple-100 text-purple-800 border-purple-200">Reembolsada</Badge>;
      case 'payment_failed':
        return <Badge variant="danger" size="sm">Falha no Pagamento</Badge>;
      case 'suspended':
        return <Badge variant="danger" size="sm">Suspensa</Badge>;
      case 'requires_review':
        return <Badge variant="warning" size="sm">Requer Revisão</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Proprietário */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Painel do Proprietário
                </h1>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/40">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervisão de subscrições, transações, reconciliação de webhooks e regras de faturação.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">{activeAdminEmail}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await AdminAuthService.logout();
              signOut();
              showToast('Sessão administrativa terminada com sucesso.', 'info');
              navigate('auth_login');
            }}
            className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white text-xs gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Terminar Sessão
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(user ? 'dashboard_overview' : 'landing')}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar à Aplicação
          </Button>
        </div>
      </div>

      {/* Navegação por Tabs do Admin */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'metrics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Visão Geral & MRR
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          Pagamentos ({totalPaymentsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'subscriptions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          Subscrições ({allSubscriptions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'accounts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Espaços de Trabalho ({totalAccounts})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'webhooks'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Webhook className="w-4 h-4" />
          Webhooks & Idempotência ({webhookLogs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhook_tester')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'webhook_tester'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Play className="w-4 h-4 text-amber-400" />
          Simulador de Eventos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'config'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Configurações
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL & MRR */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Cartões de Indicadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">MRR Consolidado</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalMRR)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                Receita Mensal Recorrente
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Subscritores Pagantes</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                {plusAccounts + proAccounts}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">
                {plusAccounts} PLUS (5,90 €) • {proAccounts} PRO (11,90 €)
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Receita Total Liquidada</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalRevenue)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">
                {approvedPayments.length} transações aprovadas
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Eventos de Webhook</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {webhookLogs.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                Idempotência e Auditoria Ativas
              </span>
            </Card>
          </div>

          {/* Estado do Webhook do Servidor */}
          <Card className="p-6 bg-slate-900 text-white shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Endpoint Oficial de Webhooks</h3>
                  <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    Online & Ativo
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  Configure este URL no portal da instituição financeira (Stripe, Ifthenpay, EuPago ou gateway MB WAY) para ativação e cancelamento automático de planos.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={copyWebhookUrl}
                className="gap-2 bg-white text-slate-900 hover:bg-slate-100 font-bold shrink-0"
              >
                {copiedEndpoint ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedEndpoint ? 'Copiado!' : 'Copiar URL do Webhook'}
              </Button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-black/40 border border-slate-800 font-mono text-xs text-indigo-300 flex items-center justify-between">
              <span className="truncate">{webhookUrl}</span>
              <span className="text-[10px] text-slate-400 ml-2 uppercase font-sans font-semibold">POST / JSON</span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: PAGAMENTOS (Secção 12.10 & 12.12) */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Métricas de Pagamentos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3 bg-white border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Pagamentos</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{totalPaymentsCount}</div>
            </Card>

            <Card className="p-3 bg-white border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600 block">Aprovados</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">{approvedPayments.length}</div>
            </Card>

            <Card className="p-3 bg-white border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-600 block">Pendentes</span>
              <div className="text-lg font-bold text-amber-700 mt-0.5">{pendingPayments.length}</div>
            </Card>

            <Card className="p-3 bg-white border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-red-600 block">Recusados / Falhas</span>
              <div className="text-lg font-bold text-red-700 mt-0.5">{declinedPayments.length}</div>
            </Card>

            <Card className="p-3 bg-white border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-purple-600 block">Reembolsos</span>
              <div className="text-lg font-bold text-purple-700 mt-0.5">{refundedPayments.length}</div>
            </Card>

            <Card className="p-3 bg-white border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Cancelamentos</span>
              <div className="text-lg font-bold text-slate-700 mt-0.5">{cancelledPayments.length}</div>
            </Card>
          </div>

          {/* Tabela de Pagamentos */}
          <Card className="p-6 bg-white border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Histórico de Transações de Pagamento</h3>
                <p className="text-xs text-slate-500">
                  Consulte todos os pagamentos registados, referências externas e linhas temporais auditáveis.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Pesquisar recibo, e-mail..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="all">Todos os Estados</option>
                  <option value="paid">Aprovado</option>
                  <option value="pending">Pendente</option>
                  <option value="declined">Recusado</option>
                  <option value="refunded">Reembolsado</option>
                  <option value="cancelled">Cancelado</option>
                </select>

                <select
                  value={paymentPlanFilter}
                  onChange={(e) => setPaymentPlanFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="all">Todos os Planos</option>
                  <option value="plus">PLUS</option>
                  <option value="pro">PRO</option>
                </select>

                <Button variant="secondary" size="sm" onClick={refreshAllData} className="gap-1 text-xs h-8">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhuma transação encontrada com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Data / Recibo</th>
                      <th className="py-2.5 px-3">Utilizador & E-mail</th>
                      <th className="py-2.5 px-3">Conta / Workspace</th>
                      <th className="py-2.5 px-3">Plano</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Método / Origem</th>
                      <th className="py-2.5 px-3">ID Externo</th>
                      <th className="py-2.5 px-3 text-right">Linha Temporal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{tx.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{tx.userName || 'Utilizador Pagora'}</div>
                          <div className="text-[11px] text-slate-500">{tx.userEmail || 'ricardo@pagora.pt'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700">{tx.accountName || tx.accountId}</span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={tx.plan === 'pro' ? 'success' : 'primary'} size="sm">
                            {tx.plan.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(tx.amount)}
                        </td>
                        <td className="py-3 px-3">
                          {renderPaymentStatusBadge(tx.status)}
                        </td>
                        <td className="py-3 px-3">
                          <div>{tx.paymentMethod || 'Cartão'}</div>
                          <div className="text-[10px] text-slate-400">{tx.origin || 'Checkout'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {tx.externalPaymentId || tx.externalReference || '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedTimelineTx(tx)}
                            className="text-xs h-7 gap-1 text-indigo-600 hover:text-indigo-700"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Ver Timeline
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: SUBSCRIÇÕES (Secção 12.11) */}
      {activeTab === 'subscriptions' && (
        <Card className="p-6 bg-white border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gestão Global de Subscrições</h3>
              <p className="text-xs text-slate-500">
                Audite e consulte o ciclo de vida, renovações, estados e histórico de cada subscrição.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar conta, titular..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={subStatusFilter}
                onChange={(e) => setSubStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">Todos os Estados</option>
                <option value="active">Ativa</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelada</option>
                <option value="payment_failed">Falha Pagamento</option>
              </select>

              <select
                value={subPlanFilter}
                onChange={(e) => setSubPlanFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">Todos os Planos</option>
                <option value="free">FREE</option>
                <option value="plus">PLUS</option>
                <option value="pro">PRO</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Empresa / Workspace</th>
                  <th className="py-2.5 px-3">Titular & E-mail</th>
                  <th className="py-2.5 px-3">Plano</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Data Início</th>
                  <th className="py-2.5 px-3">Próxima Renovação</th>
                  <th className="py-2.5 px-3">Último Pagamento</th>
                  <th className="py-2.5 px-3">ID Subscrição</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {sub.accountName || sub.accountId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{sub.userName || 'Titular Pagora'}</div>
                      <div className="text-[11px] text-slate-500">{sub.userEmail || 'ricardo@pagora.pt'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={sub.plan === 'pro' ? 'success' : sub.plan === 'plus' ? 'primary' : 'neutral'}
                        size="sm"
                      >
                        {sub.plan.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {renderSubStatusBadge(sub.status)}
                    </td>
                    <td className="py-3 px-3">
                      {new Date(sub.currentPeriodStart).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-3 px-3">
                      {sub.cancelAtPeriodEnd ? (
                        <span className="text-amber-600 font-semibold">Expira no fim do ciclo</span>
                      ) : (
                        new Date(sub.currentPeriodEnd).toLocaleDateString('pt-PT')
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {sub.lastPaymentDate ? (
                        <div>
                          <span className="font-semibold text-slate-900">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sub.lastPaymentAmount || sub.priceMonthly)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(sub.lastPaymentDate).toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {sub.externalSubscriptionId || sub.id}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSubDetail(sub)}
                        className="text-xs h-7 gap-1 text-indigo-600 hover:text-indigo-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: ESPAÇOS DE TRABALHO */}
      {activeTab === 'accounts' && (
        <Card className="p-6 bg-white border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Espaços de Trabalho Registados</h3>
              <p className="text-xs text-slate-500">
                Consulte todos os tenants, NIFs e setores de atividade na Pagora.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, NIF..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={accountPlanFilter}
                onChange={(e) => setAccountPlanFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">Todos os Planos</option>
                <option value="free">Plano FREE</option>
                <option value="plus">Plano PLUS</option>
                <option value="pro">Plano PRO</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Conta / Empresa</th>
                  <th className="py-2.5 px-3">ID da Conta</th>
                  <th className="py-2.5 px-3">NIF</th>
                  <th className="py-2.5 px-3">Plano Atual</th>
                  <th className="py-2.5 px-3">Atividade</th>
                  <th className="py-2.5 px-3">Data de Registo</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {acc.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {acc.id}
                    </td>
                    <td className="py-3 px-3">{acc.taxId || '—'}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={acc.plan === 'pro' ? 'success' : acc.plan === 'plus' ? 'primary' : 'neutral'}
                        size="sm"
                      >
                        {acc.plan.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">{acc.activityType || 'Geral'}</td>
                    <td className="py-3 px-3">
                      {new Date(acc.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAccountDetail(acc)}
                        className="text-xs h-7 gap-1 text-indigo-600 hover:text-indigo-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: LOGS DE WEBHOOK & IDEMPOTÊNCIA */}
      {activeTab === 'webhooks' && (
        <Card className="p-6 bg-white border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Histórico de Eventos de Webhook</h3>
              <p className="text-xs text-slate-500">
                Registo de payloads externos recebidos, validação de assinatura e estado de idempotência.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={refreshAllData}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </Button>
          </div>

          {webhookLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhum evento de webhook registado ainda. Dispare um teste no Simulador.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Event ID</th>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Tipo de Evento</th>
                    <th className="py-2.5 px-3">Conta Alvo</th>
                    <th className="py-2.5 px-3">Plano</th>
                    <th className="py-2.5 px-3">Tentativas</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800 text-[11px]">
                        {log.eventId}
                      </td>
                      <td className="py-3 px-3">
                        {new Date(log.receivedAt).toLocaleTimeString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-indigo-700 font-semibold">
                        {log.eventType}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {log.accountId || '—'}
                      </td>
                      <td className="py-3 px-3">
                        {log.planId ? (
                          <Badge variant={log.planId === 'pro' ? 'success' : 'primary'} size="sm">
                            {log.planId.toUpperCase()}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {log.processingAttempts || 1}x
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            log.status === 'processed'
                              ? 'success'
                              : log.status === 'requires_review'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {log.status === 'processed'
                            ? 'Processado'
                            : log.status === 'requires_review'
                            ? 'Revisão'
                            : 'Falhado'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayload(log.payload)}
                          className="text-xs h-7 gap-1"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          JSON
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReprocessWebhook(log)}
                          className="text-xs h-7 gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reprocessar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 6: SIMULADOR DE WEBHOOKS & TESTES DE IDEMPOTÊNCIA */}
      {activeTab === 'webhook_tester' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-slate-200 shadow-xs md:col-span-2 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Simulador de Eventos de Pagamento</h3>
                  <Badge variant="warning" size="sm">
                    Ambiente de Testes / Simulação
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dispare eventos simulando provedores externos (Stripe, MB WAY, Multibanco) para verificar a validação e idempotência. Não representa um pagamento financeiro real.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={simEventType}
                    onChange={(e) => setSimEventType(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="payment.approved">payment.approved (Pagamento Aprovado)</option>
                    <option value="payment.pending">payment.pending (Pagamento Pendente)</option>
                    <option value="payment.failed">payment.failed (Pagamento Falhado / Recusado)</option>
                    <option value="payment.refunded">payment.refunded (Reembolso Efetuado)</option>
                    <option value="subscription.cancelled">subscription.cancelled (Cancelamento)</option>
                    <option value="subscription.renewed">subscription.renewed (Renovação)</option>
                    <option value="unknown_event">evento_invalido (Requer Revisão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Conta Alvo
                  </label>
                  <select
                    value={simAccountId}
                    onChange={(e) => setSimAccountId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {allAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.id}) — {acc.plan.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plano a Ativar
                  </label>
                  <select
                    value={simPlan}
                    onChange={(e) => setSimPlan(e.target.value as PlanType)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="plus">PLUS (5,90 € /mês)</option>
                    <option value="pro">PRO (11,90 € /mês)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Simulado (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  O processador testa a idempotência estrita, atualiza os dados da conta em tempo real e gera a timeline completa de pagamento.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => handleSimulateWebhook()}
                  disabled={simulating}
                  className="gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  {simulating ? 'A disparar evento...' : 'Disparar Novo Evento de Teste'}
                </Button>

                {lastSimulatedEventId && (
                  <Button
                    variant="secondary"
                    onClick={() => handleSimulateWebhook(lastSimulatedEventId)}
                    disabled={simulating}
                    className="gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Testar Reenvio Idempotente ({lastSimulatedEventId.slice(-8)})
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Guia de Idempotência */}
          <Card className="p-6 bg-white border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Regras do Motor de Webhooks
            </h4>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Idempotência Estrita:</strong> Se o gateway reenviar o mesmo <code>event_id</code>, a Pagora responde HTTP 200 sem duplicar transações ou conceder períodos redundantes.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Preservação de Dados:</strong> Reembolsos ou cancelamentos nunca eliminam clientes, faturas ou relatórios históricos existentes.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Modelo Cumulativo:</strong> A ativação do plano PRO desbloqueia automaticamente todos os recursos do PLUS e do FREE.
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: CONFIGURAÇÃO DE PAGAMENTOS */}
      {activeTab === 'config' && (
        <Card className="p-6 bg-white border-slate-200 shadow-xs max-w-2xl">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-base font-bold text-slate-900">Configuração de Integração de Pagamento</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Parâmetros de assinatura e identificadores de produto dos gateways externos.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Segredo de Assinatura do Webhook (Webhook Secret)
              </label>
              <Input
                type="password"
                value={paymentConfig.webhookSecret}
                onChange={(e) => setPaymentConfig({ ...paymentConfig, webhookSecret: e.target.value })}
                placeholder="whsec_..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Utilizado para validar o cabeçalho <code>x-pagora-signature</code> (HMAC SHA256).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product ID (Plano PLUS)
                </label>
                <Input
                  value={paymentConfig.plusProductId}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, plusProductId: e.target.value })}
                  placeholder="prod_plus_eur"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product ID (Plano PRO)
                </label>
                <Input
                  value={paymentConfig.proProductId}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, proProductId: e.target.value })}
                  placeholder="prod_pro_eur"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ambiente de Execução
                </label>
                <select
                  value={paymentConfig.environment}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, environment: e.target.value as any })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="sandbox">Sandbox / Modo de Testes</option>
                  <option value="production">Produção</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moeda Oficial
                </label>
                <Input value="EUR (€)" disabled className="bg-slate-100 text-slate-500" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary">
                Guardar Configurações
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* MODAL: LINHA TEMPORAL DO PAGAMENTO (Secção 12.12) */}
      {selectedTimelineTx && (
        <Modal
          isOpen={Boolean(selectedTimelineTx)}
          onClose={() => setSelectedTimelineTx(null)}
          title={`Linha Temporal: ${selectedTimelineTx.invoiceNumber}`}
        >
          <div className="space-y-5 text-xs text-slate-700">
            {/* Cabeçalho do Pagamento */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Montante:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(selectedTimelineTx.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Plano:</span>
                <Badge variant={selectedTimelineTx.plan === 'pro' ? 'success' : 'primary'} size="sm">
                  {selectedTimelineTx.plan.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Estado:</span>
                {renderPaymentStatusBadge(selectedTimelineTx.status)}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Método:</span>
                <span className="font-semibold text-slate-800">{selectedTimelineTx.paymentMethod || 'Cartão'}</span>
              </div>
            </div>

            {/* Visual Timeline (Secção 12.12) */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Etapas do Ciclo de Vida do Pagamento
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(selectedTimelineTx.timeline || []).map((step, idx) => {
                  const isCompleted = step.status === 'completed';
                  const isFailed = step.status === 'failed';
                  const isCurrent = step.status === 'current';

                  return (
                    <div key={idx} className="relative group">
                      {/* Ponto / Ícone */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ring-4 ring-white ${
                          isFailed
                            ? 'bg-red-500'
                            : isCompleted
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-amber-500'
                            : 'bg-slate-300'
                        }`}
                      >
                        {isFailed ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : isCompleted ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs">{step.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(step.timestamp).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                        {step.detail && (
                          <p className="text-[11px] text-slate-400 mt-1 bg-slate-50 p-1.5 rounded font-mono">
                            {step.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metadados Técnicos */}
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1 font-mono">
              <div><strong>ID Interno:</strong> {selectedTimelineTx.id}</div>
              <div><strong>ID Externo:</strong> {selectedTimelineTx.externalPaymentId || '—'}</div>
              <div><strong>Conta:</strong> {selectedTimelineTx.accountName || selectedTimelineTx.accountId}</div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedTimelineTx(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: DETALHES DA SUBSCRIÇÃO (Secção 12.11) */}
      {selectedSubDetail && (
        <Modal
          isOpen={Boolean(selectedSubDetail)}
          onClose={() => setSelectedSubDetail(null)}
          title={`Subscrição: ${selectedSubDetail.accountName || selectedSubDetail.accountId}`}
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[11px]">Plano:</span>
                <Badge
                  variant={selectedSubDetail.plan === 'pro' ? 'success' : selectedSubDetail.plan === 'plus' ? 'primary' : 'neutral'}
                  size="sm"
                >
                  {selectedSubDetail.plan.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Estado:</span>
                {renderSubStatusBadge(selectedSubDetail.status)}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Preço Mensal:</span>
                <span className="font-bold text-slate-900">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(selectedSubDetail.priceMonthly)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Origem:</span>
                <span>{selectedSubDetail.origin || 'Checkout Online'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Início do Período:</span>
                <span>{new Date(selectedSubDetail.currentPeriodStart).toLocaleDateString('pt-PT')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Fim do Período / Renovação:</span>
                <span>{new Date(selectedSubDetail.currentPeriodEnd).toLocaleDateString('pt-PT')}</span>
              </div>
            </div>

            {selectedSubDetail.cancelAtPeriodEnd && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                <strong>Cancelamento Agendado:</strong> O utilizador solicitou o cancelamento. O plano permanece ativo até {new Date(selectedSubDetail.currentPeriodEnd).toLocaleDateString('pt-PT')}, transitando depois para FREE com salvaguarda total de dados.
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-500">
              <div><strong>ID Subscrição:</strong> {selectedSubDetail.id}</div>
              <div><strong>ID Externo:</strong> {selectedSubDetail.externalSubscriptionId || '—'}</div>
              <div><strong>ID Cliente Externo:</strong> {selectedSubDetail.externalCustomerId || '—'}</div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedSubDetail(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: VER PAYLOAD JSON */}
      {selectedPayload && (
        <Modal
          isOpen={Boolean(selectedPayload)}
          onClose={() => setSelectedPayload(null)}
          title="Payload JSON do Webhook"
        >
          <div className="space-y-4">
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs max-h-96 overflow-y-auto">
              <pre>{JSON.stringify(selectedPayload, null, 2)}</pre>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedPayload(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: DETALHES DA CONTA */}
      {selectedAccountDetail && (
        <Modal
          isOpen={Boolean(selectedAccountDetail)}
          onClose={() => setSelectedAccountDetail(null)}
          title={`Espaço de Trabalho: ${selectedAccountDetail.name}`}
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Informações Gerais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">ID da Conta:</span>
                <span className="font-mono font-bold text-slate-800">{selectedAccountDetail.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Plano:</span>
                <Badge variant={selectedAccountDetail.plan === 'pro' ? 'success' : selectedAccountDetail.plan === 'plus' ? 'primary' : 'neutral'} size="sm">
                  {selectedAccountDetail.plan.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">NIF / Tax ID:</span>
                <span className="font-bold text-slate-800">{selectedAccountDetail.taxId || 'Não definido'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Setor / Atividade:</span>
                <span>{selectedAccountDetail.activityType || 'Geral'}</span>
              </div>
            </div>

            {/* Quotas & Limites do Plano */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="font-bold text-slate-900 block text-xs mb-2">Quotas Autorizadas (Plano {PLANS[selectedAccountDetail.plan].name})</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Clientes:</span>
                  <span className="font-bold">{PLANS[selectedAccountDetail.plan].limits.maxCustomers}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Faturas /mês:</span>
                  <span className="font-bold">{PLANS[selectedAccountDetail.plan].limits.maxInvoicesPerMonth}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mensagens /mês:</span>
                  <span className="font-bold">{PLANS[selectedAccountDetail.plan].limits.maxMessageGenerationsPerMonth}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Modelos Personalizados:</span>
                  <span className="font-bold">{PLANS[selectedAccountDetail.plan].limits.customTemplates}</span>
                </div>
              </div>
            </div>

            {/* Histórico de Pagamentos da Conta */}
            <div>
              <span className="font-bold text-slate-900 block text-xs mb-1.5">Pagamentos Associados</span>
              {allTransactions.filter((t) => t.accountId === selectedAccountDetail.id).length === 0 ? (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400 text-center text-[11px]">
                  Nenhum pagamento registado nesta conta até ao momento.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {allTransactions
                    .filter((t) => t.accountId === selectedAccountDetail.id)
                    .map((tx) => (
                      <div key={tx.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-slate-800">{tx.invoiceNumber}</span>
                          <span className="text-slate-400 ml-2">{new Date(tx.createdAt).toLocaleDateString('pt-PT')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(tx.amount)}
                          </span>
                          {renderPaymentStatusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Eventos de Webhook Associados */}
            <div>
              <span className="font-bold text-slate-900 block text-xs mb-1.5">Logs de Webhook Associados</span>
              {webhookLogs.filter((w) => w.accountId === selectedAccountDetail.id).length === 0 ? (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400 text-center text-[11px]">
                  Nenhum evento de webhook recebido para esta conta.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {webhookLogs
                    .filter((w) => w.accountId === selectedAccountDetail.id)
                    .map((w) => (
                      <div key={w.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-indigo-700 font-semibold">{w.eventType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[10px]">{w.eventId}</span>
                          <Badge variant={w.status === 'processed' ? 'success' : 'warning'} size="sm">
                            {w.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedAccountDetail(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
