import React, { useState, useMemo } from 'react';
import { useAutomations } from '../../context/AutomationContext';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useNavigation } from '../../context/NavigationContext';
import { CollectionReminder } from '../../types/automations';
import { Invoice } from '../../types/database';
import { generatePagoraDailyRecommendation } from '../../lib/collectionIntelligence';
import { CollectionRecommendationBanner } from '../collection/CollectionRecommendationBanner';
import { CollectionHeaderMetrics } from '../collection/CollectionHeaderMetrics';
import { CollectionItemCard } from '../collection/CollectionItemCard';
import { RecordPaymentModal } from '../invoices/RecordPaymentModal';
import { SnoozeModal } from '../reminders/SnoozeModal';
import { IntelligentAssistantDrawer } from '../collection/IntelligentAssistantDrawer';
import { MessageGeneratorModal } from '../messages/MessageGeneratorModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Compass,
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  RotateCw,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Bot,
} from 'lucide-react';

export const CollectionCenterView: React.FC = () => {
  const {
    reminders,
    resolveReminder,
    snoozeReminder,
    runEngineManually,
    metrics,
  } = useAutomations();

  const { customers, getCustomerById } = useCustomers();
  const { invoices, promises, getInvoiceById } = useInvoices();
  const { navigate, navigateToCustomer, navigateToInvoice } = useNavigation();

  // Filtro de aba operacional
  const [activeTab, setActiveTab] = useState<'today' | 'critical' | 'promises' | 'preventive' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais de suporte operacional
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [snoozeTarget, setSnoozeTarget] = useState<CollectionReminder | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [generatorData, setGeneratorData] = useState<{ customerId?: string; invoiceId?: string; isOpen: boolean }>({
    isOpen: false,
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Recomendação Operacional Inteligente da PAGORA
  const dailyRecommendation = useMemo(() => {
    return generatePagoraDailyRecommendation(invoices, customers, promises);
  }, [invoices, customers, promises]);

  // Métricas do Centro de Cobrança
  const centerMetrics = useMemo(() => {
    const pending = reminders.filter((r) => r.status === 'pending');

    // 1. Ações para hoje
    const todayList = pending.filter((r) => r.scheduledDate <= todayStr);
    const todayAmount = todayList.reduce((sum, r) => sum + (r.amount || 0), 0);

    // 2. Atrasos críticos (> 7 dias ou prioridade urgent)
    const criticalList = pending.filter(
      (r) => r.priority === 'urgent' || (r.invoiceId && (getInvoiceById(r.invoiceId)?.status === 'overdue'))
    );
    const criticalAmount = criticalList.reduce((sum, r) => sum + (r.amount || 0), 0);

    // 3. Promessas a vencer
    const pendingPromises = promises.filter((p) => p.status === 'pending');
    const promisesAmount = pendingPromises.reduce((sum, p) => sum + p.amount, 0);

    // 4. Saldo total em carteira
    const totalActiveDebt = invoices
      .filter((i) => i.status === 'pending' || i.status === 'overdue' || i.status === 'partially_paid')
      .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

    return {
      todayActionsCount: todayList.length,
      todayAmount,
      criticalOverdueCount: criticalList.length,
      criticalOverdueAmount: criticalAmount,
      promisesDueCount: pendingPromises.length,
      promisesDueAmount: promisesAmount,
      totalActiveDebt,
    };
  }, [reminders, invoices, promises, todayStr, getInvoiceById]);

  // Itens a exibir ordenados por prioridade operacional
  const displayedItems = useMemo(() => {
    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return reminders
      .filter((rem) => {
        if (rem.status !== 'pending') return false;

        if (activeTab === 'today') {
          return rem.scheduledDate <= todayStr;
        }
        if (activeTab === 'critical') {
          return rem.priority === 'urgent' || rem.priority === 'high';
        }
        if (activeTab === 'promises') {
          return rem.title.toLowerCase().includes('promessa') || rem.reason.toLowerCase().includes('acordo');
        }
        if (activeTab === 'preventive') {
          return rem.priority === 'low' || rem.priority === 'medium';
        }
        return true;
      })
      .filter((rem) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          rem.customerName.toLowerCase().includes(term) ||
          rem.invoiceNumber?.toLowerCase().includes(term) ||
          rem.reason.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // Ordena por peso de prioridade decrescente
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        if (weightA !== weightB) return weightB - weightA;
        // Depois por data
        return a.scheduledDate.localeCompare(b.scheduledDate);
      });
  }, [reminders, activeTab, searchTerm, todayStr]);

  const handleGenerateMessage = (rem: CollectionReminder) => {
    navigate('dashboard_messages', {
      customerId: rem.customerId,
      invoiceId: rem.invoiceId,
    });
  };

  const handleOpenPayment = (invoiceId?: string) => {
    if (invoiceId) {
      const inv = getInvoiceById(invoiceId);
      if (inv) {
        setPaymentInvoice(inv);
        return;
      }
    }
    // Se não tiver invoiceId específico, navega para faturas
    navigate('dashboard_invoices');
  };

  return (
    <div id="collection-center-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Centro de Cobrança Inteligente
              </h1>
              <p className="text-xs text-slate-500">
                A sua mesa de comando operacional: saiba quem cobrar hoje, qual a prioridade e qual a melhor mensagem.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={runEngineManually}
            className="text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Recalcular Ações
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssistantOpen(true)}
            className="text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50/50"
          >
            <Bot className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Assistente IA
          </Button>

          <Button
            size="sm"
            onClick={() => setGeneratorData({ isOpen: true })}
            className="text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Gerador de Mensagens
          </Button>
        </div>
      </div>

      {/* Bloco de Recomendação Inteligente da Pagora */}
      <CollectionRecommendationBanner
        advice={dailyRecommendation}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenMessageGenerator={() => navigate('dashboard_messages')}
        onNavigateCustomers={() => navigate('dashboard_customers')}
        onNavigateInvoices={() => navigate('dashboard_invoices')}
      />

      {/* Indicadores Operacionais Superiores */}
      <CollectionHeaderMetrics
        todayActionsCount={centerMetrics.todayActionsCount}
        todayAmount={centerMetrics.todayAmount}
        criticalOverdueCount={centerMetrics.criticalOverdueCount}
        criticalOverdueAmount={centerMetrics.criticalOverdueAmount}
        promisesDueCount={centerMetrics.promisesDueCount}
        promisesDueAmount={centerMetrics.promisesDueAmount}
        totalActiveDebt={centerMetrics.totalActiveDebt}
      />

      {/* Abas e Filtros de Foco Operacional */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 touch-pan-x">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Para Cobrar Hoje ({centerMetrics.todayActionsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
              activeTab === 'critical'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Atrasos Críticos ({centerMetrics.criticalOverdueCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promises')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
              activeTab === 'promises'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Promessas ({centerMetrics.promisesDueCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preventive')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
              activeTab === 'preventive'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Preventivas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 text-xs ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas as Pendentes
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar cobrança ou cliente..."
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Lista Operacional de Cobranças */}
      {displayedItems.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            Excelente trabalho! Não tem ações pendentes nesta categoria.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Todas as cobranças prioritárias foram abordadas ou encontram-se dentro dos prazos normais de liquidação.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('dashboard_invoices')}>
            Ver Todas as Faturas
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedItems.map((item) => (
            <CollectionItemCard
              key={item.id}
              item={item}
              onGenerateMessage={handleGenerateMessage}
              onRecordPayment={handleOpenPayment}
              onSnooze={(it) => setSnoozeTarget(it)}
              onResolve={resolveReminder}
              onNavigateCustomer={navigateToCustomer}
              onNavigateInvoice={navigateToInvoice}
            />
          ))}
        </div>
      )}

      {/* Modais de Pagamento e Adiamento */}
      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onSuccess={() => {
            setPaymentInvoice(null);
            runEngineManually();
          }}
        />
      )}

      <SnoozeModal
        isOpen={!!snoozeTarget}
        onClose={() => setSnoozeTarget(null)}
        reminder={snoozeTarget}
        onSnooze={snoozeReminder}
      />

      {/* Drawer do Assistente Inteligente IA */}
      <IntelligentAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        customers={customers}
        invoices={invoices}
        promises={promises}
        reminders={reminders}
        onSelectAction={(action) => {
          if (action.type === 'generate_message') {
            setGeneratorData({
              isOpen: true,
              customerId: action.customerId,
              invoiceId: action.invoiceId,
            });
          } else if (action.type === 'open_customer' && action.customerId) {
            navigateToCustomer(action.customerId);
          } else if (action.type === 'open_collection' && action.invoiceId) {
            navigateToInvoice(action.invoiceId);
          }
        }}
      />

      {/* Modal de Geração de Mensagens Contextuais */}
      {generatorData.isOpen && (
        <MessageGeneratorModal
          isOpen={generatorData.isOpen}
          onClose={() => setGeneratorData({ isOpen: false })}
          preselectedCustomerId={generatorData.customerId}
          preselectedInvoiceId={generatorData.invoiceId}
        />
      )}
    </div>
  );
};
