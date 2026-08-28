/**
 * PAGORA — Centralized Checkout Configuration (Part 27)
 *
 * Gerencia a configuração centralizada dos links de checkout externos (Plus e Pro).
 * Não inventa URLs fictícios nem simula pagamentos automaticamente.
 * Quando configurados, preserva o contexto da conta (accountId, email) para correlação no Webhook.
 */

export interface CheckoutConfig {
  plusCheckoutUrl: string;
  proCheckoutUrl: string;
}

export const CHECKOUT_CONFIG: CheckoutConfig = {
  // URLs configuráveis via variáveis de ambiente públicas da aplicação
  plusCheckoutUrl: (((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PLUS_CHECKOUT_URL) || '').trim(),
  proCheckoutUrl: (((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PRO_CHECKOUT_URL) || '').trim(),
};

/**
 * Verifica se o link de checkout para um determinado plano está configurado
 */
export function isCheckoutConfigured(plan: 'plus' | 'pro'): boolean {
  if (plan === 'plus') {
    return Boolean(CHECKOUT_CONFIG.plusCheckoutUrl && CHECKOUT_CONFIG.plusCheckoutUrl.startsWith('http'));
  }
  if (plan === 'pro') {
    return Boolean(CHECKOUT_CONFIG.proCheckoutUrl && CHECKOUT_CONFIG.proCheckoutUrl.startsWith('http'));
  }
  return false;
}

/**
 * Constrói o URL de checkout seguro com metadados da conta para conciliação no Webhook
 */
export function buildCheckoutUrl(
  plan: 'plus' | 'pro',
  options?: {
    accountId?: string;
    customerEmail?: string;
    workspaceName?: string;
  }
): string | null {
  const baseUrl = plan === 'plus' ? CHECKOUT_CONFIG.plusCheckoutUrl : CHECKOUT_CONFIG.proCheckoutUrl;

  if (!baseUrl || !baseUrl.startsWith('http')) {
    return null;
  }

  try {
    const url = new URL(baseUrl);
    if (options?.accountId) {
      url.searchParams.set('client_reference_id', options.accountId);
      url.searchParams.set('account_id', options.accountId);
    }
    if (options?.customerEmail) {
      url.searchParams.set('customer_email', options.customerEmail);
      url.searchParams.set('email', options.customerEmail);
    }
    if (options?.workspaceName) {
      url.searchParams.set('workspace', options.workspaceName);
    }
    url.searchParams.set('plan', plan);
    return url.toString();
  } catch {
    // Se o URL base for relativo ou especial
    return baseUrl;
  }
}
