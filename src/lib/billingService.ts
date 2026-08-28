import { PlanType, Account } from '../types/database';
import {
  DetailedSubscription,
  BillingTransaction,
  SubscriptionStatus,
  PaymentTransactionStatus,
  PaymentTimelineStep,
  WebhookEventRecord,
  ExternalPaymentConfig,
} from '../types/billing';
import { PLANS } from '../config/plans';
import { storage } from './storage';

export const INITIAL_EXTERNAL_CONFIG: ExternalPaymentConfig = {
  webhookSecret: 'pagora_whsec_prod_9941a82fbc',
  plusProductId: 'prod_pagora_plus_eur',
  proProductId: 'prod_pagora_pro_eur',
  currency: 'EUR',
  environment: 'sandbox',
  paymentPlatform: 'Stripe / Multibanco / MB WAY API',
  isConfigured: false,
};

export const INITIAL_SUBSCRIPTION: DetailedSubscription = {
  id: 'sub_pt_01',
  accountId: 'acc_pt_01',
  accountName: 'Estúdio Design & Consultoria',
  userId: 'usr_default_01',
  userName: 'Ricardo Tembe',
  userEmail: 'ricardo@pagora.pt',
  plan: 'plus',
  status: 'active',
  priceMonthly: 5.9,
  currency: 'EUR',
  currentPeriodStart: '2026-08-01T00:00:00.000Z',
  currentPeriodEnd: '2026-09-01T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  origin: 'Plataforma de Pagamentos (MB WAY)',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  lastPaymentDate: '2026-08-01T09:30:00.000Z',
  lastPaymentStatus: 'paid',
  lastPaymentAmount: 5.9,
  externalCustomerId: 'cus_pagora_demo_882',
  externalSubscriptionId: 'sub_ext_99412',
  externalPaymentId: 'pay_99481283',
};

export const INITIAL_BILLING_TRANSACTIONS: BillingTransaction[] = [
  {
    id: 'tx_01',
    accountId: 'acc_pt_01',
    accountName: 'Estúdio Design & Consultoria',
    userId: 'usr_default_01',
    userName: 'Ricardo Tembe',
    userEmail: 'ricardo@pagora.pt',
    plan: 'plus',
    amount: 5.9,
    currency: 'EUR',
    status: 'paid',
    invoiceNumber: 'FT PAG-2026/001',
    description: 'Subscrição Mensal — Plano PLUS (PAGORA)',
    externalReference: 'MBWAY-912345678-01',
    externalPaymentId: 'pay_99481283',
    paymentMethod: 'MB WAY',
    origin: 'Webhook Checkout',
    paidAt: '2026-08-01T09:30:00.000Z',
    createdAt: '2026-08-01T09:28:00.000Z',
    receiptUrl: '#',
    timeline: [
      {
        stage: 'initiated',
        label: 'Pagamento iniciado',
        timestamp: '2026-08-01T09:28:00.000Z',
        status: 'completed',
        description: 'Pedido de subscrição do Plano PLUS registado na PAGORA.',
        detail: 'Referência de pagamento criada via MB WAY (+351 912 345 678).',
      },
      {
        stage: 'pending',
        label: 'Pagamento pendente',
        timestamp: '2026-08-01T09:28:15.000Z',
        status: 'completed',
        description: 'Aguardando autorização e confirmação na app bancária do utilizador.',
      },
      {
        stage: 'approved',
        label: 'Pagamento aprovado',
        timestamp: '2026-08-01T09:30:00.000Z',
        status: 'completed',
        description: 'Notificação recebida com sucesso da entidade financeira.',
        detail: 'Identificador externo: pay_99481283 • Montante: 5,90 €',
      },
      {
        stage: 'plan_activated',
        label: 'Plano PLUS ativado',
        timestamp: '2026-08-01T09:30:02.000Z',
        status: 'completed',
        description: 'Funcionalidades do plano PLUS desbloqueadas de imediato.',
        detail: 'Modelos personalizados, promessas e limites superiores ativos.',
      },
    ],
  },
];

