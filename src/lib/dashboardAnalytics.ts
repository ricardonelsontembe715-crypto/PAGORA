import {
  Invoice,
  InvoicePayment,
  PaymentPromise,
  Customer,
  ActivityLog,
} from '../types/database';
import { getDaysOverdue } from './formatters';

export type PeriodOption =
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PeriodComparison {
  current: DateRange;
  previous: DateRange;
  label: string;
}

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityItem {
  id: string;
  priority: PriorityLevel;
  type: 'broken_promise' | 'overdue_invoice' | 'upcoming_due' | 'pending_promise' | 'customer_multiple_overdue';
  title: string;
  description: string;
  reason: string;
  amount: number;
  customerId: string;
  customerName: string;
  customerType: 'person' | 'company';
  customerPhone?: string;
  customerEmail?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  daysOverdue?: number;
  dueDate?: string;
  promiseDate?: string;
  recommendedAction: string;
}

export interface UpcomingDueItem {
  invoice: Invoice;
  customer?: Customer;
  timeframe: 'today' | 'tomorrow' | 'this_week' | 'later';
  timeframeLabel: string;
  daysRemaining: number;
  remainingAmount: number;
}

export interface PriorityCustomerSummary {
  customer: Customer;
  overdueAmount: number;
  pendingAmount: number;
  totalReceivable: number;
  overdueInvoicesCount: number;
  totalInvoicesCount: number;
  hasBrokenPromise: boolean;
  latestActivityDate?: string;
}

export interface ChartDataPoint {
  label: string;
  dateKey: string;
  invoiced: number;
  received: number;
  overdue: number;
}

export interface DashboardMetricsResult {
  totalReceivable: number;
  pendingAmount: number;
  overdueAmount: number;
  totalPaidAllTime: number;

  paidInPeriod: number;
  paidPreviousPeriod: number;
  paidPercentageChange: number | null; // e.g. 12.5 or -4.2

  invoicedInPeriod: number;
  invoicedPreviousPeriod: number;

  overdueInPeriod: number;
  collectionRate: number | null; // e.g. 84.5%
  recoveredAmount: number; // Pagamentos recebidos de cobranças que estiveram em atraso

  activeCustomersCount: number;
  openInvoicesCount: number;
  overdueInvoicesCount: number;
  paidInvoicesCount: number;

  activePromisesCount: number;
  brokenPromisesCount: number;
  keptPromisesCount: number;

  priorityItems: PriorityItem[];
  upcomingDueItems: UpcomingDueItem[];
  priorityCustomers: PriorityCustomerSummary[];
  chartData: ChartDataPoint[];
}

/**
 * Calcula o intervalo de datas atual e o período anterior equivalente
 */
export function getPeriodDateRanges(
  period: PeriodOption,
  customStart?: string,
  customEnd?: string
): PeriodComparison {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let currentStart: Date;
  let currentEnd = today;
  let prevStart: Date;
  let prevEnd: Date;
  let label = 'Últimos 30 dias';

  switch (period) {
    case 'today': {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentEnd.getTime() - 24 * 60 * 60 * 1000);
      label = 'Hoje';
      break;
    }
    case 'last_7_days': {
      currentStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      const duration = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
      label = 'Últimos 7 dias';
      break;
    }
    case 'last_30_days': {
      currentStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      const duration = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
      label = 'Últimos 30 dias';
      break;
    }
    case 'this_month': {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      // Mês anterior completo
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'Este mês';
      break;
    }
    case 'last_month': {
      currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      // Mês anterior a esse
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      label = 'Mês anterior';
      break;
    }
    case 'last_3_months': {
      currentStart = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      const duration = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
      label = 'Últimos 3 meses';
      break;
    }
    case 'last_6_months': {
      currentStart = new Date(today.getTime() - 179 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      const duration = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
      label = 'Últimos 6 meses';
      break;
    }
    case 'this_year': {
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      label = 'Este ano';
      break;
    }
    case 'custom': {
      if (customStart && customEnd) {
        currentStart = new Date(`${customStart}T00:00:00`);
        currentEnd = new Date(`${customEnd}T23:59:59`);
        if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) {
          currentStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
          currentEnd = today;
        }
      } else {
        currentStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
        currentEnd = today;
      }
      const duration = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
      label = 'Personalizado';
      break;
    }
    default: {
      currentStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - (today.getTime() - currentStart.getTime()));
      label = 'Últimos 30 dias';
    }
  }

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: prevStart, end: prevEnd },
    label,
  };
}

