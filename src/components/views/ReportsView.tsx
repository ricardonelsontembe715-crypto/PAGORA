import React, { useState, useMemo } from 'react';
import { useInvoices } from '../../context/InvoiceContext';
import { useCustomers } from '../../context/CustomerContext';
import { useMessages } from '../../context/MessageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  computeReportsAnalytics,
  exportReportsToCSV,
  PeriodOption,
  ReportsFilterState,
  AgingBucketId,
  ActionableRecommendation,
} from '../../lib/reportsAnalytics';
import { hasFeature } from '../../lib/permissions';

// Subcomponents
import { ReportsHeader } from '../reports/ReportsHeader';
import { ExecutiveSummaryCards } from '../reports/ExecutiveSummaryCards';
import { ReportsFilterBar } from '../reports/ReportsFilterBar';
import { EvolutionChartSection } from '../reports/EvolutionChartSection';
import { StatusDistributionSection } from '../reports/StatusDistributionSection';
import { AgingAnalysisSection } from '../reports/AgingAnalysisSection';
import { RecoveryAnalysisSection } from '../reports/RecoveryAnalysisSection';
import { CustomerBehaviorSection } from '../reports/CustomerBehaviorSection';
import { PaymentPromisesSection } from '../reports/PaymentPromisesSection';
import { CommunicationEfficiencySection } from '../reports/CommunicationEfficiencySection';
import { AutomatedInsightsSection } from '../reports/AutomatedInsightsSection';
import { ReportsDetailModal } from '../reports/ReportsDetailModal';
import { ReportsSkeletons } from '../reports/ReportsSkeletons';