export class BillingService {
  /**
   * Gera a linha temporal completa de um pagamento
   */
  static generatePaymentTimeline(
    status: PaymentTransactionStatus,
    plan: PlanType,
    dates: { createdAt: string; paidAt?: string; externalPaymentId?: string; paymentMethod?: string }
  ): PaymentTimelineStep[] {
    const planName = PLANS[plan]?.name || plan.toUpperCase();
    const created = dates.createdAt || new Date().toISOString();
    const paid = dates.paidAt || created;

    const steps: PaymentTimelineStep[] = [
      {
        stage: 'initiated',
        label: 'Pagamento iniciado',
        timestamp: created,
        status: 'completed',
        description: `Subscrição do plano ${planName} iniciada na plataforma.`,
        detail: dates.paymentMethod ? `Método selecionado: ${dates.paymentMethod}` : undefined,
      },
    ];

    if (status === 'pending') {
      steps.push({
        stage: 'pending',
        label: 'Pagamento pendente',
        timestamp: new Date(new Date(created).getTime() + 5000).toISOString(),
        status: 'current',
        description: 'Aguardando confirmação do gateway de pagamento ou emissão do recibo.',
      });
      return steps;
    }

    if (status === 'paid') {
      steps.push({
        stage: 'pending',
        label: 'Pagamento processado',
        timestamp: new Date(new Date(created).getTime() + 10000).toISOString(),
        status: 'completed',
        description: 'Comunicação validada com o gateway bancário.',
      });
      steps.push({
        stage: 'approved',
        label: 'Pagamento aprovado',
        timestamp: paid,
        status: 'completed',
        description: 'Transação confirmada e validada com sucesso.',
        detail: dates.externalPaymentId ? `ID Externo: ${dates.externalPaymentId}` : undefined,
      });
      steps.push({
        stage: 'plan_activated',
        label: `Plano ${planName} ativado`,
        timestamp: new Date(new Date(paid).getTime() + 2000).toISOString(),
        status: 'completed',
        description: `Acesso total às capacidades do Plano ${planName} concedido.`,
      });
      return steps;
    }

    if (status === 'declined' || status === 'failed') {
      steps.push({
        stage: 'pending',
        label: 'Tentativa de débito',
        timestamp: new Date(new Date(created).getTime() + 10000).toISOString(),
        status: 'completed',
        description: 'Tentativa de cobrança enviada à instituição de crédito.',
      });
      steps.push({
        stage: 'declined',
        label: 'Pagamento recusado',
        timestamp: paid,
        status: 'failed',
        description: 'O pagamento não foi autorizado pelo emissor ou os fundos eram insuficientes.',
        detail: 'O plano ativo da conta não sofreu qualquer alteração.',
      });
      return steps;
    }

    if (status === 'refunded') {
      steps.push({
        stage: 'approved',
        label: 'Pagamento original aprovado',
        timestamp: created,
        status: 'completed',
        description: 'Pagamento inicial efetuado com sucesso.',
      });
      steps.push({
        stage: 'refunded',
        label: 'Reembolso processado',
        timestamp: paid,
        status: 'failed',
        description: 'Montante estornado. Subscrição revogada mantendo todos os dados históricos salvaguardados.',
      });
      return steps;
    }

    if (status === 'cancelled') {
      steps.push({
        stage: 'cancelled',
        label: 'Subscrição cancelada',
        timestamp: paid,
        status: 'failed',
        description: 'Subscrição terminada. Nenhum dado histórico foi eliminado.',
      });
      return steps;
    }

    return steps;
  }

  /**
   * Obtém a subscrição detalhada de uma conta
   */
  static getSubscription(accountId: string, planFallback: PlanType = 'free'): DetailedSubscription {
    const defaultSub: DetailedSubscription = {
      id: `sub_${accountId}`,
      accountId,
      accountName: accountId === 'acc_pt_01' ? 'Estúdio Design & Consultoria' : 'Espaço de Trabalho',
      plan: planFallback,
      status: 'active',
      priceMonthly: PLANS[planFallback].priceMonthly,
      currency: 'EUR',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      origin: 'Plataforma PAGORA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return storage.getTenantData<DetailedSubscription>(
      accountId,
      'detailed_subscription',
      accountId === 'acc_pt_01' ? INITIAL_SUBSCRIPTION : defaultSub
    );
  }

  /**
   * Guarda a subscrição da conta
   */
  static saveSubscription(accountId: string, subscription: DetailedSubscription): void {
    storage.setTenantData(accountId, 'detailed_subscription', subscription);
  }

  /**
   * Obtém as transações de faturação da conta
   */
  static getBillingHistory(accountId: string): BillingTransaction[] {
    return storage.getTenantData<BillingTransaction[]>(
      accountId,
      'billing_history',
      accountId === 'acc_pt_01' ? INITIAL_BILLING_TRANSACTIONS : []
    );
  }

