import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useMessages } from '../../context/MessageContext';
import { useNotifications } from '../../context/NotificationContext';
import { Customer, Invoice, CustomerType } from '../../types/database';

import {
  PeriodOption,
  computeDashboardMetrics,
} from '../../lib/dashboardAnalytics';

import { DashboardHeader } from '../dashboard/DashboardHeader';
import { FinancialSummaryCards } from '../dashboard/FinancialSummaryCards';
import { OperationalMetricsBar } from '../dashboard/OperationalMetricsBar';
import { PriorityAttentionSection } from '../dashboard/PriorityAttentionSection';
import { UpcomingDueSection } from '../dashboard/UpcomingDueSection';
import { RecentActivitySection } from '../dashboard/RecentActivitySection';
import { PriorityCustomersSection } from '../dashboard/PriorityCustomersSection';
import { PaymentPromisesWidget } from '../dashboard/PaymentPromisesWidget';
import { RevenuePerformanceChart } from '../dashboard/RevenuePerformanceChart';
import { QuickActionsPanel } from '../dashboard/QuickActionsPanel';
import { PlanStatusCard } from '../dashboard/PlanStatusCard';
import { DashboardEmptyState } from '../dashboard/DashboardEmptyState';
import { DashboardSkeletons } from '../dashboard/DashboardSkeletons';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate } from '../../lib/formatters';

// Modais de Criação e Ação
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { InvoiceFormModal } from '../invoices/InvoiceFormModal';
import { RecordPaymentModal } from '../invoices/RecordPaymentModal';
import { RecordPromiseModal } from '../invoices/RecordPromiseModal';
import { MessageGeneratorModal } from '../messages/MessageGeneratorModal';

