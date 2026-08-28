import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../../types/database';
import { useInvoices } from '../../context/InvoiceContext';
import { useCustomers } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { PLANS } from '../../config/plans';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';
import { EmptyState } from '../ui/EmptyState';
import { Pagination } from '../ui/Pagination';
import { InvoiceFormModal } from '../invoices/InvoiceFormModal';
import { RecordPaymentModal } from '../invoices/RecordPaymentModal';
import { RecordPromiseModal } from '../invoices/RecordPromiseModal';
import { CancelInvoiceModal } from '../invoices/CancelInvoiceModal';
import { formatCurrency, formatDate, getDaysOverdue } from '../../lib/formatters';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Eye,
  CreditCard,
  Ban,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Building2,
  Link as LinkIcon,
  ShieldAlert,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { account } = useAuth();
  const {
    invoices,
    getAccountInvoiceMetrics,
    reopenInvoice,
    getInvoicePromises,
  } = useInvoices();
  const { customers, getCustomerById } = useCustomers();
  const { navigateToInvoice, navigateToCustomer, navParams } = useNavigation();
  const { showToast } = useNotifications();

  // Estados de Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceForPromise, setSelectedInvoiceForPromise] = useState<Invoice | null>(null);
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<Invoice | null>(null);

  // Estados de Pesquisa e Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(
    (navParams?.initialFilter as string) || 'all'
  );
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'recent' | 'oldest' | 'highest_amount' | 'lowest_amount' | 'highest_overdue' | 'closest_due'
  >('recent');

  // Paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Limites do Plano
  const currentPlan = account ? PLANS[account.plan] : PLANS.free;
  const invoiceLimit = currentPlan.limits.maxInvoicesPerMonth;
  const isInvoiceUnlimited = invoiceLimit === 'unlimited';
  const isLimitReached = !isInvoiceUnlimited && invoices.length >= invoiceLimit;

  // Métricas reais
  const metrics = getAccountInvoiceMetrics();

  // Filtragem e Ordenação
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Pesquisa de texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((inv) => {
        const cust = getCustomerById(inv.customerId);
        const matchCustomer = cust?.name.toLowerCase().includes(q) || cust?.taxId?.includes(q);
        const matchRef = inv.invoiceNumber.toLowerCase().includes(q);
        const matchDesc = inv.description?.toLowerCase().includes(q);
        const matchNotes = inv.notes?.toLowerCase().includes(q);
        return matchCustomer || matchRef || matchDesc || matchNotes;
      });
    }

    // Filtro por Estado
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        result = result.filter(
          (inv) =>
            inv.status === 'overdue' ||
            (getDaysOverdue(inv.dueDate) > 0 && inv.status !== 'paid' && inv.status !== 'canceled')
        );
      } else if (statusFilter === 'pending') {
        result = result.filter(
          (inv) => inv.status === 'pending' && getDaysOverdue(inv.dueDate) === 0
        );
      } else {
        result = result.filter((inv) => inv.status === statusFilter);
      }
    }

    // Filtro por Cliente
    if (customerFilter !== 'all') {
      result = result.filter((inv) => inv.customerId === customerFilter);
    }

    // Filtro por Período
    if (periodFilter !== 'all') {
      const now = new Date();
      result = result.filter((inv) => {
        const d = new Date(inv.dueDate);
        if (periodFilter === 'today') {
          return d.toDateString() === now.toDateString();
        }
        if (periodFilter === 'this_week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return d >= startOfWeek && d <= endOfWeek;
        }
        if (periodFilter === 'this_month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (periodFilter === 'this_year') {
          return d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'highest_amount') {
        return b.amount - a.amount;
      }
      if (sortBy === 'lowest_amount') {
        return a.amount - b.amount;
      }
      if (sortBy === 'highest_overdue') {
        const daysA = getDaysOverdue(a.dueDate);
        const daysB = getDaysOverdue(b.dueDate);
        return daysB - daysA;
      }
      if (sortBy === 'closest_due') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return result;
  }, [invoices, searchQuery, statusFilter, customerFilter, periodFilter, sortBy, getCustomerById]);

  // Paginação dos resultados
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  // Badge semântica de estado da cobrança
  const renderStatusBadge = (invoice: Invoice) => {
    const isOverdue =
      invoice.status === 'overdue' ||
      (getDaysOverdue(invoice.dueDate) > 0 &&
        invoice.status !== 'paid' &&
        invoice.status !== 'canceled');

    if (invoice.status === 'canceled') {
      return (
        <Badge variant="gray" size="sm">
          Cancelada
        </Badge>
      );
    }
    if (invoice.status === 'paid' || invoice.amount <= invoice.paidAmount) {
      return (
        <Badge variant="success" size="sm">
          Paga
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant="danger" size="sm">
          Vencida
        </Badge>
      );
    }
    if (invoice.status === 'partially_paid') {
      return (
        <Badge variant="info" size="sm">
          Parcialmente paga
        </Badge>
      );
    }
    if (invoice.status === 'draft') {
      return (
        <Badge variant="gray" size="sm">
          Rascunho
        </Badge>
      );
    }
    return (
      <Badge variant="warning" size="sm">
        Em aberto
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Cobranças</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenha uma visão clara do que está por receber e do que precisa da sua atenção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (isLimitReached) {
                showToast(
                  `Atingiu o limite de ${invoiceLimit} cobranças do plano ${currentPlan.name}. Faça upgrade para continuar.`,
                  'warning'
                );
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Nova cobrança
          </Button>
        </div>
      </div>

      {/* Indicadores Topo (Métricas Reais) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total a Receber */}
        <Card hoverable onClick={() => setStatusFilter('all')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total a receber</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(metrics.totalReceivable)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {metrics.pendingInvoicesCount + metrics.overdueInvoicesCount} faturas com saldo pendente
          </div>
        </Card>

        {/* Em Aberto (No Prazo) */}
        <Card hoverable onClick={() => setStatusFilter('pending')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Em aberto (no prazo)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(metrics.pendingAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {metrics.pendingInvoicesCount} faturas a aguardar vencimento
          </div>
        </Card>

        {/* Em Atraso */}
        <Card
          hoverable
          className={metrics.overdueAmount > 0 ? 'ring-1 ring-amber-400 bg-amber-50/20' : ''}
          onClick={() => setStatusFilter('overdue')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-900">Em atraso</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 tracking-tight">
            {formatCurrency(metrics.overdueAmount)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-2 flex items-center gap-1">
            {metrics.overdueInvoicesCount > 0 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{metrics.overdueInvoicesCount} cobranças requerem atenção</span>
              </>
            ) : (
              <span>Nenhuma cobrança vencida</span>
            )}
          </div>
        </Card>

        {/* Recebido */}
        <Card hoverable onClick={() => setStatusFilter('paid')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total recebido</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(metrics.paidAmount)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{metrics.paidInvoicesCount} faturas totalmente liquidadas</span>
          </div>
        </Card>
      </div>

      {/* Alerta Destacado de Cobranças em Atraso */}
      {metrics.overdueInvoicesCount > 0 ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                Existem cobranças que precisam da sua atenção.
              </h3>
              <p className="text-xs text-amber-900/90 mt-0.5">
                Tem{' '}
                <strong className="font-semibold">
                  {metrics.overdueInvoicesCount}{' '}
                  {metrics.overdueInvoicesCount === 1 ? 'cobrança' : 'cobranças'} em atraso
                </strong>
                , num total de{' '}
                <strong className="font-semibold">{formatCurrency(metrics.overdueAmount)}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatusFilter('overdue');
                setCurrentPage(1);
              }}
              className="bg-white hover:bg-amber-100/50 text-amber-900 border-amber-300 text-xs"
            >
              Ver cobranças em atraso
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>Está tudo em dia.</strong> Não tem cobranças em atraso a precisar de ação urgente.
            </span>
          </div>
          {metrics.activePromisesCount > 0 && (
            <span className="text-indigo-600 font-medium">
              {metrics.activePromisesCount} promessa(s) de pagamento agendada(s)
            </span>
          )}
        </div>
      )}

      {/* Barra de Pesquisa, Abas de Estado e Filtros */}
      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Linha Superior: Abas de Estado */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-slate-100 scrollbar-none">
          {[
            { id: 'all', label: 'Todas as cobranças', count: invoices.length },
            {
              id: 'overdue',
              label: 'Em atraso',
              count: metrics.overdueInvoicesCount,
              badgeVariant: 'danger' as const,
            },
            { id: 'pending', label: 'Em aberto', count: metrics.pendingInvoicesCount },
            {
              id: 'partially_paid',
              label: 'Parcialmente pagas',
              count: invoices.filter((i) => i.status === 'partially_paid').length,
            },
            { id: 'paid', label: 'Pagas', count: metrics.paidInvoicesCount },
            {
              id: 'canceled',
              label: 'Canceladas',
              count: invoices.filter((i) => i.status === 'canceled').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.badgeVariant === 'danger' && tab.count > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Linha Inferior: Barra de Busca e Dropdowns de Filtro */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Caixa de Pesquisa em Tempo Real */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, referência ou descrição..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtros Secundários */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Cliente */}
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">Todos os clientes</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filtro por Período */}
            <select
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">Todo o período</option>
              <option value="today">Vence hoje</option>
              <option value="this_week">Esta semana</option>
              <option value="this_month">Este mês</option>
              <option value="this_year">Este ano</option>
            </select>

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="highest_amount">Maior valor</option>
              <option value="lowest_amount">Menor valor</option>
              <option value="highest_overdue">Maior atraso</option>
              <option value="closest_due">Vencimento próximo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Cobranças (Tabela Desktop / Cartões Mobile) */}
      {paginatedInvoices.length > 0 ? (
        <div className="space-y-4">
          {/* Tabela Desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Referência</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Dias em Atraso</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedInvoices.map((inv) => {
                    const customer = getCustomerById(inv.customerId);
                    const overdueDays = getDaysOverdue(inv.dueDate);
                    const remaining = Math.max(0, inv.amount - inv.paidAmount);
                    const isOverdue = overdueDays > 0 && inv.status !== 'paid' && inv.status !== 'canceled';
                    const invoicePromises = getInvoicePromises(inv.id);
                    const pendingPromise = invoicePromises.find((p) => p.status === 'pending');

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => navigateToInvoice(inv.id)}
                      >
                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                              {customer?.type === 'company' ? (
                                <Building2 className="w-3.5 h-3.5" />
                              ) : (
                                <User className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (customer) navigateToCustomer(customer.id);
                                }}
                                className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline"
                              >
                                {customer?.name || 'Cliente desconhecido'}
                              </div>
                              {pendingPromise && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  Promessa: {formatDate(pendingPromise.promisedDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Referência */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                          {inv.invoiceNumber}
                          {inv.paymentLink && (
                            <LinkIcon className="w-3 h-3 text-indigo-500 inline ml-1.5" />
                          )}
                        </td>

                        {/* Valor */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{formatCurrency(inv.amount)}</div>
                          {inv.paidAmount > 0 && inv.paidAmount < inv.amount && (
                            <div className="text-[11px] text-slate-500">
                              Falta: {formatCurrency(remaining)}
                            </div>
                          )}
                        </td>

                        {/* Vencimento */}
                        <td className="py-3.5 px-4 text-slate-700">{formatDate(inv.dueDate)}</td>

                        {/* Estado */}
                        <td className="py-3.5 px-4">{renderStatusBadge(inv)}</td>

                        {/* Dias em Atraso */}
                        <td className="py-3.5 px-4">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {overdueDays} {overdueDays === 1 ? 'dia' : 'dias'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Ações Rápidas */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigateToInvoice(inv.id)}
                            >
                              Ver
                            </Button>

                            {inv.status !== 'paid' && inv.status !== 'canceled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedInvoiceForPayment(inv)}
                              >
                                Pagar
                              </Button>
                            )}

                            <Dropdown
                              trigger={
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              }
                              items={[
                                {
                                  label: 'Ver detalhe completo',
                                  icon: <Eye className="w-3.5 h-3.5 text-slate-500" />,
                                  onClick: () => navigateToInvoice(inv.id),
                                },
                                ...(inv.status !== 'paid' && inv.status !== 'canceled'
                                  ? [
                                      {
                                        label: 'Registar pagamento',
                                        icon: <CreditCard className="w-3.5 h-3.5 text-emerald-600" />,
                                        onClick: () => setSelectedInvoiceForPayment(inv),
                                      },
                                      {
                                        label: 'Registar promessa de pagamento',
                                        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
                                        onClick: () => setSelectedInvoiceForPromise(inv),
                                      },
                                      {
                                        label: 'Cancelar cobrança',
                                        icon: <Ban className="w-3.5 h-3.5 text-rose-600" />,
                                        onClick: () => setSelectedInvoiceForCancel(inv),
                                        danger: true,
                                      },
                                    ]
                                  : []),
                                ...(inv.status === 'canceled'
                                  ? [
                                      {
                                        label: 'Reabrir cobrança',
                                        icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />,
                                        onClick: async () => {
                                          const res = await reopenInvoice(inv.id);
                                          if (res.success) {
                                            showToast('Cobrança reaberta com sucesso.', 'success');
                                          }
                                        },
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cartões Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedInvoices.map((inv) => {
              const customer = getCustomerById(inv.customerId);
              const overdueDays = getDaysOverdue(inv.dueDate);
              const remaining = Math.max(0, inv.amount - inv.paidAmount);
              const isOverdue = overdueDays > 0 && inv.status !== 'paid' && inv.status !== 'canceled';

              return (
                <div
                  key={inv.id}
                  onClick={() => navigateToInvoice(inv.id)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {customer?.type === 'company' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{customer?.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{inv.invoiceNumber}</div>
                      </div>
                    </div>
                    <div>{renderStatusBadge(inv)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Valor:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.amount)}
                      </span>
                      {inv.paidAmount > 0 && inv.paidAmount < inv.amount && (
                        <span className="text-[10px] text-slate-500 block">
                          Resta: {formatCurrency(remaining)}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Vencimento:</span>
                      <span className="font-medium text-slate-800">{formatDate(inv.dueDate)}</span>
                      {isOverdue && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          {overdueDays} dias em atraso
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações Mobile */}
                  <div
                    className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="ghost" onClick={() => navigateToInvoice(inv.id)}>
                      Ver Detalhe
                    </Button>
                    {inv.status !== 'paid' && inv.status !== 'canceled' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedInvoiceForPayment(inv)}
                      >
                        Registar Pagamento
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                A mostrar {paginatedInvoices.length} de {filteredInvoices.length} cobranças
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      ) : (
        <Card className="p-8">
          {searchQuery || statusFilter !== 'all' || customerFilter !== 'all' || periodFilter !== 'all' ? (
            <EmptyState
              icon={<Search className="w-8 h-8 text-slate-400" />}
              title="Nenhuma cobrança encontrada"
              description="Não foram encontrados registos que correspondam aos filtros e termos de pesquisa selecionados."
              actionLabel="Limpar filtros"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCustomerFilter('all');
                setPeriodFilter('all');
              }}
            />
          ) : (
            <EmptyState
              icon={<Receipt className="w-8 h-8 text-indigo-500" />}
              title="Não tem cobranças registadas"
              description="Crie a sua primeira cobrança para começar a acompanhar o que tem por receber e organizar pagamentos com tranquilidade."
              actionLabel="+ Nova cobrança"
              onAction={() => setIsCreateModalOpen(true)}
            />
          )}
        </Card>
      )}

      {/* Modais da Secção */}
      {isCreateModalOpen && (
        <InvoiceFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setCurrentPage(1)}
        />
      )}

      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
        />
      )}

      {selectedInvoiceForPromise && (
        <RecordPromiseModal
          isOpen={!!selectedInvoiceForPromise}
          onClose={() => setSelectedInvoiceForPromise(null)}
          invoice={selectedInvoiceForPromise}
        />
      )}

      {selectedInvoiceForCancel && (
        <CancelInvoiceModal
          isOpen={!!selectedInvoiceForCancel}
          onClose={() => setSelectedInvoiceForCancel(null)}
          invoice={selectedInvoiceForCancel}
        />
      )}
    </div>
  );
};
