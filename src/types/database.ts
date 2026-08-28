/**
 * PAGORA - Tipos e Modelos da Estrutura de Dados
 * Arquitetura preparada para isolamento multi-tenant:
 * User -> Account -> Customers -> Invoices -> Payments / Reminders / Promises / Messages
 */

export type PlanType = 'free' | 'plus' | 'pro';

export type UserRole = 'owner' | 'admin' | 'member';

export type AdminRole = 'superadmin' | 'support' | 'auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  taxId?: string; // NIF
  currency: string; // Ex: 'EUR'
  plan: PlanType;
  ownerId: string;
  activityType?: string;
  usagePurpose?: string;
  address?: string;
  website?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface Subscription {
  id: string;
  accountId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  externalSubscriptionId?: string;
  externalCustomerId?: string;
}

export type CustomerType = 'person' | 'company';
export type CustomerStatus = 'active' | 'archived';

export interface Customer {
  id: string;
  accountId: string;
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  notes?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface CustomerFormData {
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}

export interface CustomerFinancialStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  invoicesCount: number;
  overdueInvoicesCount: number;
  lastInvoiceDate?: string;
  lastPaymentDate?: string;
}

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  archivedCustomers: number;
  customersWithPending: number;
  customersWithOverdue: number;
}

export type InvoiceStatus = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'canceled';

export type PaymentMethod =
  | 'bank_transfer'
  | 'mbway'
  | 'multibanco'
  | 'card'
  | 'paypal'
  | 'cash'
  | 'other';

export interface Invoice {
  id: string;
  accountId: string;
  customerId: string;
  invoiceNumber: string;
  description?: string;
  amount: number;
  paidAmount: number;
  dueDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod | string;
  paymentLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  canceledAt?: string;
  cancelReason?: string;
}

export interface InvoiceFormData {
  customerId: string;
  invoiceNumber?: string;
  description?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paymentMethod?: PaymentMethod | string;
  paymentLink?: string;
  notes?: string;
}

export interface InvoicePayment {
  id: string;
  accountId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoicePaymentFormData {
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export type PaymentPromiseStatus = 'pending' | 'kept' | 'broken' | 'canceled';

export interface PaymentPromise {
  id: string;
  accountId: string;
  invoiceId: string;
  customerId: string;
  promisedDate: string; // YYYY-MM-DD
  amount: number;
  status: PaymentPromiseStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentPromiseFormData {
  promisedDate: string;
  amount: number;
  notes?: string;
}

export interface InvoiceMetrics {
  totalReceivable: number; // total em aberto + em atraso
  pendingAmount: number; // dentro do prazo (pending + partially_paid)
  overdueAmount: number; // vencidas com saldo > 0
  paidAmount: number; // total pago
  totalInvoicesCount: number;
  overdueInvoicesCount: number;
  pendingInvoicesCount: number;
  paidInvoicesCount: number;
  activePromisesCount: number;
}

export type MessageChannel = 'whatsapp' | 'sms' | 'email' | 'in_person';

export type MessageTone = 'cordial' | 'professional' | 'direct' | 'formal' | 'friendly';

export type MessageCategory =
  | 'before_due'
  | 'due_date'
  | 'overdue_first'
  | 'cordial_reminder'
  | 'professional_collection'
  | 'direct_collection'
  | 'high_value'
  | 'no_response'
  | 'after_promise'
  | 'promise_reminder'
  | 'broken_promise'
  | 'last_friendly'
  | 'payment_confirmation'
  | 'payment_proof_request'
  | 'friend_acquaintance'
  | 'company_client'
  | 'individual_client'
  | 'follow_up'
  | 'custom';

export type MessageIntent =
  | 'remind'
  | 'request_payment'
  | 'request_forecast'
  | 'confirm_promise'
  | 'recover_response'
  | 'confirm_receipt';

export type MessageStatus =
  | 'draft'
  | 'generated'
  | 'copied'
  | 'prepared'
  | 'sent_manually'
  | 'archived';

export interface InPersonStep {
  step: number;
  title: string;
  dialogue: string;
  tip?: string;
}

export interface MessageTemplate {
  id: string;
  accountId: string;
  title: string;
  category: MessageCategory;
  channel: MessageChannel;
  tone: MessageTone;
  intent: MessageIntent;
  subject?: string;
  content: string;
  isDefault: boolean;
  isCustom?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GeneratedMessage {
  id: string;
  accountId: string;
  customerId: string;
  invoiceId?: string;
  templateId?: string;
  channel: MessageChannel;
  category: MessageCategory;
  tone: MessageTone;
  intent: MessageIntent;
  subject?: string;
  body: string;
  inPersonSteps?: InPersonStep[];
  status: MessageStatus;
  sentManuallyAt?: string;
  copiedAt?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface AccountSignature {
  enabled: boolean;
  name: string;
  companyName: string;
  role?: string;
  phone?: string;
  email?: string;
  customText?: string;
}

export interface Reminder {
  id: string;
  accountId: string;
  invoiceId: string;
  scheduledDate: string;
  channel: 'email' | 'whatsapp' | 'sms' | 'system';
  status: 'scheduled' | 'sent' | 'failed' | 'canceled';
  createdAt: string;
}

export type NotificationCategory =
  | 'all'
  | 'billing'
  | 'payment'
  | 'promise'
  | 'automation'
  | 'system'
  | 'account'
  | 'plan';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SystemNotification {
  id: string;
  accountId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: NotificationCategory;
  priority?: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  entityType?: 'invoice' | 'customer' | 'promise' | 'automation' | 'plan' | 'settings';
  entityId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ActivityLog {
  id: string;
  accountId: string;
  userId: string;
  action: string;
  entityType: 'customer' | 'invoice' | 'payment' | 'message' | 'plan' | 'settings';
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  accountId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'failed';
  attempts: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  userId: string;
  role: AdminRole;
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetAccount?: string;
  ipAddress?: string;
  timestamp: string;
  details: string;
}
