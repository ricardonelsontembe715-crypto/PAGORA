import {
  Automation,
  AutomationCondition,
  AutomationExecutionLog,
  CollectionReminder,
  CollectionSequence,
  SequenceStep,
  ReminderPriority,
  RecommendedActionType,
} from '../types/automations';
import {
  Customer,
  Invoice,
  InvoicePayment,
  PaymentPromise,
  SystemNotification,
  Account,
} from '../types/database';
import { getDaysOverdue, isDatePassed } from './formatters';

interface EngineEvaluationInput {
  account: Account;
  automations: Automation[];
  sequences: CollectionSequence[];
  invoices: Invoice[];
  customers: Customer[];
  promises: PaymentPromise[];
  existingReminders: CollectionReminder[];
}

interface EngineEvaluationResult {
  newReminders: CollectionReminder[];
  updatedReminders: CollectionReminder[];
  newLogs: AutomationExecutionLog[];
  newNotifications: Omit<SystemNotification, 'id' | 'accountId' | 'userId' | 'createdAt' | 'isRead'>[];
}

/**
 * Formata data como YYYY-MM-DD
 */
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Calcula diferença de dias entre duas datas (Data2 - Data1)
 */
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Ajusta hora para horário comercial (09:00 - 18:00) em dias úteis
 */
function getSmartSchedule(targetDate: Date, preferredTime = '09:30'): { scheduledDate: string; scheduledTime: string } {
  const adjusted = new Date(targetDate);
  const day = adjusted.getDay();

  // Se for Domingo (0), passa para Segunda (1)
  if (day === 0) {
    adjusted.setDate(adjusted.getDate() + 1);
  } else if (day === 6) {
    // Se for Sábado (6), passa para Segunda
    adjusted.setDate(adjusted.getDate() + 2);
  }

  return {
    scheduledDate: formatDate(adjusted),
    scheduledTime: preferredTime,
  };
}

/**
 * Avalia uma condição individual
 */
function evaluateCondition(
  condition: AutomationCondition,
  invoice: Invoice | undefined,
  customer: Customer | undefined,
  customerInvoices: Invoice[],
  customerPromises: PaymentPromise[]
): boolean {
  let actualValue: unknown;

  switch (condition.field) {
    case 'invoice_amount':
      actualValue = invoice ? invoice.amount - invoice.paidAmount : 0;
      break;

    case 'days_overdue':
      actualValue = invoice && invoice.status === 'overdue' ? getDaysOverdue(invoice.dueDate) : 0;
      break;

    case 'days_before_due': {
      if (!invoice) return false;
      const todayStr = formatDate(new Date());
      actualValue = getDaysDifference(todayStr, invoice.dueDate);
      break;
    }

    case 'customer_type':
      actualValue = customer?.type;
      break;

    case 'invoice_status':
      actualValue = invoice?.status;
      break;

    case 'customer_has_active_promise': {
      actualValue = customerPromises.some((p) => p.status === 'pending');
      break;
    }

    case 'customer_has_broken_promise': {
      actualValue = customerPromises.some(
        (p) => p.status === 'broken' || (p.status === 'pending' && isDatePassed(p.promisedDate))
      );
      break;
    }

    case 'customer_multiple_overdue': {
      const overdueCount = customerInvoices.filter(
        (i) => i.status === 'overdue' && i.amount - i.paidAmount > 0
      ).length;
      actualValue = overdueCount > 1;
      break;
    }

    case 'customer_total_debt': {
      const totalDebt = customerInvoices
        .filter((i) => i.status === 'pending' || i.status === 'overdue' || i.status === 'partially_paid')
        .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
      actualValue = totalDebt;
      break;
    }

    case 'has_payment_method':
      actualValue = !!invoice?.paymentMethod;
      break;

    case 'has_payment_link':
      actualValue = !!invoice?.paymentLink && invoice.paymentLink.trim().length > 0;
      break;

    case 'has_preferred_channel':
      actualValue = !!(customer?.phone || customer?.email);
      break;

    case 'invoice_description':
      actualValue = invoice?.description || '';
      break;

    default:
      return true;
  }

  // Operadores de comparação
  switch (condition.operator) {
    case 'equals':
      return String(actualValue).toLowerCase() === String(condition.value).toLowerCase();

    case 'not_equals':
      return String(actualValue).toLowerCase() !== String(condition.value).toLowerCase();

    case 'greater_than':
      return Number(actualValue) > Number(condition.value);

    case 'less_than':
      return Number(actualValue) < Number(condition.value);

    case 'greater_or_equal':
      return Number(actualValue) >= Number(condition.value);

    case 'less_or_equal':
      return Number(actualValue) <= Number(condition.value);

    case 'contains':
      return String(actualValue).toLowerCase().includes(String(condition.value).toLowerCase());

    case 'is_true':
      return Boolean(actualValue) === true;

    case 'is_false':
      return Boolean(actualValue) === false;

    default:
      return true;
  }
}

