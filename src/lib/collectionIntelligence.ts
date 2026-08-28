import {
  Customer,
  Invoice,
  PaymentPromise,
  InvoicePayment,
  MessageTone,
  MessageChannel,
} from '../types/database';
import { formatCurrency, formatDate, getDaysOverdue } from './formatters';

// -------------------------------------------------------------
// 1. PERFIL DE COMPORTAMENTO DE PAGAMENTO (DETERMINÍSTICO E EXPLICÁVEL)
// -------------------------------------------------------------

export type PaymentBehaviorCategory =
  | 'ON_TIME'
  | 'OCCASIONALLY_LATE'
  | 'RECURRENT_LATE'
  | 'HIGH_RISK'
  | 'INSUFFICIENT_DATA';

export interface CustomerBehaviorProfile {
  category: PaymentBehaviorCategory;
  label: string;
  badgeVariant: 'success' | 'primary' | 'warning' | 'danger' | 'neutral';
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  metrics: {
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    onTimePaidCount: number;
    latePaidCount: number;
    averageLateDays: number;
    maxLateDays: number;
    totalInvoiced: number;
    totalPaid: number;
    totalOverdue: number;
    totalPending: number;
    brokenPromisesCount: number;
    keptPromisesCount: number;
  };
}

/**
 * Analisa o histórico real de transações do cliente e determina o perfil de comportamento.
 * Regras 100% determinísticas e auditáveis, sem inventar dados.
 */