// Icons & UI
import {
  BarChart3,
  Clock,
  Users,
  Handshake,
  Zap,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { FeatureLockedBadge } from '../ui/FeatureLockedBadge';

type ReportTab = 'all' | 'aging' | 'customers' | 'promises' | 'efficiency';

export const ReportsView: React.FC = () => {
  const { invoices, payments, promises, isLoading: invoicesLoading } = useInvoices();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { messages } = useMessages();
  const { account } = useAuth();
  const { navigate, navigateToCustomer } = useNavigation();

  // Estado de Filtros
  const today = new Date();
  const defaultStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const defaultEnd = today.toISOString().split('T')[0];

  const [filters, setFilters] = useState<ReportsFilterState>({
    period: 'last_30_days',
    customStart: defaultStart,
    customEnd: defaultEnd,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTab>('all');
  const [selectedDrillDownBucket, setSelectedDrillDownBucket] = useState<AgingBucketId | null>(null);

  const planType = account?.plan || 'free';
  const isFreePlan = planType === 'free';
  const isPlusPlan = planType === 'plus';
  const isProPlan = planType === 'pro';

  // Contagem de filtros ativos (excluindo período base)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.customerId) count++;
    if (filters.customerType && filters.customerType !== 'all') count++;
    if (filters.agingBucket) count++;
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) count++;
    return count;
  }, [filters]);

  // Cálculo Analítico Centralizado
  const reportData = useMemo(() => {
    return computeReportsAnalytics({
      invoices,
      payments,
      promises,
      customers,
      messages,
      filters,
    });
  }, [invoices, payments, promises, customers, messages, filters]);

  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setFilters((prev) => ({ ...prev, period: newPeriod }));
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      customStart: start,
      customEnd: end,
    }));
  };

  const handleFilterChange = (partial: Partial<ReportsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters({
      period: filters.period,
      customStart: filters.customStart,
      customEnd: filters.customEnd,
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleExportCSV = () => {
    if (!hasFeature(account, 'feature.advanced_reports')) {
      navigate('dashboard_plans');
      return;
    }
    exportReportsToCSV(reportData, account?.name || 'PAGORA');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectAgingBucket = (bucketId: AgingBucketId) => {
    setSelectedDrillDownBucket(bucketId);
  };

  const handleRecommendationAction = (rec: ActionableRecommendation) => {
    if (rec.actionType === 'view_invoices' && rec.filterAging) {
      setSelectedDrillDownBucket(rec.filterAging);
    } else if (rec.actionType === 'view_customers' && rec.targetCustomerId) {
      navigateToCustomer(rec.targetCustomerId);
    } else if (rec.actionType === 'generate_message') {
      navigate('dashboard_messages');
    } else if (rec.actionType === 'view_promises') {
      setActiveTab('promises');
    } else {
      navigate('dashboard_invoices');
    }
  };

  // Faturas selecionadas para o modal de drilldown
  const drillDownInvoices = useMemo(() => {
    if (!selectedDrillDownBucket) return [];
    const bucket = reportData.agingBuckets.find((b) => b.id === selectedDrillDownBucket);
    if (!bucket) return [];
    const idSet = new Set(bucket.invoiceIds);
    return invoices.filter((inv) => idSet.has(inv.id));
  }, [selectedDrillDownBucket, reportData.agingBuckets, invoices]);

  const drillDownBucketLabel = useMemo(() => {
    if (!selectedDrillDownBucket) return '';
    return reportData.agingBuckets.find((b) => b.id === selectedDrillDownBucket)?.label || '';
  }, [selectedDrillDownBucket, reportData.agingBuckets]);

  if (invoicesLoading || customersLoading) {
    return <ReportsSkeletons />;
  }

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Visão Completa', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'aging', label: 'Cobranças & Atrasos', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'customers', label: 'Clientes & Risco', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'promises', label: 'Promessas & Recuperação', icon: <Handshake className="w-3.5 h-3.5" /> },
    { id: 'efficiency', label: 'Comunicação & DSO', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header do Módulo de Relatórios */}
      <ReportsHeader
        period={filters.period}
        onPeriodChange={handlePeriodChange}
        dateRange={reportData.periodComparison.current}
        customStart={filters.customStart}
        customEnd={filters.customEnd}
        onCustomDateChange={handleCustomDateChange}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        activeFilterCount={activeFilterCount}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Painel de Filtros Expansível */}
      <ReportsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        customers={customers}
        activeFilterCount={activeFilterCount}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* 3. Resumo Executivo (6 Indicadores Centrais) */}
      <ExecutiveSummaryCards
        totalInvoiced={reportData.totalInvoiced}
        invoicedPercentageChange={reportData.invoicedPercentageChange}
        totalReceived={reportData.totalReceived}
        receivedPercentageChange={reportData.receivedPercentageChange}
        totalOutstanding={reportData.totalOutstanding}
        outstandingPercentageChange={reportData.outstandingPercentageChange}
        totalOverdue={reportData.totalOverdue}
        overduePercentageChange={reportData.overduePercentageChange}
        recoveredAmount={reportData.recoveredAmount}
        recoveredPercentageChange={reportData.recoveredPercentageChange}
        collectionRate={reportData.collectionRate}
        collectionRateChange={reportData.collectionRateChange}
        periodLabel={reportData.periodComparison.label}
      />

      {/* 4. Barra de Abas Especializadas */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/90 pb-2 overflow-x-auto print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Insights Automáticos e Recomendações Acionáveis */}
      {(activeTab === 'all' || activeTab === 'efficiency') && (
        <AutomatedInsightsSection
          insights={reportData.insights}
          recommendations={reportData.recommendations}
          onActionClick={handleRecommendationAction}
        />
      )}

      {/* 6. Gráfico de Evolução Temporal */}
      {(activeTab === 'all' || activeTab === 'aging') && (
        <EvolutionChartSection
          data={reportData.evolutionChartData}
          periodLabel={reportData.periodComparison.label}
        />
      )}

      {/* 7. Distribuição por Estado */}
      {(activeTab === 'all' || activeTab === 'aging') && (
        <StatusDistributionSection
          distribution={reportData.statusDistribution}
          totalCount={reportData.totalInvoicesCount}
        />
      )}

      {/* 8. Análise de Faixas de Atraso (Aging) */}
      {(activeTab === 'all' || activeTab === 'aging') && (
        <AgingAnalysisSection
          agingBuckets={reportData.agingBuckets}
          totalAtRiskAmount={reportData.totalAtRiskAmount}
          totalAtRiskCount={reportData.totalAtRiskCount}
          atRiskPercentage={reportData.atRiskPercentage}
          selectedBucketId={selectedDrillDownBucket || undefined}
          onSelectBucket={handleSelectAgingBucket}
        />
      )}

      {/* 9. Recuperação de Valores Pós-Vencimento */}
      {(activeTab === 'all' || activeTab === 'promises') && (
        <RecoveryAnalysisSection
          recovery={reportData.recoverySummary}
          totalOverdue={reportData.totalOverdue}
        />
      )}

      {/* 10. Comportamento e Risco de Clientes */}
      {(activeTab === 'all' || activeTab === 'customers') && (
        <CustomerBehaviorSection
          customerReports={reportData.customerReports}
          topExposedCustomers={reportData.topExposedCustomers}
          topConsistentCustomers={reportData.topConsistentCustomers}
        />
      )}

      {/* 11. Promessas de Pagamento */}
      {(activeTab === 'all' || activeTab === 'promises') && (
        <PaymentPromisesSection promises={reportData.promiseSummary} />
      )}

      {/* 12. Comunicação e Eficiência Financeira (DSO) */}
      {(activeTab === 'all' || activeTab === 'efficiency') && (
        <CommunicationEfficiencySection
          communication={reportData.communicationStats}
          efficiency={reportData.efficiencyMetrics}
        />
      )}

      {/* 13. Banner de Atualização para Usuários do Plano FREE */}
      {isFreePlan && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Desbloqueie Todo o Potencial com os Planos PLUS e PRO
              </h4>
            </div>
            <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
              Obtenha exportação completa em ficheiros CSV e relatórios consolidados, análises aprofundadas de exposição de risco e automações preventivas de cobrança.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('dashboard_plans')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-950 bg-white rounded-xl hover:bg-indigo-50 transition-colors shadow-sm shrink-0 cursor-pointer self-start sm:self-center"
          >
            <span>Ver Planos e Vantagens</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 14. Modal de Drilldown de Cobranças por Faixa de Atraso */}
      {selectedDrillDownBucket && (
        <ReportsDetailModal
          title={`Cobranças na Faixa: ${drillDownBucketLabel}`}
          subtitle="Listagem detalhada das faturas correspondentes para acompanhamento direto."
          invoices={drillDownInvoices}
          customers={customers}
          isOpen={Boolean(selectedDrillDownBucket)}
          onClose={() => setSelectedDrillDownBucket(null)}
        />
      )}
    </div>
  );
};