/**
 * Motor Central de Avaliação e Execução de Automações
 */
export function runAutomationEngine(input: EngineEvaluationInput): EngineEvaluationResult {
  const { account, automations, sequences, invoices, customers, promises, existingReminders } = input;

  const today = new Date();
  const todayStr = formatDate(today);

  const newReminders: CollectionReminder[] = [];
  const updatedReminders: CollectionReminder[] = [];
  const newLogs: AutomationExecutionLog[] = [];
  const newNotifications: Omit<SystemNotification, 'id' | 'accountId' | 'userId' | 'createdAt' | 'isRead'>[] = [];

  // Mapeamentos rápidos
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const customerInvoicesMap = new Map<string, Invoice[]>();
  invoices.forEach((inv) => {
    const list = customerInvoicesMap.get(inv.customerId) || [];
    list.push(inv);
    customerInvoicesMap.set(inv.customerId, list);
  });

  const customerPromisesMap = new Map<string, PaymentPromise[]>();
  promises.forEach((p) => {
    const list = customerPromisesMap.get(p.customerId) || [];
    list.push(p);
    customerPromisesMap.set(p.customerId, list);
  });

  const existingRemindersKeySet = new Set<string>();
  existingReminders.forEach((r) => {
    if (r.idempotencyKey && r.status !== 'canceled') {
      existingRemindersKeySet.add(r.idempotencyKey);
    }
  });

  // ==========================================
  // REGRA CRÍTICA 1: LIMPEZA DE LEMBRETES DE FATURAS PAGAS / CANCELADAS
  // ==========================================
  existingReminders.forEach((reminder) => {
    if (reminder.invoiceId && (reminder.status === 'pending' || reminder.status === 'snoozed')) {
      const inv = invoices.find((i) => i.id === reminder.invoiceId);
      if (inv) {
        if (inv.status === 'paid') {
          updatedReminders.push({
            ...reminder,
            status: 'completed',
            completedAt: new Date().toISOString(),
            notes: (reminder.notes ? `${reminder.notes} | ` : '') + 'Liquidado automaticamente por pagamento confirmado.',
            updatedAt: new Date().toISOString(),
          });
        } else if (inv.status === 'canceled') {
          updatedReminders.push({
            ...reminder,
            status: 'canceled',
            notes: (reminder.notes ? `${reminder.notes} | ` : '') + 'Cancelado automaticamente por anulação da fatura.',
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  });

  // ==========================================
  // AVALIAÇÃO DE REGRAS DE AUTOMAÇÃO ATIVAS
  // ==========================================
  const activeAutomations = automations.filter((a) => a.status === 'active');

  activeAutomations.forEach((auto) => {
    const trigger = auto.trigger;

    // Avaliação por Fatura
    if (
      [
        'invoice_created',
        'invoice_near_due',
        'invoice_due_today',
        'invoice_overdue',
        'invoice_overdue_days',
        'invoice_partially_paid',
      ].includes(trigger.type)
    ) {
      invoices.forEach((inv) => {
        // Ignora faturas pagas ou canceladas para criação de novas cobranças
        if (inv.status === 'paid' || inv.status === 'canceled') return;

        const customer = customerMap.get(inv.customerId);
        const custInvoices = customerInvoicesMap.get(inv.customerId) || [];
        const custPromises = customerPromisesMap.get(inv.customerId) || [];
        const daysDiff = getDaysDifference(todayStr, inv.dueDate); // Positivo = futuro, Negativo = passado
        const daysOverdue = getDaysOverdue(inv.dueDate);

        let triggerMatched = false;

        switch (trigger.type) {
          case 'invoice_near_due': {
            const targetOffset = trigger.daysOffset ?? 3;
            // Se hoje estiver exatamente a X dias do vencimento (ou dentro da janela preventiva)
            if (daysDiff === targetOffset || (daysDiff > 0 && daysDiff <= targetOffset)) {
              triggerMatched = true;
            }
            break;
          }

          case 'invoice_due_today': {
            if (inv.dueDate === todayStr) {
              triggerMatched = true;
            }
            break;
          }

          case 'invoice_overdue': {
            if (inv.status === 'overdue' || daysOverdue > 0) {
              triggerMatched = true;
            }
            break;
          }

          case 'invoice_overdue_days': {
            const requiredOverdueDays = trigger.daysOffset ?? 1;
            if (daysOverdue >= requiredOverdueDays && inv.status === 'overdue') {
              triggerMatched = true;
            }
            break;
          }

          case 'invoice_partially_paid': {
            if (inv.status === 'partially_paid') {
              triggerMatched = true;
            }
            break;
          }

          case 'invoice_created': {
            // Gatilho pontual
            const createdDaysAgo = getDaysDifference(inv.createdAt.split('T')[0], todayStr);
            if (createdDaysAgo <= 1) {
              triggerMatched = true;
            }
            break;
          }
        }

        if (!triggerMatched) return;

        // Avaliação das condições configuradas
        const conditionResults = auto.conditions.map((cond) => ({
          condition: `${cond.field} ${cond.operator} ${cond.value}`,
          matched: evaluateCondition(cond, inv, customer, custInvoices, custPromises),
        }));

        const conditionsPass =
          auto.conditions.length === 0 ||
          (auto.conditionLogic === 'any'
            ? conditionResults.some((r) => r.matched)
            : conditionResults.every((r) => r.matched));

        if (!conditionsPass) return;

        // Idempotência: chave única por regra + fatura + estágio de tempo
        const idempotencyKey = `auto_${auto.id}_inv_${inv.id}_trig_${trigger.type}_offset_${trigger.daysOffset ?? 0}_date_${todayStr}`;

        if (existingRemindersKeySet.has(idempotencyKey)) {
          return; // Já foi executado e não duplicamos
        }

        // Executa as ações da regra
        auto.actions.forEach((action) => {
          if (action.type === 'create_reminder' || action.type === 'create_task' || action.type === 'create_alert') {
            const schedule = getSmartSchedule(today, auto.settings?.preferredTime || '09:30');
            const remainingBalance = inv.amount - inv.paidAmount;

            const reminder: CollectionReminder = {
              id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              accountId: account.id,
              automationId: auto.id,
              customerId: inv.customerId,
              customerName: customer?.name || 'Cliente',
              customerPhone: customer?.phone,
              customerEmail: customer?.email,
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              amount: remainingBalance,
              dueDate: inv.dueDate,
              title: action.config.title || auto.name,
              reason: action.config.reason || auto.description,
              priority: (action.config.priority as ReminderPriority) || 'medium',
              scheduledDate: schedule.scheduledDate,
              scheduledTime: schedule.scheduledTime,
              status: 'pending',
              recommendedAction: 'generate_message',
              recommendedChannel: action.config.channel || 'whatsapp',
              recommendedTone: action.config.tone || 'cordial',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              idempotencyKey,
            };

            newReminders.push(reminder);
            existingRemindersKeySet.add(idempotencyKey);
          }

          if (action.type === 'send_system_notification') {
            newNotifications.push({
              title: action.config.title || auto.name,
              message: action.config.notificationText || `Alerta automático: ${customer?.name || 'Cliente'} (${inv.invoiceNumber})`,
              type: action.config.priority === 'urgent' ? 'error' : action.config.priority === 'high' ? 'warning' : 'info',
            });
          }
        });

        // Registo de auditoria / log de execução
        newLogs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          accountId: account.id,
          automationId: auto.id,
          automationName: auto.name,
          triggerType: trigger.type,
          customerId: inv.customerId,
          customerName: customer?.name,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          conditionsEvaluated: conditionResults,
          actionExecuted: auto.actions.map((a) => a.type).join(', '),
          result: 'success',
          details: `Regra avaliada com sucesso. Lembrete criado para ${customer?.name || 'Cliente'}.`,
          executedAt: new Date().toISOString(),
          idempotencyKey,
        });
      });
    }

    // Avaliação por Promessa de Pagamento
    if (['promise_due_today', 'promise_broken', 'promise_near_due'].includes(trigger.type)) {
      promises.forEach((prom) => {
        const customer = customerMap.get(prom.customerId);
        const inv = invoices.find((i) => i.id === prom.invoiceId);
        const isBroken = prom.status === 'broken' || (prom.status === 'pending' && isDatePassed(prom.promisedDate));
        const isDueToday = prom.promisedDate === todayStr && prom.status === 'pending';

        let match = false;
        if (trigger.type === 'promise_due_today' && isDueToday) match = true;
        if (trigger.type === 'promise_broken' && isBroken) match = true;

        if (!match) return;

        const idempotencyKey = `auto_${auto.id}_prom_${prom.id}_trig_${trigger.type}_date_${todayStr}`;
        if (existingRemindersKeySet.has(idempotencyKey)) return;

        auto.actions.forEach((action) => {
          if (action.type === 'create_reminder' || action.type === 'create_alert') {
            const schedule = getSmartSchedule(today, auto.settings?.preferredTime || '09:30');

            const reminder: CollectionReminder = {
              id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              accountId: account.id,
              automationId: auto.id,
              customerId: prom.customerId,
              customerName: customer?.name || 'Cliente',
              customerPhone: customer?.phone,
              customerEmail: customer?.email,
              invoiceId: prom.invoiceId,
              invoiceNumber: inv?.invoiceNumber,
              amount: prom.amount,
              dueDate: prom.promisedDate,
              title: action.config.title || (isBroken ? 'Promessa de Pagamento Quebrada' : 'Promessa de Pagamento para Hoje'),
              reason: action.config.reason || `Acordo no valor de ${prom.amount.toFixed(2)} € agendado para ${prom.promisedDate}.`,
              priority: isBroken ? 'urgent' : 'high',
              scheduledDate: schedule.scheduledDate,
              scheduledTime: schedule.scheduledTime,
              status: 'pending',
              recommendedAction: 'generate_message',
              recommendedChannel: action.config.channel || 'whatsapp',
              recommendedTone: isBroken ? 'formal' : 'professional',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              idempotencyKey,
            };

            newReminders.push(reminder);
            existingRemindersKeySet.add(idempotencyKey);
          }

          if (action.type === 'send_system_notification') {
            newNotifications.push({
              title: isBroken ? 'Promessa Quebrada' : 'Promessa a Vencer Hoje',
              message: `${customer?.name || 'Cliente'} tinha compromisso para ${prom.promisedDate} de ${prom.amount.toFixed(2)} €.`,
              type: isBroken ? 'error' : 'warning',
            });
          }
        });

        newLogs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          accountId: account.id,
          automationId: auto.id,
          automationName: auto.name,
          triggerType: trigger.type,
          customerId: prom.customerId,
          customerName: customer?.name,
          invoiceId: prom.invoiceId,
          invoiceNumber: inv?.invoiceNumber,
          conditionsEvaluated: [{ condition: 'promise_status', matched: true }],
          actionExecuted: auto.actions.map((a) => a.type).join(', '),
          result: 'success',
          details: `Lembrete de promessa gerado para ${customer?.name || 'Cliente'}.`,
          executedAt: new Date().toISOString(),
          idempotencyKey,
        });
      });
    }

    // Avaliação por Cliente (ex: Exposição de Dívida)
    if (trigger.type === 'customer_debt_exceeded') {
      const threshold = trigger.thresholdValue ?? 1000;

      customers.forEach((c) => {
        const custInvoices = customerInvoicesMap.get(c.id) || [];
        const overdueDebt = custInvoices
          .filter((i) => i.status === 'overdue')
          .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

        if (overdueDebt >= threshold) {
          const idempotencyKey = `auto_${auto.id}_cust_${c.id}_debt_${threshold}_date_${todayStr}`;
          if (existingRemindersKeySet.has(idempotencyKey)) return;

          const schedule = getSmartSchedule(today, auto.settings?.preferredTime || '09:30');

          newReminders.push({
            id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            accountId: account.id,
            automationId: auto.id,
            customerId: c.id,
            customerName: c.name,
            customerPhone: c.phone,
            customerEmail: c.email,
            amount: overdueDebt,
            title: `Exposição Elevada: ${c.name}`,
            reason: `Cliente acumula ${overdueDebt.toFixed(2)} € em atraso. Requer abordagem prioritária.`,
            priority: 'urgent',
            scheduledDate: schedule.scheduledDate,
            scheduledTime: schedule.scheduledTime,
            status: 'pending',
            recommendedAction: 'call_customer',
            recommendedChannel: 'whatsapp',
            recommendedTone: 'formal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            idempotencyKey,
          });

          existingRemindersKeySet.add(idempotencyKey);
        }
      });
    }
  });

  return {
    newReminders,
    updatedReminders,
    newLogs,
    newNotifications,
  };
}
