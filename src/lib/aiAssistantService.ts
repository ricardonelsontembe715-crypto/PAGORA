/**
 * Serviço de Inteligência Contextual e Assistente de Cobrança da PAGORA
 * Comunica com o servidor seguro (backend com Gemini SDK / fallback determinístico).
 * Sem exposição de chaves no browser.
 */

import { Customer, Invoice, PaymentPromise, MessageChannel, MessageTone } from '../types/database';
import { CollectionReminder } from '../types/automations';
import { formatCurrency } from './formatters';

export interface AIAssistantRecommendation {
  title: string;
  recommendation: string;
  reason: string;
  dataUsed: string[];
  suggestedAction: {
    label: string;
    type: 'open_collection' | 'open_customer' | 'generate_message' | 'record_payment';
    targetId?: string;
    customerId?: string;
    invoiceId?: string;
  };
  confidence: 'high' | 'medium' | 'low';
  category: 'URGENT' | 'HIGH_EXPOSURE' | 'BROKEN_PROMISE' | 'PREVENTIVE' | 'PORTFOLIO_SUMMARY';
}

export interface AIAssistantResponse {
  answer: string;
  recommendations: AIAssistantRecommendation[];
  summaryMetrics?: {
    totalOverdue: number;
    atRiskCustomersCount: number;
    topPriorityCustomer?: string;
    todayFocusAction?: string;
  };
  isLiveAi: boolean;
}

export interface AIMessageGenerationRequest {
  customer: Customer;
  invoice?: Invoice;
  tone: MessageTone;
  channel: MessageChannel;
  intent?: 'remind' | 'followup' | 'final_notice' | 'negotiate' | 'thank';
  customInstructions?: string;
  variationIndex?: number;
}

export interface AIMessageGenerationResponse {
  subject?: string;
  body: string;
  channel: MessageChannel;
  tone: MessageTone;
  characterCount: number;
  isLiveAi: boolean;
}

export async function askPagoraAssistant(
  question: string,
  context: {
    customers: Customer[];
    invoices: Invoice[];
    promises: PaymentPromise[];
    reminders: CollectionReminder[];
  }
): Promise<AIAssistantResponse> {
  try {
    const payload = {
      question,
      customers: context.customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        taxId: c.taxId,
      })),
      invoices: context.invoices.map((i) => ({
        id: i.id,
        number: i.invoiceNumber,
        invoiceNumber: i.invoiceNumber,
        customerId: i.customerId,
        amount: i.amount,
        paidAmount: i.paidAmount,
        dueDate: i.dueDate,
        status: i.status,
      })),
      promises: context.promises.map((p) => ({
        id: p.id,
        customerId: p.customerId,
        invoiceId: p.invoiceId,
        amount: p.amount,
        promisedDate: p.promisedDate,
        status: p.status,
      })),
      reminders: context.reminders.map((r) => ({
        id: r.id,
        customerId: r.customerId,
        invoiceId: r.invoiceId,
        scheduledDate: r.scheduledDate,
        priority: r.priority,
        status: r.status,
      })),
    };

    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('[AI ASSISTANT] Erro ao comunicar com API de IA no servidor, a recorrer ao motor de cálculo determinístico.', err);
  }

  // Fallback determinístico avançado sem inventar dados
  return generateDeterministicAssistantResponse(question, context);
}