export function analyzeCustomerBehaviorProfile(
  customer: Customer,
  customerInvoices: Invoice[],
  customerPromises: PaymentPromise[] = [],
  customerPayments: InvoicePayment[] = []
): CustomerBehaviorProfile {
  const activeInvoices = customerInvoices.filter((i) => i.status !== 'canceled' && i.status !== 'draft');
  const paidInvoices = activeInvoices.filter((i) => i.status === 'paid');
  const overdueInvoices = activeInvoices.filter((i) => i.status === 'overdue');
  const pendingInvoices = activeInvoices.filter((i) => i.status === 'pending' || i.status === 'partially_paid');

  const totalInvoiced = activeInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = activeInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  const totalPending = pendingInvoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

  const brokenPromises = customerPromises.filter((p) => p.status === 'broken');
  const keptPromises = customerPromises.filter((p) => p.status === 'kept');

  // Calcular atrasos em pagamentos concluídos
  let latePaidCount = 0;
  let onTimePaidCount = 0;
  let totalLateDays = 0;
  let maxLateDays = 0;

  paidInvoices.forEach((inv) => {
    // Buscar data de pagamento efetiva
    const invPayments = customerPayments.filter((p) => p.invoiceId === inv.id);
    let paymentDate = inv.updatedAt || inv.createdAt;
    if (invPayments.length > 0) {
      paymentDate = invPayments[invPayments.length - 1].paymentDate;
    }

    const payD = new Date(paymentDate);
    const dueD = new Date(inv.dueDate);
    const diffDays = Math.floor((payD.getTime() - dueD.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 2) {
      latePaidCount++;
      totalLateDays += diffDays;
      if (diffDays > maxLateDays) maxLateDays = diffDays;
    } else {
      onTimePaidCount++;
    }
  });

  // Adicionar atrasos das faturas atualmente em atraso
  overdueInvoices.forEach((inv) => {
    const days = getDaysOverdue(inv.dueDate);
    if (days > 0) {
      if (days > maxLateDays) maxLateDays = days;
    }
  });

  const totalEvaluatedTransactions = paidInvoices.length + overdueInvoices.length;
  const averageLateDays = latePaidCount > 0 ? Math.round(totalLateDays / latePaidCount) : 0;

  const metrics = {
    totalInvoices: activeInvoices.length,
    paidInvoices: paidInvoices.length,
    overdueInvoices: overdueInvoices.length,
    onTimePaidCount,
    latePaidCount,
    averageLateDays,
    maxLateDays,
    totalInvoiced,
    totalPaid,
    totalOverdue,
    totalPending,
    brokenPromisesCount: brokenPromises.length,
    keptPromisesCount: keptPromises.length,
  };

  // 1. Sem histórico suficiente (menos de 2 faturas registadas)
  if (totalEvaluatedTransactions < 2 && activeInvoices.length <= 1) {
    return {
      category: 'INSUFFICIENT_DATA',
      label: 'Sem Histórico Suficiente',
      badgeVariant: 'neutral',
      explanation: 'Existem poucos registos concluídos para traçar um padrão comportamental consistente deste cliente.',
      confidence: 'low',
      metrics,
    };
  }

  // 2. Alto Risco (promessas quebradas recorrentes, atrasos severos > 30 dias ou saldo vencido desproporcional)
  if (
    brokenPromises.length >= 2 ||
    (brokenPromises.length >= 1 && totalOverdue > 1000) ||
    maxLateDays > 30 ||
    (overdueInvoices.length >= 2 && totalOverdue > 2000)
  ) {
    const reasonParts: string[] = [];
    if (brokenPromises.length > 0) {
      reasonParts.push(`${brokenPromises.length} ${brokenPromises.length === 1 ? 'promessa de pagamento não cumprida' : 'promessas de pagamento não cumpridas'}`);
    }
    if (overdueInvoices.length > 0) {
      reasonParts.push(`${formatCurrency(totalOverdue)} atualmente em atraso`);
    }
    if (maxLateDays > 30) {
      reasonParts.push(`atrasos que atingiram ${maxLateDays} dias`);
    }

    return {
      category: 'HIGH_RISK',
      label: 'Alto Risco de Incumprimento',
      badgeVariant: 'danger',
      explanation: `Perfil de elevado risco devido a ${reasonParts.join(', ')}. Recomenda-se acompanhamento direto e obtenção de garantia de pagamento.`,
      confidence: 'high',
      metrics,
    };
  }

  // 3. Pagador Recorrente em Atraso (mais de metade das faturas pagas fora de prazo ou atraso continuado)
  if (
    (latePaidCount + overdueInvoices.length) / Math.max(1, totalEvaluatedTransactions) >= 0.5 ||
    overdueInvoices.length >= 2
  ) {
    return {
      category: 'RECURRENT_LATE',
      label: 'Pagador Recorrente em Atraso',
      badgeVariant: 'warning',
      explanation: `Apresenta padrão frequente de liquidação após o vencimento (atraso médio de ${averageLateDays || maxLateDays} dias). Convém emitir lembretes prévios e reforçar as datas acordadas.`,
      confidence: 'medium',
      metrics,
    };
  }

  // 4. Pagador Ocasionalmente Atrasado (pequenos atrasos pontuais)
  if (latePaidCount > 0 || overdueInvoices.length === 1) {
    return {
      category: 'OCCASIONALLY_LATE',
      label: 'Ocasionalmente Atrasado',
      badgeVariant: 'primary',
      explanation: 'Costuma honrar os compromissos, apresentando apenas atrasos pontuais e de curta duração.',
      confidence: 'medium',
      metrics,
    };
  }

  // 5. Pagador Pontual (sempre no prazo)
  return {
    category: 'ON_TIME',
    label: 'Pagador Pontual',
    badgeVariant: 'success',
    explanation: 'Histórico exemplar de pontualidade. Liquida habitualmente os valores dentro do prazo estipulado.',
    confidence: 'high',
    metrics,
  };
}

// -------------------------------------------------------------
// 2. PRIORIZAÇÃO EXPLICÁVEL DE COBRANÇAS
// -------------------------------------------------------------

export type InvoicePriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';

export interface InvoicePriorityAnalysis {
  invoiceId: string;
  invoiceNumber: string;
  priority: InvoicePriorityLevel;
  priorityLabel: string;
  badgeVariant: 'danger' | 'warning' | 'primary' | 'neutral' | 'success';
  score: number; // 0 - 100
  reason: string;
  recommendedAction: string;
  recommendedTone: MessageTone;
  recommendedChannel: MessageChannel;
  daysOverdue: number;
  remainingAmount: number;
}

/**
 * Calcula a prioridade e fundamentação textual clara de cada cobrança.
 */
export function analyzeInvoicePriority(
  invoice: Invoice,
  customer?: Customer,
  customerPromises: PaymentPromise[] = [],
  previousMessagesCount: number = 0
): InvoicePriorityAnalysis {
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const remainingAmount = Math.max(0, invoice.amount - invoice.paidAmount);

  // Promessas ativas e quebradas para esta fatura
  const invoicePromises = customerPromises.filter((p) => p.invoiceId === invoice.id);
  const brokenPromise = invoicePromises.find(
    (p) => p.status === 'broken' || (p.status === 'pending' && getDaysOverdue(p.promisedDate) > 0)
  );
  const activePendingPromise = invoicePromises.find((p) => p.status === 'pending' && getDaysOverdue(p.promisedDate) <= 0);

  let score = 10;
  let priority: InvoicePriorityLevel = 'NORMAL';
  let priorityLabel = 'Normal';
  let badgeVariant: 'danger' | 'warning' | 'primary' | 'neutral' | 'success' = 'neutral';
  let recommendedTone: MessageTone = 'cordial';
  let recommendedChannel: MessageChannel = customer?.phone ? 'whatsapp' : 'email';
  let recommendedAction = 'Acompanhar vencimento';
  const reasonClauses: string[] = [];

  if (invoice.status === 'paid' || remainingAmount <= 0) {
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      priority: 'NORMAL',
      priorityLabel: 'Liquidada',
      badgeVariant: 'success',
      score: 0,
      reason: 'A cobrança já se encontra integralmente liquidada.',
      recommendedAction: 'Agradecer pagamento e arquivar',
      recommendedTone: 'cordial',
      recommendedChannel: 'email',
      daysOverdue: 0,
      remainingAmount: 0,
    };
  }

  // 1. Atraso em dias
  if (daysOverdue > 30) {
    score += 45;
    reasonClauses.push(`está ${daysOverdue} dias atrasada`);
  } else if (daysOverdue > 14) {
    score += 35;
    reasonClauses.push(`está ${daysOverdue} dias atrasada`);
  } else if (daysOverdue > 7) {
    score += 25;
    reasonClauses.push(`está ${daysOverdue} dias em atraso`);
  } else if (daysOverdue > 0) {
    score += 15;
    reasonClauses.push(`venceu há ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'}`);
  } else if (daysOverdue === 0) {
    score += 10;
    reasonClauses.push('atinge o vencimento hoje');
  } else if (daysOverdue >= -3) {
    score += 5;
    reasonClauses.push(`vence em breve (dentro de ${Math.abs(daysOverdue)} dias)`);
  }

  // 2. Montante financeiro
  if (remainingAmount >= 2500) {
    score += 25;
    reasonClauses.push(`apresenta elevada exposição financeira (${formatCurrency(remainingAmount)})`);
  } else if (remainingAmount >= 1000) {
    score += 18;
    reasonClauses.push(`possui valor de ${formatCurrency(remainingAmount)}`);
  } else if (remainingAmount >= 500) {
    score += 10;
    reasonClauses.push(`possui valor de ${formatCurrency(remainingAmount)}`);
  }

  // 3. Promessas de pagamento
  if (brokenPromise) {
    score += 30;
    reasonClauses.push('existe uma promessa de pagamento não cumprida');
    recommendedTone = 'direct';
    recommendedAction = 'Contacto telefónico ou mensagem formal de incumprimento';
  } else if (activePendingPromise) {
    reasonClauses.push(`tem promessa de pagamento prevista para ${formatDate(activePendingPromise.promisedDate)}`);
    recommendedAction = 'Aguardar data acordada ou enviar lembrete cordial';
  }

  // 4. Tentativas de contacto anteriores
  if (previousMessagesCount >= 3) {
    score += 12;
    reasonClauses.push(`${previousMessagesCount} tentativas de contacto anteriores sem sucesso`);
    recommendedTone = 'formal';
  } else if (previousMessagesCount === 1) {
    recommendedTone = 'professional';
  }

  // Determinar escalão final
  if (score >= 70 || (daysOverdue > 20 && remainingAmount >= 1000) || brokenPromise) {
    priority = 'CRITICAL';
    priorityLabel = 'Crítica';
    badgeVariant = 'danger';
    recommendedTone = brokenPromise ? 'direct' : 'formal';
    recommendedAction = 'Contactar com máxima urgência e solicitar liquidação imediata';
  } else if (score >= 50 || daysOverdue > 7 || remainingAmount >= 2000) {
    priority = 'HIGH';
    priorityLabel = 'Alta';
    badgeVariant = 'warning';
    recommendedTone = 'professional';
    recommendedAction = 'Enviar mensagem de cobrança profissional e objetiva';
  } else if (score >= 30 || daysOverdue > 0) {
    priority = 'MEDIUM';
    priorityLabel = 'Média';
    badgeVariant = 'primary';
    recommendedTone = 'cordial';
    recommendedAction = 'Enviar lembrete cordial de regularização';
  } else if (daysOverdue === 0 || daysOverdue >= -3) {
    priority = 'LOW';
    priorityLabel = 'Preventiva';
    badgeVariant = 'neutral';
    recommendedTone = 'cordial';
    recommendedAction = 'Enviar aviso preventivo pré-vencimento';
  } else {
    priority = 'NORMAL';
    priorityLabel = 'Normal';
    badgeVariant = 'neutral';
    recommendedTone = 'cordial';
    recommendedAction = 'Manter em monitorização de rotina';
  }

  const reason = reasonClauses.length > 0
    ? `Prioridade ${priorityLabel.toLowerCase()} porque a cobrança ${reasonClauses.join(', ')}.`
    : `Cobrança com prioridade ${priorityLabel.toLowerCase()} com base no prazo de liquidação acordado.`;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    priority,
    priorityLabel,
    badgeVariant,
    score,
    reason,
    recommendedAction,
    recommendedTone,
    recommendedChannel,
    daysOverdue,
    remainingAmount,
  };
}

