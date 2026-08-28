import { Account, PlanType } from '../types/database';
import { FeatureKey, PLAN_FEATURE_ACCESS, PLANS, PlanConfig } from '../config/plans';
import { DetailedSubscription, PlanUsageMetrics, SubscriptionStatus } from '../types/billing';

export const planLimits = {
  free: PLANS.free.limits,
  plus: PLANS.plus.limits,
  pro: PLANS.pro.limits,
};

export const featurePermissions = PLAN_FEATURE_ACCESS;

/**
 * Retorna a configuração completa do plano de uma conta
 */
export function getPlan(account: Account | null | undefined): PlanConfig {
  const plan = account?.plan || 'free';
  return PLANS[plan] || PLANS.free;
}

/**
 * Retorna os limites numéricos do plano especificado
 */
export function getPlanLimits(plan: PlanType) {
  return PLANS[plan]?.limits || PLANS.free.limits;
}

/**
 * Verifica se uma conta tem acesso a uma funcionalidade específica
 * Baseado no modelo cumulativo de planos (FREE -> PLUS -> PRO)
 * Uma conta PRO tem acesso a todas as funcionalidades FREE e PLUS
 */
export function hasFeature(account: Account | null | undefined, featureKey: FeatureKey): boolean {
  if (!account) return false;
  const plan = account.plan || 'free';
  const allowedFeatures = PLAN_FEATURE_ACCESS[plan] || [];
  return allowedFeatures.includes(featureKey);
}

/**
 * Verifica se a conta ainda tem quota disponível para criar um novo recurso
 */
export function hasQuota(
  account: Account | null | undefined,
  resource: 'customers' | 'invoices' | 'messages' | 'templates',
  currentCount: number
): boolean {
  if (!account) return false;
  const plan = account.plan || 'free';
  const limits = PLANS[plan]?.limits;
  if (!limits) return false;

  switch (resource) {
    case 'customers':
      if (limits.maxCustomers === 'unlimited') return true;
      return currentCount < limits.maxCustomers;

    case 'invoices':
      if (limits.maxInvoicesPerMonth === 'unlimited') return true;
      return currentCount < limits.maxInvoicesPerMonth;

    case 'messages':
      if (limits.maxMessageGenerationsPerMonth === 'unlimited') return true;
      return currentCount < limits.maxMessageGenerationsPerMonth;

    case 'templates':
      if (limits.customTemplates === 'unlimited') return true;
      return currentCount < limits.customTemplates;

    default:
      return true;
  }
}

/**
 * Calcula as métricas de utilização e percentagens contra os limites do plano
 */
export function getPlanUsage(
  account: Account | null | undefined,
  counts: {
    customersCount: number;
    invoicesThisMonth: number;
    messagesGeneratedThisMonth: number;
    customTemplatesCount: number;
  }
): PlanUsageMetrics {
  const plan = account?.plan || 'free';
  const limits = PLANS[plan]?.limits || PLANS.free.limits;

  const calcPercent = (val: number, max: number | 'unlimited') => {
    if (max === 'unlimited' || max <= 0) return 0;
    return Math.min(100, Math.round((val / max) * 100));
  };

  return {
    customersCount: counts.customersCount,
    maxCustomers: limits.maxCustomers,
    customersUsagePercent: calcPercent(counts.customersCount, limits.maxCustomers),

    invoicesThisMonth: counts.invoicesThisMonth,
    maxInvoicesPerMonth: limits.maxInvoicesPerMonth,
    invoicesUsagePercent: calcPercent(counts.invoicesThisMonth, limits.maxInvoicesPerMonth),

    messagesGeneratedThisMonth: counts.messagesGeneratedThisMonth,
    maxMessagesPerMonth: limits.maxMessageGenerationsPerMonth,
    messagesUsagePercent: calcPercent(counts.messagesGeneratedThisMonth, limits.maxMessageGenerationsPerMonth),

    customTemplatesCount: counts.customTemplatesCount,
    maxCustomTemplates: limits.customTemplates,
    templatesUsagePercent: calcPercent(counts.customTemplatesCount, limits.customTemplates),
  };
}

/**
 * Retorna o plano mínimo necessário para desbloquear uma dada funcionalidade
 */
export function getRequiredPlanForFeature(featureKey: FeatureKey): PlanType {
  if (PLAN_FEATURE_ACCESS.free.includes(featureKey)) return 'free';
  if (PLAN_FEATURE_ACCESS.plus.includes(featureKey)) return 'plus';
  return 'pro';
}

/**
 * Verifica se uma subscrição está ativa para concessão de permissões pagas
 */
export function isSubscriptionActive(
  subscription: DetailedSubscription | { status: SubscriptionStatus } | null | undefined
): boolean {
  if (!subscription) return false;
  return subscription.status === 'active' || subscription.status === 'trial';
}

/**
 * Validação de permissões de administrador no backend/serviço
 */
export function isSuperAdmin(role?: string): boolean {
  return role === 'superadmin';
}

