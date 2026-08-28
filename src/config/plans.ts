import { PlanType } from '../types/database';

export type FeatureKey =
  | 'feature.customer_management'
  | 'feature.invoice_management'
  | 'feature.message_generator_basic'
  | 'feature.message_generator_advanced'
  | 'feature.payment_promises'
  | 'feature.custom_templates'
  | 'feature.whatsapp_integration'
  | 'feature.automated_reminders'
  | 'feature.advanced_reports'
  | 'feature.multi_user'
  | 'feature.audit_logs'
  | 'feature.priority_support';

export interface PlanConfig {
  id: PlanType;
  name: string;
  badge?: string;
  priceMonthly: number;
  currency: string;
  description: string;
  idealFor: string;
  features: {
    key: FeatureKey;
    label: string;
    description: string;
  }[];
  limits: {
    maxCustomers: number | 'unlimited';
    maxInvoicesPerMonth: number | 'unlimited';
    maxMessageGenerationsPerMonth: number | 'unlimited';
    customTemplates: number | 'unlimited';
  };
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'FREE',
    priceMonthly: 0,
    currency: '€',
    description: 'Essencial para quem está a começar a organizar cobranças e pagamentos.',
    idealFor: 'Profissionais independentes e pequenos prestadores que querem dar os primeiros passos com tranquilidade.',
    limits: {
      maxCustomers: 10,
      maxInvoicesPerMonth: 10,
      maxMessageGenerationsPerMonth: 10,
      customTemplates: 2,
    },
    features: [
      {
        key: 'feature.customer_management',
        label: 'Gestão básica de clientes',
        description: 'Organize contactos e histórico básico de pagamentos.',
      },
      {
        key: 'feature.invoice_management',
        label: 'Registo de cobranças',
        description: 'Acompanhe faturas emitidas e valores pendentes.',
      },
      {
        key: 'feature.message_generator_basic',
        label: 'Mensagens cordiais de cobrança',
        description: 'Gere mensagens respeitosas e adequadas para solicitar pagamentos.',
      },
    ],
  },
  plus: {
    id: 'plus',
    name: 'PLUS',
    badge: 'Mais Popular',
    priceMonthly: 5.9,
    currency: '€',
    description: 'Para negócios que cobram regularmente e precisam de consistência e modelos personalizados.',
    idealFor: 'Prestadores de serviços, pequenos negócios e consultores em crescimento.',
    limits: {
      maxCustomers: 150,
      maxInvoicesPerMonth: 100,
      maxMessageGenerationsPerMonth: 150,
      customTemplates: 15,
    },
    // Modelo cumulativo: inclui tudo do FREE + novidades do PLUS
    features: [
      {
        key: 'feature.customer_management',
        label: 'Tudo incluído no plano FREE',
        description: 'Acesso completo a todas as ferramentas essenciais sem restrições base.',
      },
      {
        key: 'feature.custom_templates',
        label: 'Modelos de mensagens personalizados',
        description: 'Crie e guarde os seus próprios textos e abordagens por tipo de cliente.',
      },
      {
        key: 'feature.payment_promises',
        label: 'Registo e controlo de promessas de pagamento',
        description: 'Acompanhe prazos combinados sem perder o fio à meada.',
      },
      {
        key: 'feature.whatsapp_integration',
        label: 'Envio rápido via WhatsApp e Email',
        description: 'Partilhe mensagens formatadas num clique diretamente para os canais habituais.',
      },
      {
        key: 'feature.message_generator_advanced',
        label: 'Tom de comunicação adaptativo',
        description: 'Ajuste o tom entre cordial, direto, formal e firme de acordo com a situação.',
      },
    ],
  },
  pro: {
    id: 'pro',
    name: 'PRO',
    badge: 'Completo',
    priceMonthly: 11.9,
    currency: '€',
    description: 'O controlo total para empresas e agências com automações, relatórios avançados e equipa.',
    idealFor: 'Empresas, agências e negócios que não abrem mão de automação e máxima eficiência.',
    limits: {
      maxCustomers: 'unlimited',
      maxInvoicesPerMonth: 'unlimited',
      maxMessageGenerationsPerMonth: 'unlimited',
      customTemplates: 'unlimited',
    },
    // Modelo cumulativo: inclui tudo do PLUS (que já inclui o FREE) + exclusividades PRO
    features: [
      {
        key: 'feature.customer_management',
        label: 'Tudo incluído no plano PLUS',
        description: 'Beneficie de todas as funcionalidades dos planos Free e Plus sem limites de registo.',
      },
      {
        key: 'feature.automated_reminders',
        label: 'Lembretes automáticos inteligentes',
        description: 'Agende avisos preventivos e de vencimento sem necessidade de intervenção manual.',
      },
      {
        key: 'feature.advanced_reports',
        label: 'Relatórios avançados e previsão de tesouraria',
        description: 'Analise o tempo médio de recebimento, taxas de cumprimento e histórico de atrasos.',
      },
      {
        key: 'feature.multi_user',
        label: 'Acesso multi-utilizador para equipas',
        description: 'Adicione membros da sua equipa com permissões específicas por função.',
      },
      {
        key: 'feature.priority_support',
        label: 'Suporte prioritário dedicado',
        description: 'Atendimento preferencial com tempo de resposta garantido.',
      },
    ],
  },
};

/**
 * Matriz hierárquica de permissões para verificação rápida
 */
export const PLAN_FEATURE_ACCESS: Record<PlanType, FeatureKey[]> = {
  free: [
    'feature.customer_management',
    'feature.invoice_management',
    'feature.message_generator_basic',
  ],
  plus: [
    'feature.customer_management',
    'feature.invoice_management',
    'feature.message_generator_basic',
    'feature.message_generator_advanced',
    'feature.custom_templates',
    'feature.payment_promises',
    'feature.whatsapp_integration',
  ],
  pro: [
    'feature.customer_management',
    'feature.invoice_management',
    'feature.message_generator_basic',
    'feature.message_generator_advanced',
    'feature.custom_templates',
    'feature.payment_promises',
    'feature.whatsapp_integration',
    'feature.automated_reminders',
    'feature.advanced_reports',
    'feature.multi_user',
    'feature.audit_logs',
    'feature.priority_support',
  ],
};