// -------------------------------------------------------------
// 3. CENTRO DE DECISÃO & RECOMENDAÇÃO DA PAGORA
// -------------------------------------------------------------

export interface PagoraActionableAdvice {
  headline: string;
  summaryPoints: string[];
  recommendation: string;
  criticalInvoicesCount: number;
  criticalTotalAmount: number;
  dueTodayCount: number;
  brokenPromisesCount: number;
  topPriorityInvoices: InvoicePriorityAnalysis[];
}

export function generatePagoraDailyRecommendation(
  invoices: Invoice[],
  customers: Customer[],
  promises: PaymentPromise[] = []
): PagoraActionableAdvice {
  const activeInvoices = invoices.filter(
    (i) => i.status === 'pending' || i.status === 'overdue' || i.status === 'partially_paid'
  );

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const priorityAnalyses = activeInvoices.map((inv) => {
    const cust = customerMap.get(inv.customerId);
    const custPromises = promises.filter((p) => p.customerId === inv.customerId);
    return analyzeInvoicePriority(inv, cust, custPromises);
  });

  // Ordenar por score de prioridade decrescente
  priorityAnalyses.sort((a, b) => b.score - a.score);

  const criticalItems = priorityAnalyses.filter((p) => p.priority === 'CRITICAL' || p.priority === 'HIGH');
  const criticalTotalAmount = criticalItems.reduce((sum, item) => sum + item.remainingAmount, 0);

  const overdueMoreThan7Days = priorityAnalyses.filter((p) => p.daysOverdue >= 7);
  const dueTodayOrTomorrow = priorityAnalyses.filter((p) => p.daysOverdue >= 0 && p.daysOverdue <= 1);
  const brokenPromisesList = promises.filter(
    (p) => p.status === 'broken' || (p.status === 'pending' && getDaysOverdue(p.promisedDate) > 0)
  );

  const summaryPoints: string[] = [];

  if (priorityAnalyses.length === 0) {
    return {
      headline: 'Carteira 100% regularizada',
      summaryPoints: ['Não existem faturas pendentes ou em atraso na sua carteira neste momento.'],
      recommendation: 'Excelente trabalho! Toda a cobrança está em dia.',
      criticalInvoicesCount: 0,
      criticalTotalAmount: 0,
      dueTodayCount: 0,
      brokenPromisesCount: 0,
      topPriorityInvoices: [],
    };
  }

  summaryPoints.push(`Tem ${priorityAnalyses.length} ${priorityAnalyses.length === 1 ? 'cobrança ativa que requer' : 'cobranças ativas que requerem'} acompanhamento.`);

  if (overdueMoreThan7Days.length > 0) {
    summaryPoints.push(`${overdueMoreThan7Days.length} ${overdueMoreThan7Days.length === 1 ? 'está atrasada' : 'estão atrasadas'} há mais de 7 dias.`);
  }

  if (brokenPromisesList.length > 0) {
    summaryPoints.push(`${brokenPromisesList.length} ${brokenPromisesList.length === 1 ? 'cliente possui promessa de pagamento expirada' : 'clientes possuem promessas de pagamento expiradas'}.`);
  }

  if (dueTodayOrTomorrow.length > 0) {
    summaryPoints.push(`${dueTodayOrTomorrow.length} ${dueTodayOrTomorrow.length === 1 ? 'cobrança atinge' : 'cobranças atingem'} o vencimento hoje ou amanhã.`);
  }

  let recommendation = 'Recomendação: rever as cobranças de maior valor e enviar lembretes preventivos.';
  if (brokenPromisesList.length > 0) {
    recommendation = `Recomendação: começar pelo contacto direto com os ${brokenPromisesList.length} clientes com promessa vencida para realinhar a previsão.`;
  } else if (criticalItems.length > 0) {
    const top2Exposure = criticalItems.slice(0, 2);
    const topSum = top2Exposure.reduce((s, i) => s + i.remainingAmount, 0);
    recommendation = `Recomendação: começar pelas ${top2Exposure.length} cobranças de maior exposição (${formatCurrency(topSum)}) que concentram o maior risco financeiro.`;
  } else if (overdueMoreThan7Days.length > 0) {
    recommendation = 'Recomendação: enviar mensagem de acompanhamento profissional aos clientes em atraso superior a uma semana.';
  }

  return {
    headline: criticalItems.length > 0 ? `${criticalItems.length} cobranças merecem atenção prioritária hoje` : 'Acompanhamento preventivo da carteira',
    summaryPoints,
    recommendation,
    criticalInvoicesCount: criticalItems.length,
    criticalTotalAmount,
    dueTodayCount: dueTodayOrTomorrow.length,
    brokenPromisesCount: brokenPromisesList.length,
    topPriorityInvoices: priorityAnalyses.slice(0, 5),
  };
}