import { Receipt, Search, Building2, User, Clock, AlertTriangle } from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { account, user } = useAuth();
  const { navigate, navigateToCustomer, navigateToInvoice } = useNavigation();
  const { customers, allAccountCustomers } = useCustomers();
  const { invoices, payments, promises, activityLogs, isLoading } = useInvoices();
  const { messages, generationStats } = useMessages();
  const { showToast } = useNotifications();

  // Estados de Filtro de Período
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('last_30_days');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Estados dos Modais
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPromiseModalOpen, setIsPromiseModalOpen] = useState(false);
  const [isSelectInvoiceModalOpen, setIsSelectInvoiceModalOpen] = useState(false);
  const [selectInvoiceAction, setSelectInvoiceAction] = useState<'payment' | 'promise'>('payment');

  // Alvos selecionados para modais
  const [targetCustomerId, setTargetCustomerId] = useState<string | undefined>(undefined);
  const [targetInvoiceId, setTargetInvoiceId] = useState<string | undefined>(undefined);

  // Busca dentro do seletor de faturas
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // Cálculo reativo das métricas do Dashboard
  const metrics = useMemo(() => {
    return computeDashboardMetrics({
      invoices,
      payments,
      promises,
      customers,
      period: selectedPeriod,
      customStart,
      customEnd,
    });
  }, [invoices, payments, promises, customers, selectedPeriod, customStart, customEnd]);

  // Contagem de mensagens no mês atual
  const monthlyMessagesCount = generationStats?.currentMonthCount || messages.length;
  const monthlyInvoicesCount = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    return invoices.filter((inv) => {
      const d = new Date(inv.issueDate || inv.createdAt);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    }).length;
  }, [invoices]);

  // Handler para Período Personalizado
  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    setSelectedPeriod('custom');
  };

  // Handlers para Ações Rápidas & Modais
  const handleOpenNewCustomer = () => {
    setIsCustomerModalOpen(true);
  };

  const handleOpenNewInvoice = () => {
    setTargetCustomerId(undefined);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenMessageGenerator = (customerId?: string, invoiceId?: string) => {
    setTargetCustomerId(customerId);
    setTargetInvoiceId(invoiceId);
    setIsMessageModalOpen(true);
  };

  const handleQuickRecordPayment = () => {
    const openInvoices = invoices.filter(
      (inv) => inv.status !== 'paid' && inv.status !== 'canceled' && inv.status !== 'draft'
    );
    if (openInvoices.length === 0) {
      showToast({
        type: 'info',
        title: 'Sem cobranças em aberto',
        message: 'Não existem cobranças pendentes para registar pagamentos.',
      });
      return;
    }
    if (openInvoices.length === 1) {
      setTargetInvoiceId(openInvoices[0].id);
      setIsPaymentModalOpen(true);
    } else {
      setSelectInvoiceAction('payment');
      setIsSelectInvoiceModalOpen(true);
    }
  };

  const handleQuickRecordPromise = () => {
    const openInvoices = invoices.filter(
      (inv) => inv.status !== 'paid' && inv.status !== 'canceled' && inv.status !== 'draft'
    );
    if (openInvoices.length === 0) {
      showToast({
        type: 'info',
        title: 'Sem cobranças em aberto',
        message: 'Não existem cobranças pendentes para registar promessas.',
      });
      return;
    }
    if (openInvoices.length === 1) {
      setTargetInvoiceId(openInvoices[0].id);
      setIsPromiseModalOpen(true);
    } else {
      setSelectInvoiceAction('promise');
      setIsSelectInvoiceModalOpen(true);
    }
  };

  const targetInvoiceForModal = useMemo(() => {
    if (!targetInvoiceId) return undefined;
    return invoices.find((i) => i.id === targetInvoiceId);
  }, [invoices, targetInvoiceId]);

  // Lista de faturas em aberto para o seletor
  const openInvoicesForSelection = useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'canceled' && inv.status !== 'draft')
      .filter((inv) => {
        if (!invoiceSearchQuery.trim()) return true;
        const q = invoiceSearchQuery.toLowerCase();
        const cust = customers.find((c) => c.id === inv.customerId);
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.description?.toLowerCase().includes(q) ||
          cust?.name.toLowerCase().includes(q)
        );
      });
  }, [invoices, customers, invoiceSearchQuery]);

  if (isLoading) {
    return <DashboardSkeletons />;
  }

  const hasCustomers = allAccountCustomers.length > 0;
  const hasInvoices = invoices.length > 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Cabeçalho Contextual Inteligente */}
      <DashboardHeader
        userName={user?.name}
        accountName={account?.name}
        hasInvoices={hasInvoices}
        overdueCount={metrics.overdueInvoicesCount}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customStartDate={customStart}
        customEndDate={customEnd}
        onCustomDateChange={handleCustomDateChange}
        onNewCustomer={handleOpenNewCustomer}
        onNewInvoice={handleOpenNewInvoice}
      />

      {/* Se não houver dados, exibir Onboarding inteligente no topo */}
      {(!hasCustomers || !hasInvoices) && (
        <DashboardEmptyState
          hasCustomers={hasCustomers}
          hasInvoices={hasInvoices}
          onNewCustomer={handleOpenNewCustomer}
          onNewInvoice={handleOpenNewInvoice}
          onGenerateMessage={() => handleOpenMessageGenerator()}
        />
      )}

      {/* 2. Resumo Financeiro Principal (Cards de Alto Impacto) */}
      <FinancialSummaryCards
        totalReceivable={metrics.totalReceivable}
        openInvoicesCount={metrics.openInvoicesCount}
        overdueAmount={metrics.overdueAmount}
        overdueCount={metrics.overdueInvoicesCount}
        pendingAmount={metrics.pendingAmount}
        pendingCount={metrics.openInvoicesCount - metrics.overdueInvoicesCount}
        paidInPeriod={metrics.paidInPeriod}
        paidPercentageChange={metrics.paidPercentageChange}
        periodLabel={
          selectedPeriod === 'today'
            ? 'Hoje'
            : selectedPeriod === 'last_7_days'
            ? '7 dias'
            : selectedPeriod === 'this_month'
            ? 'Este mês'
            : selectedPeriod === 'last_month'
            ? 'Mês ant.'
            : selectedPeriod === 'last_3_months'
            ? '3 meses'
            : selectedPeriod === 'this_year'
            ? 'Este ano'
            : '30 dias'
        }
        onNavigateToInvoices={(filter) => {
          navigate('dashboard_invoices');
        }}
      />

      {/* 3. Barra de Métricas Operacionais Clicáveis */}
      <OperationalMetricsBar
        activeCustomersCount={metrics.activeCustomersCount}
        openInvoicesCount={metrics.openInvoicesCount}
        overdueInvoicesCount={metrics.overdueInvoicesCount}
        paidInvoicesCount={metrics.paidInvoicesCount}
        activePromisesCount={metrics.activePromisesCount}
        brokenPromisesCount={metrics.brokenPromisesCount}
        monthlyMessagesCount={monthlyMessagesCount}
        onNavigateToCustomers={() => navigate('dashboard_customers')}
        onNavigateToInvoices={(filter) => navigate('dashboard_invoices')}
        onNavigateToMessages={() => navigate('dashboard_messages')}
      />

      {/* 4. Painel de Ações Rápidas / Atalhos */}
      <QuickActionsPanel
        onNewCustomer={handleOpenNewCustomer}
        onNewInvoice={handleOpenNewInvoice}
        onGenerateMessage={() => handleOpenMessageGenerator()}
        onViewOverdue={() => navigate('dashboard_invoices')}
        onRecordPayment={handleQuickRecordPayment}
        onRecordPromise={handleQuickRecordPromise}
        onViewReports={() => navigate('dashboard_reports')}
        onNavigateCollectionCenter={() => navigate('dashboard_collection_center')}
        onNavigateAutomations={() => navigate('dashboard_automations')}
      />

      {/* 5. Grelha Central: Prioridade, Gráfico e Operações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal Esquerda (2 Colunas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. Área "Precisa da sua atenção" */}
          <PriorityAttentionSection
            items={metrics.priorityItems}
            onViewInvoice={(invoiceId) => navigateToInvoice(invoiceId)}
            onViewCustomer={(customerId) => navigateToCustomer(customerId)}
            onGenerateMessage={(customerId, invoiceId) =>
              handleOpenMessageGenerator(customerId, invoiceId)
            }
          />

          {/* B. Desempenho de Recebimentos & Gráficos */}
          <RevenuePerformanceChart
            chartData={metrics.chartData}
            collectionRate={metrics.collectionRate}
            recoveredAmount={metrics.recoveredAmount}
            invoicedInPeriod={metrics.invoicedInPeriod}
            paidInPeriod={metrics.paidInPeriod}
            periodLabel={
              selectedPeriod === 'today'
                ? 'Hoje'
                : selectedPeriod === 'last_7_days'
                ? 'Últimos 7 dias'
                : selectedPeriod === 'this_month'
                ? 'Este mês'
                : selectedPeriod === 'last_month'
                ? 'Mês anterior'
                : selectedPeriod === 'last_3_months'
                ? 'Últimos 3 meses'
                : selectedPeriod === 'this_year'
                ? 'Este ano'
                : 'Últimos 30 dias'
            }
          />

          {/* C. Cobranças e Atividades Recentes (com Timeline) */}
          <RecentActivitySection
            invoices={invoices}
            customers={customers}
            promises={promises}
            activityLogs={activityLogs}
            onViewInvoice={(invoiceId) => navigateToInvoice(invoiceId)}
            onViewAllInvoices={() => navigate('dashboard_invoices')}
          />
        </div>

        {/* Coluna Lateral Direita (1 Coluna) */}
        <div className="space-y-6">
          {/* D. Próximos Vencimentos */}
          <UpcomingDueSection
            items={metrics.upcomingDueItems}
            onViewInvoice={(invoiceId) => navigateToInvoice(invoiceId)}
            onPrepareReminder={(customerId, invoiceId) =>
              handleOpenMessageGenerator(customerId, invoiceId)
            }
            onViewAllInvoices={() => navigate('dashboard_invoices')}
          />

          {/* E. Promessas de Pagamento Widget */}
          <PaymentPromisesWidget
            promises={promises}
            customers={customers}
            invoices={invoices}
            onViewInvoice={(invoiceId) => navigateToInvoice(invoiceId)}
            onGenerateMessage={(customerId, invoiceId) =>
              handleOpenMessageGenerator(customerId, invoiceId)
            }
          />

          {/* F. Clientes Prioritários */}
          <PriorityCustomersSection
            customers={metrics.priorityCustomers}
            onViewCustomer={(customerId) => navigateToCustomer(customerId)}
            onGenerateMessage={(customerId) => handleOpenMessageGenerator(customerId)}
            onViewAllCustomers={() => navigate('dashboard_customers')}
          />

          {/* G. Estado do Plano e Utilização de Cotas */}
          <PlanStatusCard
            account={account}
            activeCustomersCount={metrics.activeCustomersCount}
            monthlyInvoicesCount={monthlyInvoicesCount}
            monthlyMessagesCount={monthlyMessagesCount}
            onNavigateToPlans={() => navigate('dashboard_plans')}
          />
        </div>
      </div>

      {/* MODAL 1: Novo Cliente */}
      {isCustomerModalOpen && (
        <CustomerFormModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSuccess={(newCustomer) => {
            setIsCustomerModalOpen(false);
            showToast({
              type: 'success',
              title: 'Cliente criado',
              message: `${newCustomer.name} adicionado com sucesso.`,
            });
          }}
        />
      )}

      {/* MODAL 2: Nova Cobrança */}
      {isInvoiceModalOpen && (
        <InvoiceFormModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          preselectedCustomerId={targetCustomerId}
          onSuccess={(newInvoice) => {
            setIsInvoiceModalOpen(false);
            showToast({
              type: 'success',
              title: 'Cobrança registada',
              message: `Cobrança ${newInvoice.invoiceNumber} registada com sucesso.`,
            });
          }}
        />
      )}

      {/* MODAL 3: Gerador de Mensagens Profissional */}
      {isMessageModalOpen && (
        <MessageGeneratorModal
          isOpen={isMessageModalOpen}
          onClose={() => {
            setIsMessageModalOpen(false);
            setTargetCustomerId(undefined);
            setTargetInvoiceId(undefined);
          }}
          preselectedCustomerId={targetCustomerId}
          preselectedInvoiceId={targetInvoiceId}
        />
      )}

      {/* MODAL 4: Registar Pagamento */}
      {isPaymentModalOpen && targetInvoiceForModal && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setTargetInvoiceId(undefined);
          }}
          invoice={targetInvoiceForModal}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setTargetInvoiceId(undefined);
          }}
        />
      )}

      {/* MODAL 5: Registar Promessa */}
      {isPromiseModalOpen && targetInvoiceForModal && (
        <RecordPromiseModal
          isOpen={isPromiseModalOpen}
          onClose={() => {
            setIsPromiseModalOpen(false);
            setTargetInvoiceId(undefined);
          }}
          invoice={targetInvoiceForModal}
          onSuccess={() => {
            setIsPromiseModalOpen(false);
            setTargetInvoiceId(undefined);
          }}
        />
      )}

      {/* MODAL 6: Selecionar Cobrança para Pagamento ou Promessa */}
      {isSelectInvoiceModalOpen && (
        <Modal
          isOpen={isSelectInvoiceModalOpen}
          onClose={() => setIsSelectInvoiceModalOpen(false)}
          title={
            selectInvoiceAction === 'payment'
              ? 'Registar Pagamento — Selecionar Cobrança'
              : 'Registar Promessa — Selecionar Cobrança'
          }
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Selecione a cobrança em aberto sobre a qual deseja{' '}
              {selectInvoiceAction === 'payment' ? 'dar baixa do pagamento' : 'registar o compromisso de liquidação'}:
            </p>

            {/* Caixa de pesquisa */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por número, cliente ou descrição..."
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Lista de Faturas */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {openInvoicesForSelection.length > 0 ? (
                openInvoicesForSelection.map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);
                  const remaining = Math.max(0, inv.amount - (inv.paidAmount || 0));

                  return (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setIsSelectInvoiceModalOpen(false);
                        setTargetInvoiceId(inv.id);
                        if (selectInvoiceAction === 'payment') {
                          setIsPaymentModalOpen(true);
                        } else {
                          setIsPromiseModalOpen(true);
                        }
                      }}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {cust?.type === 'company' ? (
                            <Building2 className="w-4 h-4 text-slate-500" />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {cust?.name || 'Cliente'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {inv.invoiceNumber} • Vence a {formatDate(inv.dueDate)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(remaining)}
                        </div>
                        <div className="text-[10px] text-slate-500">saldo pendente</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Nenhuma cobrança em aberto encontrada.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSelectInvoiceModalOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