  /**
   * Guarda as transações de faturação
   */
  static saveBillingHistory(accountId: string, history: BillingTransaction[]): void {
    storage.setTenantData(accountId, 'billing_history', history);
  }

  /**
   * Regista uma nova transação de faturação no histórico
   */
  static addTransaction(
    accountId: string,
    tx: Omit<BillingTransaction, 'id' | 'accountId' | 'createdAt'>
  ): BillingTransaction {
    const current = this.getBillingHistory(accountId);
    const createdAt = new Date().toISOString();
    const timeline =
      tx.timeline ||
      this.generatePaymentTimeline(tx.status, tx.plan, {
        createdAt,
        paidAt: tx.paidAt || createdAt,
        externalPaymentId: tx.externalPaymentId,
        paymentMethod: tx.paymentMethod,
      });

    const newTx: BillingTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      accountId,
      createdAt,
      timeline,
    };
    const updated = [newTx, ...current];
    this.saveBillingHistory(accountId, updated);
    return newTx;
  }

  /**
   * Executa a transição de plano (Upgrade, Downgrade, Ativação)
   * NUNCA apaga dados de clientes, faturas ou relatórios
   */
  static transitionPlan(
    account: Account,
    newPlan: PlanType,
    status: SubscriptionStatus = 'active',
    metadata?: {
      externalPaymentId?: string;
      externalSubscriptionId?: string;
      externalCustomerId?: string;
      paymentMethod?: string;
      amount?: number;
      userName?: string;
      userEmail?: string;
      origin?: string;
    }
  ): { updatedAccount: Account; updatedSubscription: DetailedSubscription } {
    const currentSub = this.getSubscription(account.id, account.plan);
    const planConfig = PLANS[newPlan];
    const now = new Date().toISOString();

    const updatedSubscription: DetailedSubscription = {
      ...currentSub,
      accountName: account.name,
      userName: metadata?.userName || currentSub.userName,
      userEmail: metadata?.userEmail || currentSub.userEmail,
      plan: newPlan,
      status,
      priceMonthly: planConfig.priceMonthly,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      canceledAt: undefined,
      cancelReason: undefined,
      externalPaymentId: metadata?.externalPaymentId || currentSub.externalPaymentId,
      externalSubscriptionId: metadata?.externalSubscriptionId || currentSub.externalSubscriptionId,
      externalCustomerId: metadata?.externalCustomerId || currentSub.externalCustomerId,
      origin: metadata?.origin || currentSub.origin || 'Checkout Online',
      lastPaymentDate: status === 'active' ? now : currentSub.lastPaymentDate,
      lastPaymentStatus: status === 'active' ? 'paid' : currentSub.lastPaymentStatus,
      lastPaymentAmount: metadata?.amount || planConfig.priceMonthly,
      updatedAt: now,
    };

    this.saveSubscription(account.id, updatedSubscription);

    if (status === 'active' && planConfig.priceMonthly > 0) {
      this.addTransaction(account.id, {
        accountName: account.name,
        userName: metadata?.userName || currentSub.userName,
        userEmail: metadata?.userEmail || currentSub.userEmail,
        plan: newPlan,
        amount: metadata?.amount || planConfig.priceMonthly,
        currency: 'EUR',
        status: 'paid',
        invoiceNumber: `FT PAG-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        description: `Subscrição Mensal — Plano ${planConfig.name} (PAGORA)`,
        externalPaymentId: metadata?.externalPaymentId,
        paymentMethod: metadata?.paymentMethod || 'Cartão / MB WAY',
        origin: metadata?.origin || 'Checkout Pagora',
        paidAt: now,
        receiptUrl: '#',
      });
    }

    const updatedAccount: Account = {
      ...account,
      plan: newPlan,
      updatedAt: now,
    };

    return { updatedAccount, updatedSubscription };
  }

  /**
   * Cancelamento seguro de subscrição
   * Mantém acesso até ao fim do período quando cancelAtPeriodEnd for true, ou revoga para FREE
   */
  static cancelSubscription(
    account: Account,
    reason: string = 'Cancelamento solicitado pelo utilizador',
    immediate: boolean = false
  ): { updatedAccount: Account; updatedSubscription: DetailedSubscription } {
    const currentSub = this.getSubscription(account.id, account.plan);
    const now = new Date().toISOString();

    if (immediate) {
      // Revogação imediata para FREE preservando todos os dados
      const updatedSubscription: DetailedSubscription = {
        ...currentSub,
        plan: 'free',
        status: 'cancelled',
        priceMonthly: 0,
        cancelAtPeriodEnd: false,
        canceledAt: now,
        cancelReason: reason,
        updatedAt: now,
      };
      this.saveSubscription(account.id, updatedSubscription);

      const updatedAccount: Account = {
        ...account,
        plan: 'free',
        updatedAt: now,
      };

      return { updatedAccount, updatedSubscription };
    }

    // Cancelamento agendado para o final do período faturado
    const updatedSubscription: DetailedSubscription = {
      ...currentSub,
      cancelAtPeriodEnd: true,
      canceledAt: now,
      cancelReason: reason,
      updatedAt: now,
    };
    this.saveSubscription(account.id, updatedSubscription);

    return { updatedAccount: account, updatedSubscription };
  }

  /**
   * Processador Determinístico de Eventos de Webhook (com idempotência estrita)
   */
  static processWebhookEvent(
    event: WebhookEventRecord,
    findAccountFn: (identifier: string) => Account | undefined
  ): {
    success: boolean;
    status: 'processed' | 'already_processed' | 'requires_review' | 'failed';
    message: string;
    account?: Account;
  } {
    // 1. Verificação de idempotência no histórico global
    const eventLogs = this.getWebhookLogs();
    const existing = eventLogs.find((l) => l.eventId === event.eventId && l.status === 'processed');
    if (existing) {
      return {
        success: true,
        status: 'already_processed',
        message: `O evento [${event.eventId}] já foi processado anteriormente. Efeitos não duplicados (Idempotência garantida).`,
      };
    }

    // 2. Identificação da conta Pagora
    const accountIdentifier =
      event.accountId ||
      (event.payload.metadata as Record<string, string>)?.account_id ||
      (event.payload.customer_email as string) ||
      (event.payload.email as string);

    if (!accountIdentifier) {
      this.logWebhookEvent({
        ...event,
        status: 'requires_review',
        errorMessage: 'Não foi possível identificar a conta Pagora associada ao evento externo.',
      });
      return {
        success: false,
        status: 'requires_review',
        message: 'Evento sem identificador de conta Pagora. Enviado para revisão administrativa.',
      };
    }

    const targetAccount = findAccountFn(accountIdentifier);
    if (!targetAccount) {
      this.logWebhookEvent({
        ...event,
        status: 'requires_review',
        errorMessage: `Nenhuma conta encontrada com o identificador "${accountIdentifier}".`,
      });
      return {
        success: false,
        status: 'requires_review',
        message: `Conta [${accountIdentifier}] não localizada. Requer revisão manual.`,
      };
    }

    // 3. Validação do tipo de evento e plano
    const eventType = event.eventType.toLowerCase();
    const planRequested: PlanType =
      event.planId ||
      ((event.payload.plan_id as string) === 'pro' ||
      (event.payload.product_name as string)?.toLowerCase().includes('pro')
        ? 'pro'
        : 'plus');

    try {
      if (
        eventType === 'payment.approved' ||
        eventType === 'payment.paid' ||
        eventType === 'subscription.created' ||
        eventType === 'subscription.renewed'
      ) {
        const { updatedAccount } = this.transitionPlan(targetAccount, planRequested, 'active', {
          externalPaymentId: (event.payload.payment_id as string) || event.eventId,
          externalSubscriptionId: event.externalSubscriptionId,
          externalCustomerId: event.externalCustomerId,
          amount: Number(event.payload.amount) || PLANS[planRequested].priceMonthly,
          paymentMethod: (event.payload.payment_method as string) || 'Webhook Pagamento',
          origin: `Webhook ${eventType}`,
        });

        this.logWebhookEvent({
          ...event,
          status: 'processed',
          processedAt: new Date().toISOString(),
          accountId: targetAccount.id,
          planId: planRequested,
        });

        return {
          success: true,
          status: 'processed',
          message: `Plano ${planRequested.toUpperCase()} ativado com sucesso para a conta ${targetAccount.name}.`,
          account: updatedAccount,
        };
      }

      if (eventType === 'payment.pending') {
        const sub = this.getSubscription(targetAccount.id, targetAccount.plan);
        this.saveSubscription(targetAccount.id, {
          ...sub,
          status: 'pending',
          updatedAt: new Date().toISOString(),
        });

        this.logWebhookEvent({
          ...event,
          status: 'processed',
          processedAt: new Date().toISOString(),
          accountId: targetAccount.id,
        });

        return {
          success: true,
          status: 'processed',
          message: 'Estado de pagamento pendente registado. Acesso pago aguarda confirmação final.',
          account: targetAccount,
        };
      }

      if (
        eventType === 'payment.failed' ||
        eventType === 'payment.declined' ||
        eventType === 'payment.cancelled'
      ) {
        const sub = this.getSubscription(targetAccount.id, targetAccount.plan);
        this.saveSubscription(targetAccount.id, {
          ...sub,
          status: 'payment_failed',
          updatedAt: new Date().toISOString(),
        });

        this.logWebhookEvent({
          ...event,
          status: 'processed',
          processedAt: new Date().toISOString(),
          accountId: targetAccount.id,
        });

        return {
          success: true,
          status: 'processed',
          message: 'Falha no pagamento registada. Acesso anterior mantido sem concessão nova.',
          account: targetAccount,
        };
      }

      if (eventType === 'payment.refunded' || eventType === 'refund.created') {
        // Reembolso revoga acesso para FREE preservando dados
        const { updatedAccount } = this.cancelSubscription(targetAccount, 'Reembolso confirmado', true);

        this.logWebhookEvent({
          ...event,
          status: 'processed',
          processedAt: new Date().toISOString(),
          accountId: targetAccount.id,
        });

        return {
          success: true,
          status: 'processed',
          message: 'Reembolso processado. Subscrição cancelada com preservação integral de dados.',
          account: updatedAccount,
        };
      }

      if (eventType === 'subscription.cancelled' || eventType === 'subscription.deleted') {
        const endOfPeriod = Boolean(event.payload.cancel_at_period_end);
        const { updatedAccount } = this.cancelSubscription(targetAccount, 'Cancelamento externo', !endOfPeriod);

        this.logWebhookEvent({
          ...event,
          status: 'processed',
          processedAt: new Date().toISOString(),
          accountId: targetAccount.id,
        });

        return {
          success: true,
          status: 'processed',
          message: endOfPeriod
            ? 'Cancelamento agendado para o fim do ciclo faturado.'
            : 'Subscrição revogada de imediato com dados preservados.',
          account: updatedAccount,
        };
      }

      // Tipo de evento desconhecido
      this.logWebhookEvent({
        ...event,
        status: 'requires_review',
        errorMessage: `Tipo de evento externo "${eventType}" não mapeado nas regras de negócio.`,
      });

      return {
        success: false,
        status: 'requires_review',
        message: `Evento [${eventType}] desconhecido. Guardado para revisão administrativa.`,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Erro interno ao processar webhook.';
      this.logWebhookEvent({
        ...event,
        status: 'failed',
        errorMessage: errMsg,
      });
      return {
        success: false,
        status: 'failed',
        message: errMsg,
      };
    }
  }

  /**
   * Registo e Histórico de Logs de Webhook (Audit & Admin)
   */
  static getWebhookLogs(): WebhookEventRecord[] {
    return storage.get<WebhookEventRecord[]>('pagora_webhook_logs', []);
  }

  static logWebhookEvent(record: WebhookEventRecord): void {
    const current = this.getWebhookLogs();
    const existingIndex = current.findIndex((l) => l.eventId === record.eventId);
    let updated: WebhookEventRecord[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = {
        ...record,
        processingAttempts: (current[existingIndex].processingAttempts || 1) + 1,
      };
    } else {
      updated = [record, ...current];
    }
    storage.set('pagora_webhook_logs', updated);
  }

  /**
   * Configurações de Pagamentos Externos
   */
  static getExternalConfig(): ExternalPaymentConfig {
    return storage.get<ExternalPaymentConfig>('pagora_payment_config', INITIAL_EXTERNAL_CONFIG);
  }

  static saveExternalConfig(config: ExternalPaymentConfig): void {
    storage.set('pagora_payment_config', config);
  }

  /**
   * Consulta agregada de todas as transações globais para a administração
   */
  static getAllGlobalTransactions(allAccounts: Account[]): BillingTransaction[] {
    const allTx: BillingTransaction[] = [];
    for (const acc of allAccounts) {
      const hist = this.getBillingHistory(acc.id);
      allTx.push(...hist);
    }
    return allTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Consulta agregada de todas as subscrições globais para a administração
   */
  static getAllGlobalSubscriptions(allAccounts: Account[]): DetailedSubscription[] {
    const allSubs: DetailedSubscription[] = [];
    for (const acc of allAccounts) {
      const sub = this.getSubscription(acc.id, acc.plan);
      allSubs.push(sub);
    }
    return allSubs;
  }
}

