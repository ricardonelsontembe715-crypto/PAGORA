import { CustomerType, InvoiceStatus, MessageChannel, MessageIntent, MessageTone, MessageCategory, PaymentMethod } from './database';

export type AutomationTriggerType =
  // Cobranças
  | 'invoice_created'
  | 'invoice_near_due'
  | 'invoice_due_today'
  | 'invoice_overdue'
  | 'invoice_overdue_days'
  | 'invoice_partially_paid'
  | 'invoice_paid'
  | 'invoice_canceled'
  | 'invoice_reopened'
  | 'balance_updated'
  | 'payment_recorded'
  // Clientes
  | 'customer_created'
  | 'customer_no_invoices'
  | 'customer_pending_balance'
  | 'customer_multiple_overdue'
  | 'customer_debt_exceeded'
  | 'customer_risk_tier'
  | 'customer_recovered_payment'
  // Promessas
  | 'promise_created'
  | 'promise_near_due'
  | 'promise_due_today'
  | 'promise_kept'
  | 'promise_broken'
  // Comunicação
  | 'message_prepared'
  | 'message_copied'
  | 'message_sent_manually'
  | 'no_action_period';

export type AutomationConditionField =
  | 'invoice_amount'
  | 'days_overdue'
  | 'days_before_due'
  | 'customer_type'
  | 'invoice_status'
  | 'customer_has_active_promise'
  | 'customer_has_broken_promise'
  | 'customer_multiple_overdue'
  | 'customer_total_debt'
  | 'has_payment_method'
  | 'has_payment_link'
  | 'has_preferred_channel'
  | 'invoice_description';

export type AutomationConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'contains'
  | 'is_true'
  | 'is_false';

export interface AutomationCondition {
  id: string;
  field: AutomationConditionField;
  operator: AutomationConditionOperator;
  value: string | number | boolean;
  logicalOp?: 'AND' | 'OR';
}

export type AutomationActionType =
  | 'create_reminder'
  | 'create_task'
  | 'create_alert'
  | 'prepare_message'
  | 'generate_custom_message'
  | 'save_draft_message'
  | 'mark_priority'
  | 'add_tag'
  | 'update_internal_status'
  | 'create_followup_promise'
  | 'add_internal_note'
  | 'send_system_notification';

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  config: {
    title?: string;
    reason?: string;
    priority?: 'urgent' | 'high' | 'medium' | 'low';
    channel?: MessageChannel;
    tone?: MessageTone;
    intent?: MessageIntent;
    category?: MessageCategory;
    templateId?: string;
    noteText?: string;
    notificationText?: string;
    scheduledDaysOffset?: number; // dias a partir do gatilho
    scheduledTime?: string; // ex: "09:00"
    tag?: string;
  };
}

export type AutomationStatus = 'active' | 'paused' | 'draft';

export interface AutomationSettings {
  preferredTime: string; // Ex: "09:30"
  respectBusinessHours: boolean;
  daysOfWeek: number[]; // 1=Seg, 2=Ter, ..., 5=Sex
  stopOnPayment: boolean;
  stopOnPromise: boolean;
  maxReminders?: number;
  minInvoiceAmount?: number;
}

export interface Automation {
  id: string;
  accountId: string;
  name: string;
  description: string;
  status: AutomationStatus;
  trigger: {
    type: AutomationTriggerType;
    daysOffset?: number; // ex: 3 (dias antes/depois)
    thresholdValue?: number; // ex: valor mínimo em dívida
  };
  conditions: AutomationCondition[];
  conditionLogic: 'all' | 'any'; // all = E (AND), any = OU (OR)
  actions: AutomationAction[];
  isPreset?: boolean;
  category?: 'preventive' | 'due_date' | 'overdue' | 'promises' | 'customers' | 'custom';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  executionCount: number;
  successCount: number;
  failedCount: number;
  settings: AutomationSettings;
}

export interface AutomationExecutionLog {
  id: string;
  accountId: string;
  automationId: string;
  automationName: string;
  triggerType: AutomationTriggerType;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  conditionsEvaluated: {
    condition: string;
    matched: boolean;
  }[];
  actionExecuted: string;
  result: 'success' | 'failed' | 'skipped';
  details: string;
  executedAt: string;
  idempotencyKey: string;
}

export type ReminderPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ReminderStatus = 'pending' | 'completed' | 'snoozed' | 'canceled';
export type RecommendedActionType =
  | 'generate_message'
  | 'call_customer'
  | 'record_payment'
  | 'create_promise'
  | 'review_invoice'
  | 'follow_up';

export interface CollectionReminder {
  id: string;
  accountId: string;
  automationId?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount?: number;
  dueDate?: string;
  title: string;
  reason: string;
  priority: ReminderPriority;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // "09:30"
  status: ReminderStatus;
  recommendedAction: RecommendedActionType;
  recommendedChannel?: MessageChannel;
  recommendedTone?: MessageTone;
  completedAt?: string;
  snoozedUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  idempotencyKey?: string;
}

export interface SequenceStep {
  id: string;
  stepNumber: number;
  offsetDays: number; // Negativo = antes do vencimento, 0 = no dia, Positivo = após vencimento
  title: string;
  description: string;
  tone: MessageTone;
  channel: MessageChannel;
  priority: ReminderPriority;
  actionText: string;
  category: MessageCategory;
}

export type SequenceCategory = 'friendly' | 'professional' | 'b2b' | 'recurrent' | 'overdue' | 'broken_promise' | 'preventive' | 'custom';

export interface CollectionSequence {
  id: string;
  accountId: string;
  name: string;
  description: string;
  isPreset: boolean;
  category: SequenceCategory;
  steps: SequenceStep[];
  isActive: boolean;
  assignedCustomersCount: number;
  assignedInvoicesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationMetrics {
  activeAutomations: number;
  pausedAutomations: number;
  totalAutomations: number;
  pendingReminders: number;
  todayReminders: number;
  overdueReminders: number;
  completedReminders: number;
  totalExecutions: number;
  successfulActions: number;
  customersInFollowup: number;
  promisesDueSoon: number;
}
