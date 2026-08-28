import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useMessages } from '../../context/MessageContext';
import { PLANS } from '../../config/plans';
import { isCheckoutConfigured, buildCheckoutUrl } from '../../config/checkoutConfig';
import { PlanType } from '../../types/database';
import { BillingTransaction } from '../../types/billing';
import { getPlanUsage } from '../../lib/permissions';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Users,
  MessageSquare,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  Eye,
  XCircle,
  RotateCcw,
  CheckCircle,
  Info,
  Calendar,
  Lock,
  Minus,
} from 'lucide-react';

export const PlansView: React.FC = () => {
  const {
    user,
    account,
    subscription,
    billingHistory,
    upgradePlan,
    downgradePlan,
    cancelUserSubscription,
  } = useAuth();

  const { showToast } = useNotifications();
  const { customers } = useCustomers();
  const { invoices } = useInvoices();
  const { templates } = useMessages();

  // Modal Upgrade
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<PlanType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'card' | 'multibanco'>('mbway');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Modal Downgrade
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<PlanType | null>(null);
  const [isDowngrading, setIsDowngrading] = useState(false);

  // Modal Cancelamento
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  // Modal Timeline do Pagamento (Secção 12.12)
  const [selectedTxTimeline, setSelectedTxTimeline] = useState<BillingTransaction | null>(null);

  // Modal Recibo / Fatura Detalhada
  const [selectedReceipt, setSelectedReceipt] = useState<BillingTransaction | null>(null);

  const currentPlanType: PlanType = account?.plan || 'free';
  const currentPlanConfig = PLANS[currentPlanType];

  // Cálculo das quotas e métricas de utilização
  const usageMetrics = getPlanUsage(account, {
    customersCount: customers.length,
    invoicesThisMonth: invoices.length,
    messagesGeneratedThisMonth: 12,
    customTemplatesCount: templates.filter((t) => !t.isDefault || t.isCustom).length,
  });

  const handleExecuteUpgrade = async () => {
    if (!targetUpgradePlan) return;

    // 1. PROIBIÇÃO ABSOLUTA DE ATIVAÇÃO SEM PAGAMENTO
    // Se o checkout externo estiver configurado nas variáveis de ambiente
    if (targetUpgradePlan === 'plus' || targetUpgradePlan === 'pro') {
      if (isCheckoutConfigured(targetUpgradePlan)) {
        const checkoutUrl = buildCheckoutUrl(targetUpgradePlan, {
          accountId: account?.id,
          customerEmail: user?.email,
          workspaceName: account?.name,
        });

        if (checkoutUrl) {
          window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
          showToast(
            `A abrir o checkout seguro de ${PLANS[targetUpgradePlan].name}. O plano será ativado automaticamente assim que a instituição financeira validar o pagamento via Webhook.`,
            'info'
          );
          setTargetUpgradePlan(null);
          return;
        }
      } else {
        // Se as variáveis de checkout não estiverem configuradas, impedir falsa ativação
        showToast(
          `O link de checkout para ${PLANS[targetUpgradePlan].name} ainda não foi configurado nesta instância (VITE_${targetUpgradePlan.toUpperCase()}_CHECKOUT_URL). Não é permitida a ativação de planos pagos sem confirmação do gateway.`,
          'warning'
        );
        setTargetUpgradePlan(null);
        return;
      }
    }
  };

  const handleExecuteDowngrade = async () => {
    if (!targetDowngradePlan) return;
    setIsDowngrading(true);

    const res = await downgradePlan(targetDowngradePlan);
    setIsDowngrading(false);

    if (res.success) {
      setTargetDowngradePlan(null);
      showToast(
        `O seu plano foi alterado para ${PLANS[targetDowngradePlan].name}. Todos os seus dados existentes foram preservados.`,
        'info'
      );
    } else {
      showToast(res.error || 'Erro ao alterar plano.', 'error');
    }
  };

  const handleExecuteCancel = async () => {
    setIsCanceling(true);
    const res = await cancelUserSubscription(cancelReason || 'Cancelamento solicitado pelo utilizador', false);
    setIsCanceling(false);

    if (res.success) {
      setIsCancelModalOpen(false);
      setCancelReason('');
      showToast(
        'Cancelamento agendado. Continuará a ter acesso até ao término do período faturado.',
        'info'
      );
    } else {
      showToast(res.error || 'Erro ao cancelar subscrição.', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Planos, Limites & Subscrição
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Acompanhe o consumo da sua conta, consulte o histórico de faturas e escolha o plano ideal para o seu negócio.
        </p>
      </div>

      {/* BANNER DE ESTADO REAL DA SUBSCRIÇÃO (Secção 12.13) */}
      {subscription.status === 'pending' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-amber-900 mb-0.5">
              Estamos a aguardar a confirmação do pagamento
            </p>
            <p className="text-amber-800">
              As funcionalidades pagas serão ativadas assim que a instituição financeira validar a transação através do nosso sistema de webhooks.
            </p>
          </div>
        </div>
      )}

      {subscription.status === 'payment_failed' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-900 mb-0.5">
              O pagamento mais recente não foi concluído
            </p>
            <p className="text-red-800">
              O seu plano e dados históricos permanecem totalmente seguros. Por favor tente novamente através de outro método de pagamento.
            </p>
          </div>
        </div>
      )}

      {subscription.cancelAtPeriodEnd && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-blue-900 mb-0.5">
              Cancelamento Agendado no Fim do Ciclo
            </p>
            <p className="text-blue-800">
              O seu acesso a <strong>{currentPlanConfig.name}</strong> permanece ativo até {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-PT')}. Não haverá renovação automática e nenhum dado histórico será eliminado.
            </p>
          </div>
        </div>
      )}

      {/* Cartão do Plano Atual & Quotas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhes do Plano Atual - Alto Contraste & Responsivo */}
        <Card className="p-5 sm:p-6 bg-slate-900 border-2 border-slate-700 text-white shadow-md flex flex-col justify-between rounded-xl">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                Plano Atual da Conta
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500 text-white border border-indigo-400">
                {subscription.status === 'active' ? 'Subscrição Ativa' : subscription.status.toUpperCase()}
              </span>
            </div>

            <div className="mb-2">
              <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
                Plano atual
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">
                {currentPlanConfig.name}
              </h2>
            </div>

            <div className="flex items-baseline gap-1 text-white text-sm mb-4">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {formatCurrency(currentPlanConfig.priceMonthly)}
              </span>
              <span className="text-slate-200 font-medium">/mês</span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mb-5">
              {currentPlanConfig.description}
            </p>

            <div className="space-y-2 text-xs text-slate-100 pt-4 border-t border-slate-700/80">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Renovação / Ciclo:</span>
                <span className="font-bold text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-PT')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Método de Cobrança:</span>
                <span className="font-bold text-white">MB WAY / Cartão</span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="p-2.5 rounded-lg bg-amber-900/60 text-amber-200 text-[11px] border border-amber-600 mt-2 font-medium">
                  A subscrição terminará no final do ciclo atual ({new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-PT')}).
                </div>
              )}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {currentPlanType !== 'free' && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full sm:w-auto text-xs text-slate-300 hover:text-white hover:bg-slate-800 justify-center"
              >
                Cancelar Subscrição
              </Button>
            )}
            {currentPlanType !== 'pro' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTargetUpgradePlan(currentPlanType === 'free' ? 'plus' : 'pro')}
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs justify-center ml-auto"
              >
                Fazer Upgrade
              </Button>
            )}
          </div>
        </Card>

        {/* Quotas e Utilização */}
        <Card className="lg:col-span-2 p-6 bg-white border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Utilização & Limites Mensais</h3>
                <p className="text-xs text-slate-500">
                  Consumo em tempo real no espaço de trabalho ativo.
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                Ciclo Atual
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clientes */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Clientes Ativos
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {usageMetrics.customersCount} /{' '}
                    {usageMetrics.maxCustomers === 'unlimited' ? 'Ilimitado' : usageMetrics.maxCustomers}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      usageMetrics.customersUsagePercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${usageMetrics.maxCustomers === 'unlimited' ? 25 : usageMetrics.customersUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Faturas / Cobranças */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    Cobranças no Mês
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {usageMetrics.invoicesThisMonth} /{' '}
                    {usageMetrics.maxInvoicesPerMonth === 'unlimited' ? 'Ilimitado' : usageMetrics.maxInvoicesPerMonth}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      usageMetrics.invoicesUsagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${usageMetrics.maxInvoicesPerMonth === 'unlimited' ? 20 : usageMetrics.invoicesUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Mensagens Geradas */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    Mensagens Geradas
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {usageMetrics.messagesGeneratedThisMonth} /{' '}
                    {usageMetrics.maxMessagesPerMonth === 'unlimited' ? 'Ilimitado' : usageMetrics.maxMessagesPerMonth}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${usageMetrics.maxMessagesPerMonth === 'unlimited' ? 15 : usageMetrics.messagesUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Modelos Personalizados */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    Modelos Personalizados
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {usageMetrics.customTemplatesCount} /{' '}
                    {usageMetrics.maxCustomTemplates === 'unlimited' ? 'Ilimitado' : usageMetrics.maxCustomTemplates}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600"
                    style={{ width: `${usageMetrics.maxCustomTemplates === 'unlimited' ? 10 : usageMetrics.templatesUsagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              O modelo de planos da Pagora é cumulativo. O <strong>Plano PRO</strong> inclui todas as funcionalidades do FREE e do PLUS sem quaisquer restrições de volume.
            </span>
          </div>

        </Card>
      </div>

      {/* Tabela Comparativa de Planos */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-bold text-slate-900">Planos & Preços Transparentes</h2>
          <p className="text-xs text-slate-500 mt-1">
            Escolha o nível de controlo e automação ideal para a sua gestão financeira.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE */}
          <Card
            className={`p-6 bg-white border-2 rounded-2xl flex flex-col justify-between relative transition-all ${
              currentPlanType === 'free' ? 'border-indigo-600 shadow-md' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {currentPlanType === 'free' && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
                Plano Atual
              </span>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">FREE</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Essencial para profissionais independentes e microempresas.
              </p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-black text-slate-900">0,00 €</span>
                <span className="text-xs text-slate-500"> /mês para sempre</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">Inclui:</p>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Até 15 clientes registados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Até 30 cobranças por mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Motor de mensagens padrão</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Centro de cobrança básico</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              {currentPlanType === 'free' ? (
                <Button variant="secondary" disabled className="w-full text-xs">
                  Plano Ativo
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setTargetDowngradePlan('free')}
                  className="w-full text-xs text-slate-600"
                >
                  Mudar para FREE
                </Button>
              )}
            </div>
          </Card>

          {/* PLUS */}
          <Card
            className={`p-6 bg-white border-2 rounded-2xl flex flex-col justify-between relative transition-all ${
              currentPlanType === 'plus' ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            {currentPlanType === 'plus' ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
                Plano Atual
              </span>
            ) : (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-indigo-200">
                Mais Popular
              </span>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">PLUS</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Para empresas em crescimento que precisam de acompanhamento avançado.
              </p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-black text-indigo-600">5,90 €</span>
                <span className="text-xs text-slate-500"> /mês</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
                  Tudo do FREE, e ainda:
                </p>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Até 100 clientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Até 150 cobranças por mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Modelos de mensagens personalizados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Acompanhamento de promessas de pagamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Alertas prioritários e segmentação</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              {currentPlanType === 'plus' ? (
                <Button variant="secondary" disabled className="w-full text-xs">
                  Plano Ativo
                </Button>
              ) : currentPlanType === 'free' ? (
                <Button
                  variant="primary"
                  onClick={() => setTargetUpgradePlan('plus')}
                  className="w-full text-xs"
                >
                  Subscrever PLUS (5,90 €)
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setTargetDowngradePlan('plus')}
                  className="w-full text-xs"
                >
                  Mudar para PLUS
                </Button>
              )}
            </div>
          </Card>

          {/* PRO */}
          <Card
            className={`p-6 bg-white border-2 rounded-2xl flex flex-col justify-between relative transition-all ${
              currentPlanType === 'pro' ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-amber-300'
            }`}
          >
            {currentPlanType === 'pro' && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
                Plano Atual
              </span>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                PRO <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Máxima automação, exportações contabilísticas e relatórios executivos.
              </p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-black text-slate-900">11,90 €</span>
                <span className="text-xs text-slate-500"> /mês</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
                  Tudo do PLUS, e ainda:
                </p>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-slate-900">Clientes e cobranças ILIMITADOS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Regras automáticas avançadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Relatórios executivos e auditoria</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Exportação CSV / Excel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Suporte prioritário e multi-empresa</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              {currentPlanType === 'pro' ? (
                <Button variant="secondary" disabled className="w-full text-xs">
                  Plano Ativo
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setTargetUpgradePlan('pro')}
                  className="w-full text-xs bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Subscrever PRO (11,90 €)
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Tabela de Comparação Completa de Funcionalidades */}
        <Card className="p-6 bg-white border-slate-200 shadow-xs mt-8">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Comparação Detalhada de Funcionalidades</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte com total transparência o que está incluído em cada plano.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-4 font-bold text-sm w-2/5">Capacidade / Módulo</th>
                  <th className="py-3 px-4 font-bold text-center w-1/5 text-slate-800 bg-slate-50/60 rounded-t-lg">FREE</th>
                  <th className="py-3 px-4 font-bold text-center w-1/5 text-indigo-700 bg-indigo-50/40 rounded-t-lg">PLUS (5,90 €)</th>
                  <th className="py-3 px-4 font-bold text-center w-1/5 text-amber-700 bg-amber-50/40 rounded-t-lg">PRO (11,90 €)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {/* Limites Fundamentais */}
                <tr className="bg-slate-50/30 font-semibold text-[11px] text-slate-800 uppercase tracking-wider">
                  <td colSpan={4} className="py-2.5 px-4">Limites de Gestão</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Clientes registados</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30">Até 15 clientes</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 font-semibold text-slate-900">Até 100 clientes</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 font-bold text-emerald-700">Ilimitados</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Cobranças emitidas / mês</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30">Até 30 faturas</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 font-semibold text-slate-900">Até 200 faturas</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 font-bold text-emerald-700">Ilimitadas</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Mensagens geradas / mês</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30">50 mensagens</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 font-semibold text-slate-900">300 mensagens</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 font-bold text-emerald-700">Ilimitadas</td>
                </tr>

                {/* Canais e Comunicação */}
                <tr className="bg-slate-50/30 font-semibold text-[11px] text-slate-800 uppercase tracking-wider">
                  <td colSpan={4} className="py-2.5 px-4">Comunicação e Canais</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">WhatsApp com pré-preenchimento</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">E-mail com assunto e corpo</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">SMS com contador de caracteres</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Guião de Chamada e Presencial</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-slate-400">🔒 No Plus/Pro</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Modelos personalizados</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30">Até 3 modelos</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 font-semibold text-slate-900">Até 10 modelos</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 font-bold text-emerald-700">Ilimitados</td>
                </tr>

                {/* Centro de Cobrança e Automação */}
                <tr className="bg-slate-50/30 font-semibold text-[11px] text-slate-800 uppercase tracking-wider">
                  <td colSpan={4} className="py-2.5 px-4">Centro de Cobrança & Automação</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Centro de Cobrança Operacional</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-emerald-600 font-semibold">✓ Básico</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-emerald-600 font-semibold">✓ Avançado</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Completo</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Gestão de Promessas de Pagamento</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-slate-400">🔒 No Plus/Pro</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Regras de Lembretes Automáticos</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-slate-400">1 regra simples</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 font-semibold text-slate-900">Até 5 regras</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 font-bold text-emerald-700">Ilimitadas</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Exportação de Relatórios CSV / Excel</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-slate-400">🔒 Apenas no PRO</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-slate-400">🔒 Apenas no PRO</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">Histórico de Auditoria e Linha Temporal</td>
                  <td className="py-3 px-4 text-center bg-slate-50/30 text-slate-400">🔒 Apenas no PRO</td>
                  <td className="py-3 px-4 text-center bg-indigo-50/20 text-slate-400">🔒 Apenas no PRO</td>
                  <td className="py-3 px-4 text-center bg-amber-50/20 text-emerald-600 font-semibold">✓ Disponível</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Histórico de Faturação & Recibos */}
      <Card className="p-6 bg-white border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Histórico de Faturação</h3>
            <p className="text-xs text-slate-500">
              Consulte e transfira os recibos e faturas das suas subscrições Pagora.
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            {billingHistory.length} faturas
          </Badge>
        </div>

        {billingHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Nenhuma fatura registada até ao momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Fatura / Recibo</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Valor</th>
                  <th className="py-2.5 px-3">Método</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {tx.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      {new Date(tx.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate">{tx.description}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-3">{tx.paymentMethod || 'MB WAY'}</td>
                    <td className="py-3 px-3">
                      <Badge variant={tx.status === 'paid' ? 'success' : 'neutral'} size="sm">
                        {tx.status === 'paid' ? 'Pago' : tx.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTxTimeline(tx)}
                        className="text-xs h-7 gap-1 text-slate-600 hover:text-indigo-600"
                        title="Ver Linha Temporal do Pagamento"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Linha Temporal
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedReceipt(tx)}
                        className="text-xs h-7 gap-1"
                        title="Ver Recibo Oficial"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Recibo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Upgrade */}
      {targetUpgradePlan && (
        <Modal
          isOpen={Boolean(targetUpgradePlan)}
          onClose={() => setTargetUpgradePlan(null)}
          title={`Subscrever ${PLANS[targetUpgradePlan].name}`}
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-2">
              <div className="flex justify-between items-center font-bold text-sm">
                <span>Subscrição Mensal</span>
                <span className="text-base text-indigo-700">
                  {formatCurrency(PLANS[targetUpgradePlan].priceMonthly)} /mês
                </span>
              </div>
              <p className="text-[11px] text-indigo-700/80 leading-relaxed">
                Desbloqueio imediato de todas as funcionalidades de {PLANS[targetUpgradePlan].name}. Renovação mensal automática que pode cancelar quando quiser.
              </p>
            </div>

            {/* Seleção de Método de Pagamento */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Selecione o Método de Pagamento
              </label>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mbway')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-medium transition-all ${
                    paymentMethod === 'mbway'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-2xs font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  MB WAY
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-medium transition-all ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-2xs font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Cartão
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('multibanco')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-medium transition-all ${
                    paymentMethod === 'multibanco'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-2xs font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Multibanco
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Segurança & Validação do Pagamento
              </div>
              <p className="text-[11px] leading-relaxed">
                {(targetUpgradePlan === 'plus' || targetUpgradePlan === 'pro') && isCheckoutConfigured(targetUpgradePlan)
                  ? `Será encaminhado para o checkout seguro de ${PLANS[targetUpgradePlan].name} com a identificação da sua conta (${account?.id || user?.email}). A subscrição só será ativada após a validação do pagamento pela instituição financeira.`
                  : `O URL de checkout para o plano ${PLANS[targetUpgradePlan].name} não está configurado no ambiente (VITE_${targetUpgradePlan.toUpperCase()}_CHECKOUT_URL). A PAGORA proíbe a ativação direta de planos sem confirmação prévia do gateway de pagamentos.`}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setTargetUpgradePlan(null)} className="w-full sm:w-auto justify-center">
                {(targetUpgradePlan === 'plus' || targetUpgradePlan === 'pro') && isCheckoutConfigured(targetUpgradePlan)
                  ? 'Cancelar'
                  : 'Fechar'}
              </Button>
              {(targetUpgradePlan === 'plus' || targetUpgradePlan === 'pro') && isCheckoutConfigured(targetUpgradePlan) ? (
                <Button
                  variant="primary"
                  onClick={handleExecuteUpgrade}
                  disabled={isUpgrading}
                  className="w-full sm:w-auto justify-center font-bold"
                >
                  {isUpgrading
                    ? 'A processar...'
                    : `Ir para Checkout Seguro (${formatCurrency(PLANS[targetUpgradePlan].priceMonthly)})`}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto justify-center"
                  onClick={() => {
                    showToast(
                      `Para ativar o checkout em produção, defina a variável de ambiente VITE_${targetUpgradePlan.toUpperCase()}_CHECKOUT_URL no servidor.`,
                      'info'
                    );
                    setTargetUpgradePlan(null);
                  }}
                >
                  Checkout em Configuração
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Downgrade Seguro */}
      {targetDowngradePlan && (
        <Modal
          isOpen={Boolean(targetDowngradePlan)}
          onClose={() => setTargetDowngradePlan(null)}
          title="Alteração de Plano"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-1">
              <p className="font-bold">Preservação Integral de Dados:</p>
              <p>
                Nenhum cliente, fatura, modelo ou histórico será apagado. Se possuir mais registos do que o limite do novo plano, poderá continuar a consultá-los normalmente, aplicando-se o limite apenas a novas criações.
              </p>
            </div>

            <p>
              Tem a certeza de que deseja mudar para o plano <strong>{PLANS[targetDowngradePlan].name}</strong>?
            </p>

            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setTargetDowngradePlan(null)} className="w-full sm:w-auto justify-center">
                Voltar
              </Button>
              <Button
                variant="secondary"
                onClick={handleExecuteDowngrade}
                disabled={isDowngrading}
                className="w-full sm:w-auto justify-center font-bold"
              >
                {isDowngrading ? 'A atualizar...' : 'Confirmar Alteração'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Cancelamento de Subscrição */}
      {isCancelModalOpen && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancelar Subscrição"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              Lamentamos ver a sua subscrição terminar. A sua conta continuará ativa com todos os benefícios de {currentPlanConfig.name} até à data limite de <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-PT')}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo do cancelamento (opcional):
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Conte-nos brevemente o motivo..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
              Após o término do ciclo, a conta passará automaticamente para o <strong>Plano FREE</strong> sem perda de dados históricos.
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} className="w-full sm:w-auto justify-center">
                Manter Subscrição
              </Button>
              <Button
                variant="danger"
                onClick={handleExecuteCancel}
                disabled={isCanceling}
                className="w-full sm:w-auto justify-center font-bold"
              >
                {isCanceling ? 'A processar...' : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: LINHA TEMPORAL DO PAGAMENTO (Secção 12.12) */}
      {selectedTxTimeline && (
        <Modal
          isOpen={Boolean(selectedTxTimeline)}
          onClose={() => setSelectedTxTimeline(null)}
          title={`Linha Temporal: ${selectedTxTimeline.invoiceNumber}`}
        >
          <div className="space-y-5 text-xs text-slate-700">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Montante:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(selectedTxTimeline.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Plano:</span>
                <Badge variant={selectedTxTimeline.plan === 'pro' ? 'success' : 'primary'} size="sm">
                  {selectedTxTimeline.plan.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Estado:</span>
                <Badge variant={selectedTxTimeline.status === 'paid' ? 'success' : 'neutral'} size="sm">
                  {selectedTxTimeline.status === 'paid' ? 'Aprovado' : selectedTxTimeline.status}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Método:</span>
                <span className="font-semibold text-slate-800">{selectedTxTimeline.paymentMethod || 'MB WAY'}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Ciclo de Vida do Pagamento
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(selectedTxTimeline.timeline || []).map((step, idx) => {
                  const isCompleted = step.status === 'completed';
                  const isFailed = step.status === 'failed';
                  const isCurrent = step.status === 'current';

                  return (
                    <div key={idx} className="relative group">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedTxTimeline(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: RECIBO OFICIAL DETALHADO */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title={`Recibo / Fatura ${selectedReceipt.invoiceNumber}`}
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Header do Recibo */}
            <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
              <div>
                <span className="text-base font-black text-slate-900 block">PAGORA TECNOLOGIAS, S.A.</span>
                <span className="text-slate-400 block">NIF: PT509876543 • Lisboa, Portugal</span>
                <span className="text-slate-400 block">suporte@pagora.pt</span>
              </div>
              <Badge variant="success" size="md">
                PAGO • LIQUIDADO
              </Badge>
            </div>

            {/* Dados do Cliente */}
            <div className="p-3 bg-slate-50 rounded-lg grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Faturado a:</span>
                <span className="font-bold text-slate-900">{account?.name || 'Cliente Pagora'}</span>
                <span className="text-slate-500 block">NIF: {account?.taxId || '999999990'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Data de Emissão:</span>
                <span className="font-semibold text-slate-800">{new Date(selectedReceipt.createdAt).toLocaleDateString('pt-PT')}</span>
                <span className="text-slate-400 block mt-1">Método:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.paymentMethod || 'MB WAY'}</span>
              </div>
            </div>

            {/* Linhas da Fatura */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5 text-right">Qtd</th>
                    <th className="p-2.5 text-right">Preço</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-900">{selectedReceipt.description}</div>
                      <div className="text-[10px] text-slate-400">Subscrição Mensal de Software SaaS</div>
                    </td>
                    <td className="p-2.5 text-right">1</td>
                    <td className="p-2.5 text-right">{formatCurrency(selectedReceipt.amount)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(selectedReceipt.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totais e IVA */}
            <div className="space-y-1 text-right pt-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Incidência (IVA incluído à taxa legal 23%):</span>
                <span>{formatCurrency(selectedReceipt.amount / 1.23)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total IVA (23%):</span>
                <span>{formatCurrency(selectedReceipt.amount - selectedReceipt.amount / 1.23)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-slate-200 pt-1">
                <span>Total Liquidado:</span>
                <span>{formatCurrency(selectedReceipt.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => {
                  showToast(`Recibo ${selectedReceipt.invoiceNumber} descarregado com sucesso.`, 'success');
                }}
                className="gap-1 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Descarregar PDF
              </Button>
              <Button variant="primary" onClick={() => setSelectedReceipt(null)} className="text-xs">
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