export async function generateIntelligentMessage(
  req: AIMessageGenerationRequest
): Promise<AIMessageGenerationResponse> {
  try {
    const response = await fetch('/api/ai/generate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('[AI MESSAGE] Erro ao comunicar com API no servidor, a recorrer ao motor determinístico.', err);
  }

  // Fallback determinístico robusto
  const { customer, invoice, channel, tone } = req;
  const firstName = customer.name.split(' ')[0] || customer.name;
  const invNumber = invoice?.invoiceNumber || 'fatura pendente';
  const amountStr = invoice ? formatCurrency(invoice.amount - invoice.paidAmount) : 'valor em aberto';

  let subject = `PAGORA: Informação sobre ${invNumber}`;
  let body = '';

  if (channel === 'whatsapp' || channel === 'sms') {
    if (tone === 'cordial' || tone === 'friendly') {
      body = `Olá ${firstName}, espero que esteja tudo bem. Contacto apenas para relembrar que a fatura ${invNumber} (${amountStr}) se encontra pendente. Se já efetuou o pagamento, por favor desconsidere. Obrigado!`;
    } else if (tone === 'direct') {
      body = `Olá ${firstName}. A fatura ${invNumber} no valor de ${amountStr} está atualmente vencida. Agradecemos a regularização do pagamento com a brevidade possível. Obrigado.`;
    } else {
      body = `Exmo(a). ${customer.name}, solicitamos a liquidação da fatura ${invNumber} (${amountStr}) em atraso. Em caso de dúvidas, contacte-nos.`;
    }
  } else {
    subject = `Acompanhamento de Cobrança — Fatura ${invNumber}`;
    body = `Exmo(a). ${customer.name},\n\nEscrevemos no seguimento da emissão da fatura ${invNumber}, no valor de ${amountStr}, cuja regularização se encontra em aberto.\n\nAgradecemos que verifique a situação e proceda à liquidação assim que possível. Caso o pagamento já tenha sido emitido, agradecemos que ignore esta mensagem.\n\nCom os melhores cumprimentos,\nDepartamento Financeiro`;
  }

  return {
    subject,
    body,
    channel,
    tone,
    characterCount: body.length,
    isLiveAi: false,
  };
}

function generateDeterministicAssistantResponse(
  question: string,
  context: {
    customers: Customer[];
    invoices: Invoice[];
    promises: PaymentPromise[];
    reminders: CollectionReminder[];
  }
): AIAssistantResponse {
  const activeInvoices = context.invoices.filter((i) => i.status === 'overdue' || i.status === 'pending' || i.status === 'partially_paid');
  const overdueInvoices = context.invoices.filter((i) => i.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  const brokenPromises = context.promises.filter((p) => p.status === 'broken');

  // Ordenar faturas vencidas por montante em risco
  const sortedOverdue = [...overdueInvoices].sort((a, b) => (b.amount - b.paidAmount) - (a.amount - a.paidAmount));
  const topOverdue = sortedOverdue[0];
  const topCustomer = topOverdue ? context.customers.find((c) => c.id === topOverdue.customerId) : undefined;

  const recommendations: AIAssistantRecommendation[] = [];

  if (topOverdue && topCustomer) {
    recommendations.push({
      title: `Prioridade Máxima: Contactar ${topCustomer.name}`,
      recommendation: `O cliente ${topCustomer.name} possui a maior exposição financeira em atraso (${formatCurrency(topOverdue.amount - topOverdue.paidAmount)} na fatura ${topOverdue.invoiceNumber}).`,
      reason: `Fatura vencida com maior impacto no fluxo de tesouraria do espaço de trabalho.`,
      dataUsed: [
        `Cliente: ${topCustomer.name}`,
        `Fatura: ${topOverdue.invoiceNumber}`,
        `Valor: ${formatCurrency(topOverdue.amount - topOverdue.paidAmount)}`,
        `Vencimento: ${topOverdue.dueDate}`,
      ],
      suggestedAction: {
        label: `Enviar Mensagem Cordial`,
        type: 'generate_message',
        customerId: topCustomer.id,
        invoiceId: topOverdue.id,
      },
      confidence: 'high',
      category: 'URGENT',
    });
  }

  if (brokenPromises.length > 0) {
    const promise = brokenPromises[0];
    const promCust = context.customers.find((c) => c.id === promise.customerId);
    if (promCust) {
      recommendations.push({
        title: `Promessa Não Cumprida — ${promCust.name}`,
        recommendation: `Revisitar o acordo de pagamento de ${formatCurrency(promise.amount)} previsto para ${promise.promisedDate}.`,
        reason: `A promessa ultrapassou a data limite acordada sem registo de liquidação total.`,
        dataUsed: [
          `Cliente: ${promCust.name}`,
          `Valor prometido: ${formatCurrency(promise.amount)}`,
          `Data limite: ${promise.promisedDate}`,
        ],
        suggestedAction: {
          label: `Renegociar / Contactar`,
          type: 'generate_message',
          customerId: promCust.id,
          invoiceId: promise.invoiceId,
        },
        confidence: 'high',
        category: 'BROKEN_PROMISE',
      });
    }
  }

  const qLower = question.toLowerCase();
  let answer = '';

  if (qLower.includes('quem') || qLower.includes('prioridade') || qLower.includes('contactar')) {
    if (topCustomer && topOverdue) {
      answer = `A sua principal prioridade de cobrança hoje é **${topCustomer.name}**, com **${formatCurrency(topOverdue.amount - topOverdue.paidAmount)}** pendentes na fatura ${topOverdue.invoiceNumber}. Recomendamos o envio de uma mensagem cordial para alinhar a previsão de pagamento.`;
    } else {
      answer = `Não existem clientes em atraso crítico com ações pendentes neste momento. A sua carteira encontra-se em conformidade.`;
    }
  } else if (qLower.includes('quanto') || qLower.includes('atraso') || qLower.includes('valor')) {
    answer = `O montante total atualmente em atraso na carteira é de **${formatCurrency(totalOverdue)}**, distribuído por **${overdueInvoices.length}** fatura(s) vencida(s).`;
  } else {
    answer = `Análise da carteira concluída: tem **${overdueInvoices.length}** faturas vencidas totalizando **${formatCurrency(totalOverdue)}** em risco. ${brokenPromises.length > 0 ? `Existem ${brokenPromises.length} promessa(s) de pagamento ultrapassadas que requerem atenção.` : 'Não existem promessas quebradas registadas.'}`;
  }

  return {
    answer,
    recommendations,
    summaryMetrics: {
      totalOverdue,
      atRiskCustomersCount: new Set(overdueInvoices.map((i) => i.customerId)).size,
      topPriorityCustomer: topCustomer?.name,
      todayFocusAction: topCustomer ? `Contactar ${topCustomer.name}` : undefined,
    },
    isLiveAi: false,
  };
}