// -------------------------------------------------------------
// 4. RECOMENDAÇÃO EXPLICÁVEL DE ABORDAGEM NO GERADOR DE MENSAGENS
// -------------------------------------------------------------

export interface ApproachExplanation {
  recommendedTone: MessageTone;
  recommendedToneLabel: string;
  recommendedChannel: MessageChannel;
  headline: string;
  explanation: string;
  timingAdvice: string;
  suggestedAction: string;
  bulletPoints: string[];
}

export function explainRecommendedApproach(
  customer?: Customer,
  invoice?: Invoice,
  customerPromises: PaymentPromise[] = [],
  previousMessagesCount: number = 0
): ApproachExplanation {
  if (!customer) {
    return {
      recommendedTone: 'cordial',
      recommendedToneLabel: 'Cordial',
      recommendedChannel: 'whatsapp',
      headline: 'Abordagem Geral de Relacionamento',
      explanation: 'Sem cliente específico selecionado. Utilize uma comunicação cordial e clara.',
      timingAdvice: 'Horário comercial (09:00 - 18:00)',
      suggestedAction: 'Selecionar cliente para afinar o tom',
      bulletPoints: ['Selecione o destinatário', 'Verifique o saldo em conta corrente'],
    };
  }

  const daysOverdue = invoice ? getDaysOverdue(invoice.dueDate) : 0;
  const remaining = invoice ? Math.max(0, invoice.amount - invoice.paidAmount) : 0;
  const invoicePromises = invoice ? customerPromises.filter((p) => p.invoiceId === invoice.id) : [];
  const brokenPromise = invoicePromises.find(
    (p) => p.status === 'broken' || (p.status === 'pending' && getDaysOverdue(p.promisedDate) > 0)
  );
  const activePromise = invoicePromises.find((p) => p.status === 'pending' && getDaysOverdue(p.promisedDate) <= 0);

  // 1. Promessa de pagamento quebrada
  if (brokenPromise) {
    return {
      recommendedTone: 'direct',
      recommendedToneLabel: 'Direto e Objetivo',
      recommendedChannel: customer.phone ? 'whatsapp' : 'email',
      headline: 'Abordagem Firme: Promessa Vencida',
      explanation: `Escolhemos uma abordagem firme e direta porque havia sido acordada a regularização até ${formatDate(brokenPromise.promisedDate)} e o pagamento ainda não deu entrada.`,
      timingAdvice: 'Manhã (entre as 10:00 e as 12:00) para permitir resolução bancária no próprio dia.',
      suggestedAction: 'Solicitar comprovativo imediato ou agendar nova data firme sem ambiguidades.',
      bulletPoints: [
        `Promessa expirada em ${formatDate(brokenPromise.promisedDate)}`,
        `Montante pendente: ${formatCurrency(brokenPromise.amount || remaining)}`,
        'Manter tom estritamente profissional e focado em soluções',
      ],
    };
  }

  // 2. Cobrança já liquidada
  if (invoice && (invoice.status === 'paid' || remaining <= 0)) {
    return {
      recommendedTone: 'cordial',
      recommendedToneLabel: 'Cordial',
      recommendedChannel: 'email',
      headline: 'Confirmação e Agradecimento',
      explanation: 'O valor desta fatura já foi recebido. O contacto deve confirmar a receção e reforçar a parceria comercial.',
      timingAdvice: 'Imediato após confirmação bancária.',
      suggestedAction: 'Enviar recibo ou comprovativo de quitação.',
      bulletPoints: ['Agradecer a pontualidade', 'Confirmar quitação total do documento'],
    };
  }

  // 3. Atraso superior a 15 dias ou múltiplas tentativas
  if (daysOverdue > 15 || previousMessagesCount >= 2) {
    return {
      recommendedTone: 'formal',
      recommendedToneLabel: 'Formal e Objetivo',
      recommendedChannel: 'email',
      headline: 'Abordagem Formal: Atraso Consolidado',
      explanation: `Escolhemos uma abordagem formal porque a fatura está ${daysOverdue} dias atrasada${previousMessagesCount > 0 ? ` e já conta com ${previousMessagesCount} contactos anteriores` : ''}. É essencial clarificar a urgência da liquidação.`,
      timingAdvice: 'Dias úteis no início da manhã.',
      suggestedAction: 'Incluir referência Multibanco / link de pagamento direto para facilitar a liquidação imediata.',
      bulletPoints: [
        `${daysOverdue} dias decorridos desde a data de vencimento`,
        `Montante: ${formatCurrency(remaining)}`,
        'Recomenda-se registar compromisso com data específica',
      ],
    };
  }

  // 4. Atraso recente (4 a 15 dias)
  if (daysOverdue >= 4) {
    return {
      recommendedTone: 'professional',
      recommendedToneLabel: 'Profissional e Direto',
      recommendedChannel: customer.phone ? 'whatsapp' : 'email',
      headline: 'Abordagem Profissional de Regularização',
      explanation: `Escolhemos uma abordagem profissional porque o pagamento está ${daysOverdue} dias atrasado. Recomenda-se uma mensagem objetiva, preservando a boa relação comercial.`,
      timingAdvice: 'Meio da manhã ou início da tarde.',
      suggestedAction: 'Verificar se o cliente recebeu a fatura e facultar os dados de pagamento.',
      bulletPoints: [
        `Vencimento ocorrido a ${formatDate(invoice!.dueDate)}`,
        'Verificar se existiu algum impedimento operacional ou extravio',
        'Facilitar meio de liquidação instantâneo',
      ],
    };
  }

  // 5. Atraso muito recente (1 a 3 dias)
  if (daysOverdue >= 1) {
    return {
      recommendedTone: 'cordial',
      recommendedToneLabel: 'Cordial',
      recommendedChannel: customer.phone ? 'whatsapp' : 'email',
      headline: 'Aviso Gentil Pós-Vencimento',
      explanation: `O vencimento ocorreu há ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'}. Trata-se de um atraso muito recente que frequentemente resulta de esquecimento involuntário.`,
      timingAdvice: 'Durante a manhã.',
      suggestedAction: 'Enviar lembrete amigável com os dados de pagamento.',
      bulletPoints: [
        'Tom leve e colaborativo',
        'Evitar qualquer pressão excessiva neste primeiro contacto',
      ],
    };
  }

  // 6. Vence hoje ou preventivo
  return {
    recommendedTone: 'cordial',
    recommendedToneLabel: 'Cordial e Preventivo',
    recommendedChannel: customer.phone ? 'whatsapp' : 'email',
    headline: 'Lembrete Preventivo',
    explanation: invoice
      ? daysOverdue === 0
        ? 'A fatura atinge hoje o vencimento. Um lembrete gentil previne atrasos e ajuda na organização de tesouraria.'
        : `Faltam ${Math.abs(daysOverdue)} dias para o vencimento. O aviso prévio apoia o planeamento de pagamentos do cliente.`
      : 'Contacto preventivo de rotina com o cliente.',
    timingAdvice: 'Dias úteis em horário normal.',
    suggestedAction: 'Facilitar a fatura e dados para liquidação atempada.',
    bulletPoints: [
      'Reforçar o serviço prestado',
      'Manter canal de comunicação aberto para esclarecimento de dúvidas',
    ],
  };
}