/**
 * Motor Principal de Cálculo do Dashboard
 */
export function computeDashboardMetrics({
  invoices,
  payments,
  promises,
  customers,
  period,
  customStart,
  customEnd,
}: {
  invoices: Invoice[];
  payments: InvoicePayment[];
  promises: PaymentPromise[];
  customers: Customer[];
  period: PeriodOption;
  customStart?: string;
  customEnd?: string;
}): DashboardMetricsResult {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const { current, previous } = getPeriodDateRanges(period, customStart, customEnd);
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  // 1. Totais Globais
  let totalReceivable = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;
  let totalPaidAllTime = 0;

  let openInvoicesCount = 0;
  let overdueInvoicesCount = 0;
  let paidInvoicesCount = 0;

  // Mapa de faturas para acesso rápido
  const invoiceMap = new Map<string, Invoice>();
  invoices.forEach((inv) => invoiceMap.set(inv.id, inv));

  invoices.forEach((inv) => {
    totalPaidAllTime += inv.paidAmount || 0;

    if (inv.status === 'canceled' || inv.status === 'draft') {
      return;
    }

    const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));

    if (inv.status === 'paid' || balance <= 0) {
      paidInvoicesCount += 1;
    } else {
      openInvoicesCount += 1;
      totalReceivable += balance;
      const isOverdue = getDaysOverdue(inv.dueDate) > 0;

      if (isOverdue || inv.status === 'overdue') {
        overdueAmount += balance;
        overdueInvoicesCount += 1;
      } else {
        pendingAmount += balance;
      }
    }
  });

  // 2. Pagamentos no Período Selecionado vs Período Anterior
  let paidInPeriod = 0;
  let recoveredAmount = 0;

  payments.forEach((pay) => {
    const payDate = new Date(pay.paymentDate || pay.createdAt);
    const payTime = payDate.getTime();

    if (payTime >= current.start.getTime() && payTime <= current.end.getTime()) {
      paidInPeriod += pay.amount || 0;

      // Calcular montante recuperado: se o pagamento foi feito depois da data de vencimento da fatura correspondente
      const targetInvoice = invoiceMap.get(pay.invoiceId);
      if (targetInvoice && targetInvoice.dueDate) {
        const dueDateObj = new Date(`${targetInvoice.dueDate}T23:59:59`);
        if (payTime > dueDateObj.getTime()) {
          recoveredAmount += pay.amount || 0;
        }
      }
    }
  });

  let paidPreviousPeriod = 0;
  payments.forEach((pay) => {
    const payDate = new Date(pay.paymentDate || pay.createdAt);
    const payTime = payDate.getTime();
    if (payTime >= previous.start.getTime() && payTime <= previous.end.getTime()) {
      paidPreviousPeriod += pay.amount || 0;
    }
  });

  let paidPercentageChange: number | null = null;
  if (paidPreviousPeriod > 0) {
    paidPercentageChange = Math.round(((paidInPeriod - paidPreviousPeriod) / paidPreviousPeriod) * 1000) / 10;
  } else if (paidInPeriod > 0) {
    paidPercentageChange = 100;
  }

  // 3. Faturado no Período vs Anterior
  let invoicedInPeriod = 0;
  let invoicedPreviousPeriod = 0;
  let overdueInPeriod = 0;

  invoices.forEach((inv) => {
    if (inv.status === 'canceled' || inv.status === 'draft') return;

    const issueDate = new Date(inv.issueDate || inv.createdAt);
    const issueTime = issueDate.getTime();

    if (issueTime >= current.start.getTime() && issueTime <= current.end.getTime()) {
      invoicedInPeriod += inv.amount;
      const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));
      if (balance > 0 && getDaysOverdue(inv.dueDate) > 0) {
        overdueInPeriod += balance;
      }
    }

    if (issueTime >= previous.start.getTime() && issueTime <= previous.end.getTime()) {
      invoicedPreviousPeriod += inv.amount;
    }
  });

  // Taxa de recebimento no período
  let collectionRate: number | null = null;
  const periodTotalDue = paidInPeriod + overdueInPeriod;
  if (periodTotalDue > 0) {
    collectionRate = Math.round((paidInPeriod / periodTotalDue) * 1000) / 10;
  }

  // 4. Estatísticas de Promessas de Pagamento
  let activePromisesCount = 0;
  let brokenPromisesCount = 0;
  let keptPromisesCount = 0;

  promises.forEach((prom) => {
    if (prom.status === 'pending') {
      const isPast = getDaysOverdue(prom.promisedDate) > 0;
      if (isPast) {
        brokenPromisesCount += 1;
      } else {
        activePromisesCount += 1;
      }
    } else if (prom.status === 'broken') {
      brokenPromisesCount += 1;
    } else if (prom.status === 'kept') {
      keptPromisesCount += 1;
    }
  });

  // 5. Sistema de Atenção Prioritária (Precisa da sua atenção)
  const priorityItems: PriorityItem[] = [];

  // A. Promessas Quebradas (Prioridade CRÍTICA)
  promises.forEach((prom) => {
    const isPast = getDaysOverdue(prom.promisedDate) > 0 && prom.status === 'pending';
    if (prom.status === 'broken' || isPast) {
      const cust = customerMap.get(prom.customerId);
      const inv = invoiceMap.get(prom.invoiceId);
      const balance = inv ? Math.max(0, inv.amount - (inv.paidAmount || 0)) : prom.amount;

      priorityItems.push({
        id: `prio_broken_${prom.id}`,
        priority: 'CRITICAL',
        type: 'broken_promise',
        title: `Promessa não cumprida de ${cust?.name || 'Cliente'}`,
        description: `O compromisso de pagamento no valor de ${prom.amount.toFixed(2)} € venceu a ${prom.promisedDate} sem liquidação registada.`,
        reason: 'Data limite prometida pelo cliente foi ultrapassada.',
        amount: balance,
        customerId: prom.customerId,
        customerName: cust?.name || 'Cliente',
        customerType: cust?.type || 'company',
        customerPhone: cust?.phone,
        customerEmail: cust?.email,
        invoiceId: prom.invoiceId,
        invoiceNumber: inv?.invoiceNumber,
        promiseDate: prom.promisedDate,
        recommendedAction: 'Entrar em contacto para reagendar ou solicitar comprovativo.',
      });
    }
  });

  // B. Faturas Vencidas e Relevantes
  invoices.forEach((inv) => {
    if (inv.status === 'canceled' || inv.status === 'paid' || inv.status === 'draft') return;
    const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));
    if (balance <= 0) return;

    const daysOverdue = getDaysOverdue(inv.dueDate);
    const cust = customerMap.get(inv.customerId);

    if (daysOverdue > 0) {
      let priority: PriorityLevel = 'MEDIUM';
      let reason = `Vencida há ${daysOverdue} dia(s).`;

      if (daysOverdue >= 15 || balance >= 1000) {
        priority = 'CRITICAL';
        reason = daysOverdue >= 15
          ? `Atraso prolongado (${daysOverdue} dias) a requerer intervenção direta.`
          : `Valor elevado (${balance.toFixed(2)} €) em atraso há ${daysOverdue} dias.`;
      } else if (daysOverdue >= 5 || balance >= 500) {
        priority = 'HIGH';
        reason = `Atraso de ${daysOverdue} dias sem confirmação de pagamento.`;
      } else {
        priority = 'MEDIUM';
        reason = `Vencimento recente (${daysOverdue} dias) — ideal para lembrete cordial.`;
      }

      // Evitar duplicar se já foi adicionado como promessa quebrada
      const alreadyHasBroken = priorityItems.some(
        (p) => p.invoiceId === inv.id && p.type === 'broken_promise'
      );
      if (!alreadyHasBroken) {
        priorityItems.push({
          id: `prio_inv_${inv.id}`,
          priority,
          type: 'overdue_invoice',
          title: `Cobrança ${inv.invoiceNumber} em atraso`,
          description: `${cust?.name || 'Cliente'} tem ${balance.toFixed(2)} € por liquidar desde ${inv.dueDate}.`,
          reason,
          amount: balance,
          customerId: inv.customerId,
          customerName: cust?.name || 'Cliente',
          customerType: cust?.type || 'company',
          customerPhone: cust?.phone,
          customerEmail: cust?.email,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          daysOverdue,
          dueDate: inv.dueDate,
          recommendedAction:
            priority === 'CRITICAL'
              ? 'Enviar cobrança formal ou efetuar contacto telefónico imediato.'
              : 'Gerar mensagem de acompanhamento profissional.',
        });
      }
    }
  });

  // C. Promessas Pendentes Próximas (vencem nos próximos 2 dias)
  promises.forEach((prom) => {
    if (prom.status === 'pending') {
      const daysUntil = getDaysUntilDate(prom.promisedDate);
      if (daysUntil >= 0 && daysUntil <= 2) {
        const cust = customerMap.get(prom.customerId);
        const inv = invoiceMap.get(prom.invoiceId);
        const balance = inv ? Math.max(0, inv.amount - (inv.paidAmount || 0)) : prom.amount;

        priorityItems.push({
          id: `prio_prom_soon_${prom.id}`,
          priority: daysUntil === 0 ? 'HIGH' : 'MEDIUM',
          type: 'pending_promise',
          title: `Promessa de pagamento ${daysUntil === 0 ? 'para hoje' : `em ${daysUntil} dia(s)`}`,
          description: `${cust?.name || 'Cliente'} comprometeu-se a pagar ${prom.amount.toFixed(2)} € até ${prom.promisedDate}.`,
          reason: daysUntil === 0 ? 'Data prometida é hoje.' : `Vencimento do compromisso em ${daysUntil} dia(s).`,
          amount: balance,
          customerId: prom.customerId,
          customerName: cust?.name || 'Cliente',
          customerType: cust?.type || 'company',
          customerPhone: cust?.phone,
          customerEmail: cust?.email,
          invoiceId: prom.invoiceId,
          invoiceNumber: inv?.invoiceNumber,
          promiseDate: prom.promisedDate,
          recommendedAction: 'Aguardar comprovativo ou preparar confirmação cordial.',
        });
      }
    }
  });

  // Ordenação das prioridades: CRITICAL -> HIGH -> MEDIUM -> LOW, e por montante decrescente
  const priorityOrder: Record<PriorityLevel, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  priorityItems.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.amount - a.amount;
  });

  // 6. Próximos Vencimentos (Hoje, Amanhã, Próximos 7 dias)
  const upcomingDueItems: UpcomingDueItem[] = [];

  invoices.forEach((inv) => {
    if (inv.status === 'canceled' || inv.status === 'paid' || inv.status === 'draft') return;
    const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));
    if (balance <= 0) return;

    const daysUntil = getDaysUntilDate(inv.dueDate);

    // Se ainda não venceu ou vence hoje / próximos 14 dias
    if (daysUntil >= 0 && daysUntil <= 14) {
      const cust = customerMap.get(inv.customerId);
      let timeframe: 'today' | 'tomorrow' | 'this_week' | 'later' = 'later';
      let timeframeLabel = `Em ${daysUntil} dias`;

      if (daysUntil === 0) {
        timeframe = 'today';
        timeframeLabel = 'Hoje';
      } else if (daysUntil === 1) {
        timeframe = 'tomorrow';
        timeframeLabel = 'Amanhã';
      } else if (daysUntil <= 7) {
        timeframe = 'this_week';
        timeframeLabel = `Daqui a ${daysUntil} dias`;
      }

      upcomingDueItems.push({
        invoice: inv,
        customer: cust,
        timeframe,
        timeframeLabel,
        daysRemaining: daysUntil,
        remainingAmount: balance,
      });
    }
  });

  upcomingDueItems.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 7. Clientes que Exigem Atenção
  const customerStatsMap = new Map<
    string,
    {
      customer: Customer;
      overdueAmount: number;
      pendingAmount: number;
      totalReceivable: number;
      overdueInvoicesCount: number;
      totalInvoicesCount: number;
      hasBrokenPromise: boolean;
      latestActivityDate?: string;
    }
  >();

  customers.forEach((cust) => {
    if (cust.status === 'archived') return;
    customerStatsMap.set(cust.id, {
      customer: cust,
      overdueAmount: 0,
      pendingAmount: 0,
      totalReceivable: 0,
      overdueInvoicesCount: 0,
      totalInvoicesCount: 0,
      hasBrokenPromise: false,
    });
  });

  invoices.forEach((inv) => {
    if (inv.status === 'canceled' || inv.status === 'draft') return;
    const stats = customerStatsMap.get(inv.customerId);
    if (!stats) return;

    stats.totalInvoicesCount += 1;
    const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));

    if (balance > 0) {
      stats.totalReceivable += balance;
      if (getDaysOverdue(inv.dueDate) > 0 || inv.status === 'overdue') {
        stats.overdueAmount += balance;
        stats.overdueInvoicesCount += 1;
      } else {
        stats.pendingAmount += balance;
      }
    }
  });

  promises.forEach((prom) => {
    const stats = customerStatsMap.get(prom.customerId);
    if (!stats) return;
    if (prom.status === 'broken' || (prom.status === 'pending' && getDaysOverdue(prom.promisedDate) > 0)) {
      stats.hasBrokenPromise = true;
    }
  });

  const priorityCustomers: PriorityCustomerSummary[] = Array.from(customerStatsMap.values())
    .filter((c) => c.overdueAmount > 0 || c.totalReceivable > 0 || c.hasBrokenPromise)
    .sort((a, b) => {
      // Ordenar por promessa quebrada primeiro, depois maior atraso, depois total em aberto
      if (a.hasBrokenPromise && !b.hasBrokenPromise) return -1;
      if (!a.hasBrokenPromise && b.hasBrokenPromise) return 1;
      if (b.overdueAmount !== a.overdueAmount) {
        return b.overdueAmount - a.overdueAmount;
      }
      return b.totalReceivable - a.totalReceivable;
    })
    .slice(0, 5);

  // 8. Gráfico de Evolução (Eixo Temporal Dinâmico)
  const chartData = generateChartData(invoices, payments, current);

  return {
    totalReceivable,
    pendingAmount,
    overdueAmount,
    totalPaidAllTime,
    paidInPeriod,
    paidPreviousPeriod,
    paidPercentageChange,
    invoicedInPeriod,
    invoicedPreviousPeriod,
    overdueInPeriod,
    collectionRate,
    recoveredAmount,
    activeCustomersCount: customers.filter((c) => c.status === 'active').length,
    openInvoicesCount,
    overdueInvoicesCount,
    paidInvoicesCount,
    activePromisesCount,
    brokenPromisesCount,
    keptPromisesCount,
    priorityItems,
    upcomingDueItems,
    priorityCustomers,
    chartData,
  };
}

