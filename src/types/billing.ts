import { PlanType } from './database';

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'pending'
  | 'payment_failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'suspended'
  | 'requires_review';

export type PaymentTransactionStatus =
  | 'paid'
  | 'pending'
  | 'declined'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface PaymentTimelineStep {
  stage: 'initiated' | 'pending' | 'approved' | 'plan_activated' | 'declined' | 'cancelled' | 'refunded';
  label: string;
  timestamp: string;
  status: 'completed' | 'current' | 'failed' | 'pending';
  description: string;
  detail?: string;
}

export interface BillingTransaction {
  id: string;
  accountId: string;
  accountName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  plan: PlanType;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  invoiceNumber: string;
  description: string;
  externalReference?: string;
  externalPaymentId?: string;
  paymentMethod?: string;
  origin?: string;
  timeline?: PaymentTimelineStep[];
  paidAt?: string;
  createdAt: string;
  receiptUrl?: string;
}

export interface DetailedSubscription {
  id: string;
  accountId: string;
  accountName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  plan: PlanType;
  status: SubscriptionStatus;
  priceMonthly: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  cancelReason?: string;
  externalSubscriptionId?: string;
  externalCustomerId?: string;
  origin?: string;
  lastPaymentDate?: string;
  lastPaymentStatus?: PaymentTransactionStatus;
  lastPaymentAmount?: number;
  externalPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanUsageMetrics {
  customersCount: number;
  maxCustomers: number | 'unlimited';
  customersUsagePercent: number;
  
  invoicesThisMonth: number;
  maxInvoicesPerMonth: number | 'unlimited';
  invoicesUsagePercent: number;

  messagesGeneratedThisMonth: number;
  maxMessagesPerMonth: number | 'unlimited';
  messagesUsagePercent: number;

  customTemplatesCount: number;
  maxCustomTemplates: number | 'unlimited';
  templatesUsagePercent: number;
}

export type WebhookEventStatus = 'received' | 'processed' | 'failed' | 'requires_review';

export interface WebhookEventRecord {
  id: string;
  eventId: string;
  eventType: string;
  receivedAt: string;
  processedAt?: string;
  status: WebhookEventStatus;
  processingAttempts: number;
  errorMessage?: string;
  externalCustomerId?: string;
  externalOrderId?: string;
  externalSubscriptionId?: string;
  accountId?: string;
  planId?: PlanType;
  payloadHash?: string;
  payload: Record<string, unknown>;
}

export interface ExternalPaymentConfig {
  webhookSecret: string;
  plusProductId: string;
  proProductId: string;
  currency: string;
  environment: 'sandbox' | 'production';
  paymentPlatform: string;
  webhookEndpointUrl?: string;
  isConfigured: boolean;
  lastEventReceivedAt?: string;
}
