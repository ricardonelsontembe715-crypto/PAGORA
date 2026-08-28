import { MessageTone, MessageChannel, PaymentMethod } from './database';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roleTitle?: string;
  language: 'pt-PT';
  timezone: string; // Ex: 'Europe/Lisbon'
  lastLoginAt?: string;
}

export interface CompanyIdentityData {
  id: string;
  name: string;
  commercialName?: string;
  taxId?: string; // NIF
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  website?: string;
  logoUrl?: string;
  currency: string;
  timezone: string;
}

export interface BillingSettingsData {
  defaultCurrency: string;
  invoicePrefix: string;
  defaultDueDays: number;
  preferredPaymentMethod: PaymentMethod;
  overdueGracePeriodDays: number;
  autoFlagOverdue: boolean;
  brokenPromiseThresholdDays: number;
}

export interface MessageSettingsData {
  defaultTone: MessageTone;
  defaultChannel: MessageChannel;
  includeReference: boolean;
  includeAmount: boolean;
  includeDueDate: boolean;
  includeTotalDebt: boolean;
  includePaymentLink: boolean;
  includeBankDetails: boolean;
  customPaymentDetails?: string;
}

export interface AutomationSettingsData {
  globalEnabled: boolean;
  preferredRunHour: number; // 0-23
  businessDaysOnly: boolean;
  defaultReminderPriority: 'low' | 'medium' | 'high' | 'urgent';
  autoResolveOnPayment: boolean;
}

export interface NotificationPreferencesData {
  notifyOverdueInvoices: boolean;
  notifyInvoiceDueToday: boolean;
  notifyPaymentsReceived: boolean;
  notifyPromisesDue: boolean;
  notifyBrokenPromises: boolean;
  notifyAutomationRan: boolean;
  notifyWeeklyReport: boolean;
  notifySecurityAlerts: boolean; // Sempre true por segurança
  notifyPlanChanges: boolean; // Sempre true por faturação
  emailDigest: boolean;
}

export interface UserSessionRecord {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}