/**
 * Calcula os dias que faltam até uma determinada data (0 se for hoje)
 */
function getDaysUntilDate(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  try {
    const parts = targetDateStr.split('T')[0].split('-');
    if (parts.length !== 3) return 0;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const targetDate = new Date(year, month, day, 0, 0, 0, 0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Gera pontos de dados para o gráfico de fluxo financeiro
 */
function generateChartData(
  invoices: Invoice[],
  payments: InvoicePayment[],
  dateRange: DateRange
): ChartDataPoint[] {
  const durationDays = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Se o período for curto (<= 14 dias), agrupar por dia
  if (durationDays <= 14) {
    const points: ChartDataPoint[] = [];
    const curr = new Date(dateRange.start);

    while (curr <= dateRange.end) {
      const dateKey = curr.toISOString().split('T')[0];
      const dayLabel = `${curr.getDate()}/${curr.getMonth() + 1}`;

      let invoiced = 0;
      let received = 0;
      let overdue = 0;

      invoices.forEach((inv) => {
        if (inv.status === 'canceled' || inv.status === 'draft') return;
        if (inv.issueDate === dateKey) {
          invoiced += inv.amount;
        }
        if (inv.dueDate === dateKey && inv.status !== 'paid') {
          overdue += Math.max(0, inv.amount - (inv.paidAmount || 0));
        }
      });

      payments.forEach((pay) => {
        const payDateKey = (pay.paymentDate || pay.createdAt).split('T')[0];
        if (payDateKey === dateKey) {
          received += pay.amount || 0;
        }
      });

      points.push({
        label: dayLabel,
        dateKey,
        invoiced,
        received,
        overdue,
      });

      curr.setDate(curr.getDate() + 1);
    }
    return points;
  }

  // Se for <= 90 dias, agrupar em 6 a 8 intervalos semanais
  if (durationDays <= 90) {
    const numBuckets = 6;
    const bucketDurationMs = (dateRange.end.getTime() - dateRange.start.getTime()) / numBuckets;
    const points: ChartDataPoint[] = [];

    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = new Date(dateRange.start.getTime() + i * bucketDurationMs);
      const bucketEnd = new Date(dateRange.start.getTime() + (i + 1) * bucketDurationMs - 1);
      const label = `Sem ${i + 1} (${bucketStart.getDate()}/${bucketStart.getMonth() + 1})`;

      let invoiced = 0;
      let received = 0;
      let overdue = 0;

      invoices.forEach((inv) => {
        if (inv.status === 'canceled' || inv.status === 'draft') return;
        const issueTime = new Date(inv.issueDate).getTime();
        if (issueTime >= bucketStart.getTime() && issueTime <= bucketEnd.getTime()) {
          invoiced += inv.amount;
        }
        const dueTime = new Date(inv.dueDate).getTime();
        if (dueTime >= bucketStart.getTime() && dueTime <= bucketEnd.getTime() && inv.status !== 'paid') {
          overdue += Math.max(0, inv.amount - (inv.paidAmount || 0));
        }
      });

      payments.forEach((pay) => {
        const payTime = new Date(pay.paymentDate || pay.createdAt).getTime();
        if (payTime >= bucketStart.getTime() && payTime <= bucketEnd.getTime()) {
          received += pay.amount || 0;
        }
      });

      points.push({
        label,
        dateKey: bucketStart.toISOString().split('T')[0],
        invoiced,
        received,
        overdue,
      });
    }
    return points;
  }

  // Se for anual (> 90 dias), agrupar por mês
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const points: ChartDataPoint[] = [];

  const startMonth = dateRange.start.getMonth();
  const startYear = dateRange.start.getFullYear();
  const endMonth = dateRange.end.getMonth();
  const endYear = dateRange.end.getFullYear();

  let curYear = startYear;
  let curMonth = startMonth;

  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    const monthLabel = `${months[curMonth]} ${curYear !== new Date().getFullYear() ? String(curYear).slice(2) : ''}`.trim();
    const monthStart = new Date(curYear, curMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999);

    let invoiced = 0;
    let received = 0;
    let overdue = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'canceled' || inv.status === 'draft') return;
      const issueTime = new Date(inv.issueDate).getTime();
      if (issueTime >= monthStart.getTime() && issueTime <= monthEnd.getTime()) {
        invoiced += inv.amount;
      }
      const dueTime = new Date(inv.dueDate).getTime();
      if (dueTime >= monthStart.getTime() && dueTime <= monthEnd.getTime() && inv.status !== 'paid') {
        overdue += Math.max(0, inv.amount - (inv.paidAmount || 0));
      }
    });

    payments.forEach((pay) => {
      const payTime = new Date(pay.paymentDate || pay.createdAt).getTime();
      if (payTime >= monthStart.getTime() && payTime <= monthEnd.getTime()) {
        received += pay.amount || 0;
      }
    });

    points.push({
      label: monthLabel,
      dateKey: `${curYear}-${String(curMonth + 1).padStart(2, '0')}`,
      invoiced,
      received,
      overdue,
    });

    curMonth++;
    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }
  }

  return points;
}
