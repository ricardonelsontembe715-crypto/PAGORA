import {
  Customer,
  Invoice,
  PaymentPromise,
  MessageChannel,
  MessageTone,
  MessageCategory,
  MessageIntent,
  InPersonStep,
  AccountSignature,
} from '../types/database';
import { formatCurrency, formatDate, getDaysOverdue } from './formatters';

export interface MessageContextData {
  customer?: Customer;
  invoice?: Invoice;
  activePromise?: PaymentPromise;
  previousMessagesCount?: number;
  lastContactDate?: string;
  signature?: AccountSignature;
  accountName?: string;
}

export interface GeneratorOptions {
  channel: MessageChannel;
  tone: MessageTone;
  category: MessageCategory;
  intent: MessageIntent;
  includePaymentLink: boolean;
  includePaymentMethod: boolean;
  includeDueDate: boolean;
  includeOverdueDays: boolean;
  includeSignature: boolean;
  variationIndex?: number; // 0, 1, 2 for different phrasing
  customNotes?: string;
}

export interface EngineRecommendation {
  recommendedCategory: MessageCategory;
  recommendedTone: MessageTone;
  recommendedIntent: MessageIntent;
  headline: string;
  reason: string;
  badge: string;
  contextSummary: {
    customerName: string;
    customerType: string;
    totalAmount: string;
    remainingAmount: string;
    statusText: string;
    daysOverdue: number;
    hasPromise: boolean;
    promiseDate?: string;
    isPromiseBroken: boolean;
    hasPaymentLink: boolean;
  };
}

export interface GeneratedMessageOutput {
  subject?: string;
  body: string;
  inPersonSteps?: InPersonStep[];
  variablesUsed: Record<string, string>;
  category: MessageCategory;
  tone: MessageTone;
  channel: MessageChannel;
  intent: MessageIntent;
  versionLabel: string;
}

/**
 * Analisa a cobrança e cliente para sugerir a melhor abordagem
 */
export function analyzeMessageContext(data: MessageContextData): EngineRecommendation {
  const { customer, invoice, activePromise } = data;
  const daysOverdue = invoice ? getDaysOverdue(invoice.dueDate) : 0;
  const remaining = invoice ? Math.max(0, invoice.amount - invoice.paidAmount) : 0;
  const hasLink = Boolean(invoice?.paymentLink);
  const isCompany = customer?.type === 'company';
  const hasPromise = Boolean(activePromise && activePromise.status === 'pending');
  const isPromiseBroken = Boolean(activePromise && (activePromise.status === 'broken' || (activePromise.status === 'pending' && getDaysOverdue(activePromise.promisedDate) > 0)));

  let recommendedCategory: MessageCategory = 'cordial_reminder';
  let recommendedTone: MessageTone = 'cordial';
  let recommendedIntent: MessageIntent = 'remind';
  let headline = 'Lembrete cordial preventivo';
  let reason = 'A cobrança encontra-se dentro do prazo previsto. Um lembrete gentil e informativo é a melhor abordagem para manter um bom relacionamento.';
  let badge = 'No prazo';

  if (!invoice) {
    // Contexto genérico de cliente
    recommendedCategory = isCompany ? 'company_client' : 'individual_client';
    recommendedTone = isCompany ? 'formal' : 'cordial';
    recommendedIntent = 'request_forecast';
    headline = isCompany ? 'Comunicação empresarial' : 'Contacto de acompanhamento';
    reason = 'Contacto geral com o cliente para acompanhamento de conta corrente.';
    badge = 'Geral';
  } else if (invoice.status === 'paid' || remaining <= 0) {
    recommendedCategory = 'payment_confirmation';
    recommendedTone = 'cordial';
    recommendedIntent = 'confirm_receipt';
    headline = 'Confirmação de recebimento';
    reason = 'O valor desta cobrança já se encontra liquidado. Agradeça ao cliente e confirme a boa receção dos fundos.';
    badge = 'Liquidado';
  } else if (isPromiseBroken) {
    recommendedCategory = 'broken_promise';
    recommendedTone = 'professional';
    recommendedIntent = 'confirm_promise';
    headline = 'Promessa de pagamento expirada';
    reason = `Havia sido acordada a data de ${formatDate(activePromise!.promisedDate)} para regularização. Recomenda-se um contacto respeitoso e profissional para realinhar uma nova previsão sem acusações.`;
    badge = 'Promessa expirada';
  } else if (hasPromise) {
    recommendedCategory = 'promise_reminder';
    recommendedTone = 'cordial';
    recommendedIntent = 'confirm_promise';
    headline = 'Acompanhamento de promessa acordada';
    reason = `O cliente indicou que regularizaria a ${formatDate(activePromise!.promisedDate)}. Um lembrete amigável reforça o compromisso de forma natural.`;
    badge = 'Com promessa';
  } else if (daysOverdue === 0) {
    recommendedCategory = 'due_date';
    recommendedTone = 'cordial';
    recommendedIntent = 'remind';
    headline = 'Lembrete no dia do vencimento';
    reason = 'A fatura atinge hoje a data de vencimento. Um aviso informativo e cordial é ideal para evitar esquecimentos involuntários.';
    badge = 'Vence hoje';
  } else if (daysOverdue < 0) {
    recommendedCategory = 'before_due';
    recommendedTone = 'cordial';
    recommendedIntent = 'remind';
    headline = 'Lembrete preventivo pré-vencimento';
    reason = `Faltam ${Math.abs(daysOverdue)} dias para o vencimento. Um aviso preventivo permite ao cliente organizar a tesouraria atempadamente.`;
    badge = 'Preventivo';
  } else if (daysOverdue >= 1 && daysOverdue <= 3) {
    recommendedCategory = 'overdue_first';
    recommendedTone = 'cordial';
    recommendedIntent = 'remind';
    headline = 'Primeiro contacto após vencimento';
    reason = `A fatura venceu há ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'}. O atraso é recente, pelo que um tom cordial e de verificação é o mais eficaz.`;
    badge = `${daysOverdue}d em atraso`;
  } else if (daysOverdue >= 4 && daysOverdue <= 15) {
    recommendedCategory = 'professional_collection';
    recommendedTone = 'professional';
    recommendedIntent = 'request_payment';
    headline = 'Cobrança profissional de regularização';
    reason = `A fatura está com ${daysOverdue} dias de atraso. Um tom profissional, claro e objetivo solicita a liquidação com firmeza e educação.`;
    badge = `${daysOverdue}d em atraso`;
  } else if (daysOverdue >= 16 && daysOverdue <= 30) {
    recommendedCategory = 'direct_collection';
    recommendedTone = 'direct';
    recommendedIntent = 'request_forecast';
    headline = 'Cobrança direta com pedido de previsão';
    reason = `Atraso de ${daysOverdue} dias. Recomendamos uma abordagem direta para solicitar uma data concreta de liquidação e o respetivo comprovativo.`;
    badge = `${daysOverdue}d em atraso`;
  } else {
    // Mais de 30 dias
    recommendedCategory = 'last_friendly';
    recommendedTone = isCompany ? 'formal' : 'direct';
    recommendedIntent = 'request_forecast';
    headline = 'Cobrança firme de atraso prolongado';
    reason = `Cobrança pendente há ${daysOverdue} dias. Abordagem firme, respeitosa e clara para obter uma resposta urgente e evitar vias contenciosas.`;
    badge = `Atraso crítico (+${daysOverdue}d)`;
  }

  // Ajuste especial para valores muito elevados
  if (remaining >= 3000 && daysOverdue > 0 && !isPromiseBroken) {
    recommendedCategory = 'high_value';
    recommendedTone = 'professional';
    headline = 'Cobrança de valor significativo';
    reason = `Montante elevado (${formatCurrency(remaining)}) com ${daysOverdue} dias de atraso. Sugere-se uma comunicação personalizada com cuidado na relação comercial.`;
  }

  const customerName = customer?.name || 'Cliente';
  const customerType = customer?.type === 'company' ? 'Empresa' : 'Particular';
  const totalAmount = invoice ? formatCurrency(invoice.amount) : '0,00 €';
  const remainingAmount = invoice ? formatCurrency(remaining) : '0,00 €';
  const statusText = daysOverdue > 0 ? `${daysOverdue} dias em atraso` : daysOverdue === 0 ? 'Vence hoje' : 'Dentro do prazo';

  return {
    recommendedCategory,
    recommendedTone,
    recommendedIntent,
    headline,
    reason,
    badge,
    contextSummary: {
      customerName,
      customerType,
      totalAmount,
      remainingAmount,
      statusText,
      daysOverdue,
      hasPromise,
      promiseDate: activePromise?.promisedDate,
      isPromiseBroken,
      hasPaymentLink: hasLink,
    },
  };
}

/**
 * Tradutor de métodos de pagamento para linguagem natural
 */
export function formatPaymentMethodText(method?: string): string {
  switch (method) {
    case 'bank_transfer':
      return 'Transferência Bancária';
    case 'mbway':
      return 'MB WAY';
    case 'multibanco':
      return 'Referência Multibanco';
    case 'card':
      return 'Cartão de Débito/Crédito';
    case 'paypal':
      return 'PayPal';
    case 'cash':
      return 'Numerário';
    default:
      return method || 'os meios habituais';
  }
}

/**
 * Constrói a assinatura formatada
 */
export function buildSignatureText(signature?: AccountSignature, fallbackName?: string): string {
  if (!signature || !signature.enabled) {
    return fallbackName ? `\n\nCom os melhores cumprimentos,\n${fallbackName}` : '\n\nCom os melhores cumprimentos,\nA Equipa';
  }

  if (signature.customText && signature.customText.trim()) {
    return `\n\n${signature.customText.trim()}`;
  }

  const lines: string[] = ['\n\nCom os melhores cumprimentos,'];
  if (signature.name) lines.push(signature.name);
  if (signature.role && signature.companyName) {
    lines.push(`${signature.role} • ${signature.companyName}`);
  } else if (signature.companyName) {
    lines.push(signature.companyName);
  } else if (signature.role) {
    lines.push(signature.role);
  }
  if (signature.phone) lines.push(`Tel: ${signature.phone}`);
  if (signature.email) lines.push(`Email: ${signature.email}`);

  return lines.join('\n');
}

/**
 * Constrói o assunto do e-mail com base no contexto e tom
 */
export function generateEmailSubject(
  category: MessageCategory,
  tone: MessageTone,
  invoiceNumber?: string,
  customerName?: string
): string {
  const ref = invoiceNumber ? ` — ${invoiceNumber}` : '';

  switch (category) {
    case 'before_due':
      return `Lembrete informativo de fatura${ref}`;
    case 'due_date':
      return `Vencimento da fatura hoje${ref}`;
    case 'overdue_first':
      return `Aviso de vencimento de fatura${ref}`;
    case 'cordial_reminder':
      return `Lembrete amigável de pagamento pendente${ref}`;
    case 'professional_collection':
      return `Regularização da fatura${ref}`;
    case 'direct_collection':
      return `Pagamento pendente da fatura${ref}`;
    case 'high_value':
      return `Acompanhamento de conta corrente e regularização${ref}`;
    case 'no_response':
      return `Segundo aviso de regularização da fatura${ref}`;
    case 'after_promise':
    case 'promise_reminder':
      return `Acompanhamento de pagamento acordado${ref}`;
    case 'broken_promise':
      return `Regularização de pagamento pendente${ref}`;
    case 'last_friendly':
      return `Aviso importante: Regularização urgente da fatura${ref}`;
    case 'payment_confirmation':
      return `Confirmação de receção de pagamento${ref}`;
    case 'payment_proof_request':
      return `Pedido de comprovativo de pagamento${ref}`;
    case 'friend_acquaintance':
      return `Assunto pendente${ref}`;
    case 'company_client':
      return `Departamento Financeiro: Fatura pendente${ref}`;
    case 'individual_client':
      return `Informação sobre a sua fatura${ref}`;
    case 'follow_up':
      return `Ponto de situação da fatura${ref}`;
    default:
      return `Assunto: Pagamento pendente${ref}`;
  }
}

/**
 * Constrói roteiro presencial (Modo "Como abordar pessoalmente")
 */
export function generateInPersonScript(
  context: MessageContextData,
  tone: MessageTone,
  category: MessageCategory
): InPersonStep[] {
  const { customer, invoice, activePromise } = context;
  const name = customer?.name ? customer.name.split(' ')[0] : 'o cliente';
  const remaining = invoice ? formatCurrency(Math.max(0, invoice.amount - invoice.paidAmount)) : 'o montante em aberto';
  const ref = invoice?.invoiceNumber || 'a fatura pendente';
  const days = invoice ? getDaysOverdue(invoice.dueDate) : 0;
  const promiseDate = activePromise ? formatDate(activePromise.promisedDate) : null;

  if (category === 'broken_promise' && promiseDate) {
    return [
      {
        step: 1,
        title: 'Cumprimento e rapport inicial',
        dialogue: `“Olá ${name}, tudo bem? Tens um minutinho para conversarmos com calma?”`,
        tip: 'Aborde com naturalidade e mantenha o tom calmo e profissional.',
      },
      {
        step: 2,
        title: 'Introduzir o assunto com tato',
        dialogue: `“Queria só dar seguimento àquele nosso contacto sobre ${ref}. Tínhamos falado sobre regularizar até dia ${promiseDate}.”`,
        tip: 'Mencione a data acordada sem tom acusatório ou agressivo.',
      },
      {
        step: 3,
        title: 'Apresentar o saldo',
        dialogue: `“Como ainda temos o saldo de ${remaining} pendente, queria perceber se surgiu algum contratempo com a transferência.”`,
        tip: 'Permita que o cliente explique o motivo com dignidade.',
      },
      {
        step: 4,
        title: 'Alinhar nova data concreta',
        dialogue: `“Compreendo perfeitamente. Para podermos fechar este processo, consegues garantir o envio do comprovativo até amanhã ou quinta-feira?”`,
        tip: 'Dê duas opções claras de datas para facilitar a decisão.',
      },
      {
        step: 5,
        title: 'Confirmar e registar',
        dialogue: `“Combinado então. Fico a aguardar a tua confirmação até essa data. Obrigado pela tua atenção!”`,
        tip: 'Logo após a conversa, registe a nova promessa na PAGORA para manter o histórico atualizado.',
      },
    ];
  }

  if (category === 'friend_acquaintance') {
    return [
      {
        step: 1,
        title: 'Cumprimentar com proximidade',
        dialogue: `“Boas ${name}! Como estão as coisas por aí?”`,
        tip: 'Mantenha a amizade em primeiro lugar, sem constrangimento artificial.',
      },
      {
        step: 2,
        title: 'Transição suave para o assunto',
        dialogue: `“Olha, queria só ver contigo com tranquilidade aquele valor de ${remaining} relativo a ${ref}.”`,
        tip: 'Fale de forma direta e serena.',
      },
      {
        step: 3,
        title: 'Pedir previsão amigavelmente',
        dialogue: `“Dá-te jeito regularizar por MB WAY ou transferência nos próximos dias para eu organizar as minhas contas deste mês?”`,
        tip: 'Enquadrar como uma necessidade prática de organização sua reduz o desconforto.',
      },
      {
        step: 4,
        title: 'Fecho e agradecimento',
        dialogue: `“Perfeito, combinadíssimo! Muito obrigado, um abraço!”`,
        tip: 'Agradeça com simpatia e registe a data na aplicação.',
      },
    ];
  }

  // Roteiro Profissional Padrão
  return [
    {
      step: 1,
      title: 'Cumprimento cordial',
      dialogue: `“Bom dia/boa tarde ${name}. Espero que esteja tudo bem convosco.”`,
      tip: 'Inicie com cordialidade para criar um ambiente recetivo.',
    },
    {
      step: 2,
      title: 'Apresentar a situação com clareza',
      dialogue: `“Entro em contacto sobre a fatura ${ref}, no valor de ${remaining}${days > 0 ? `, que atingiu o vencimento há ${days} dias` : ''}.”`,
      tip: 'Tenha os dados da fatura e o valor exato à mão.',
    },
    {
      step: 3,
      title: 'Verificar se receberam os dados',
      dialogue: `“Queria apenas confirmar se receberam os dados de pagamento em perfeitas condições ou se precisam de algum esclarecimento adicional.”`,
      tip: 'Esta pergunta abre espaço para resolver dúvidas técnicas ou administrativas.',
    },
    {
      step: 4,
      title: 'Solicitar previsão de liquidação',
      dialogue: `“Para efeitos de organização da nossa tesouraria, qual é a vossa previsão para a emissão do pagamento?”`,
      tip: 'Foque na obtenção de uma data específica.',
    },
    {
      step: 5,
      title: 'Combinar envio de comprovativo',
      dialogue: `“Excelente. Ficamos então a aguardar a liquidação até essa data e o respetivo comprovativo. Agradecemos a vossa cooperação!”`,
      tip: 'Registe de imediato a promessa de pagamento na PAGORA.',
    },
  ];
}

/**
 * MOTOR DE GERAÇÃO TEXTUAL PRINCIPAL
 * Gera mensagens personalizadas, naturais, humanas e contextualizadas.
 */
export function generateMessageText(
  context: MessageContextData,
  options: GeneratorOptions
): GeneratedMessageOutput {
  const { customer, invoice, activePromise, signature, accountName } = context;
  const {
    channel,
    tone,
    category,
    intent,
    includePaymentLink,
    includePaymentMethod,
    includeDueDate,
    includeOverdueDays,
    includeSignature,
    variationIndex = 0,
  } = options;

  const customerName = customer?.name || 'Estimado(a) Cliente';
  const firstName = customer?.name ? customer.name.trim().split(' ')[0] : 'Cliente';
  const isCompany = customer?.type === 'company';
  const invoiceNumber = invoice?.invoiceNumber || 'fatura';
  const remaining = invoice ? Math.max(0, invoice.amount - invoice.paidAmount) : 0;
  const formattedRemaining = formatCurrency(remaining);
  const formattedTotal = invoice ? formatCurrency(invoice.amount) : '0,00 €';
  const dueDateStr = invoice ? formatDate(invoice.dueDate) : '';
  const daysOverdue = invoice ? getDaysOverdue(invoice.dueDate) : 0;
  const paymentLink = invoice?.paymentLink && includePaymentLink ? invoice.paymentLink : '';
  const paymentMethodName = invoice?.paymentMethod && includePaymentMethod ? formatPaymentMethodText(invoice.paymentMethod) : '';
  const promisedDateStr = activePromise ? formatDate(activePromise.promisedDate) : '';

  // Saudação por tom e tipo de cliente
  let greeting = `Olá ${firstName},`;
  if (tone === 'formal' || (isCompany && tone !== 'friendly')) {
    greeting = isCompany ? `Exmos. Senhores,` : `Exmo.(a) Sr.(a) ${customerName},`;
  } else if (tone === 'friendly') {
    greeting = `Olá ${firstName}, tudo bem?`;
  } else if (tone === 'cordial') {
    greeting = `Olá ${customerName}, esperamos que esteja tudo bem.`;
  } else if (tone === 'direct') {
    greeting = `Olá ${firstName},`;
  }

  // Assunto se for E-mail
  const subject = channel === 'email' ? generateEmailSubject(category, tone, invoice?.invoiceNumber, customerName) : undefined;

  // Dados adicionais inseríveis
  const paymentLinkLine = paymentLink
    ? channel === 'sms'
      ? ` Link: ${paymentLink}`
      : `\n\nPode efetuar o pagamento comodamente através do link seguro:\n${paymentLink}`
    : '';

  const paymentMethodLine = paymentMethodName && channel !== 'sms'
    ? `\n\nMétodo disponível: ${paymentMethodName}`
    : '';

  const signatureText = includeSignature ? buildSignatureText(signature, accountName) : '';

  // Roteiro Presencial
  if (channel === 'in_person') {
    const steps = generateInPersonScript(context, tone, category);
    const summaryText = steps.map((s) => `${s.step}. ${s.title}: ${s.dialogue}`).join('\n\n');

    return {
      subject,
      body: summaryText,
      inPersonSteps: steps,
      variablesUsed: {
        nome: customerName,
        valor: formattedRemaining,
        referencia: invoiceNumber,
      },
      category,
      tone,
      channel,
      intent,
      versionLabel: 'Roteiro Presencial',
    };
  }

  // GERAÇÃO DE TEXTO PARA WHATSAPP / SMS / E-MAIL
  let body = '';
  const v = variationIndex % 3; // Suporte a 3 variações textuais distintas

  // 1. CANAL SMS (Mensagens curtas, limpas e objetivas)
  if (channel === 'sms') {
    if (category === 'before_due') {
      const vars = [
        `PAGORA: Lembrete da fatura ${invoiceNumber} (${formattedRemaining}) com vencimento a ${dueDateStr}.${paymentLinkLine}`,
        `Aviso: A fatura ${invoiceNumber} no valor de ${formattedRemaining} vence a ${dueDateStr}.${paymentLinkLine} Obrigado.`,
        `Lembrete de pagamento da fatura ${invoiceNumber} (${formattedRemaining}) com prazo em ${dueDateStr}.${paymentLinkLine}`,
      ];
      body = vars[v];
    } else if (category === 'due_date') {
      const vars = [
        `PAGORA: A fatura ${invoiceNumber} (${formattedRemaining}) atinge o vencimento hoje.${paymentLinkLine} Agradecemos o envio do comprovativo.`,
        `Lembrete: Vencimento hoje da fatura ${invoiceNumber} no valor de ${formattedRemaining}.${paymentLinkLine}`,
        `Aviso: A fatura ${invoiceNumber} (${formattedRemaining}) vence hoje. Agradecemos a regularização.${paymentLinkLine}`,
      ];
      body = vars[v];
    } else if (category === 'broken_promise') {
      const vars = [
        `Aviso: Não identificámos a regularização da fatura ${invoiceNumber} (${formattedRemaining}) prevista para ${promisedDateStr}. Agradecemos o envio do comprovativo.${paymentLinkLine}`,
        `Fatura ${invoiceNumber} (${formattedRemaining}): A data combinada (${promisedDateStr}) expirou. Agradecemos o contacto para confirmação.${paymentLinkLine}`,
        `PAGORA: Lembramos a fatura pendente ${invoiceNumber} (${formattedRemaining}). Pedimos a gentileza de regularizar.${paymentLinkLine}`,
      ];
      body = vars[v];
    } else if (daysOverdue > 0) {
      const vars = [
        `PAGORA: A fatura ${invoiceNumber} (${formattedRemaining}) encontra-se vencida desde ${dueDateStr}.${paymentLinkLine} Agradecemos a regularização.`,
        `Aviso de cobrança: Fatura ${invoiceNumber} no valor de ${formattedRemaining} pendente de liquidação.${paymentLinkLine}`,
        `Lembramos a fatura ${invoiceNumber} (${formattedRemaining}) com vencimento ultrapassado. Por favor envie o comprovativo.${paymentLinkLine}`,
      ];
      body = vars[v];
    } else if (category === 'payment_confirmation') {
      body = `Confirmamos a boa receção do pagamento da fatura ${invoiceNumber} (${formattedRemaining}). Muito obrigado pela colaboração!`;
    } else {
      body = `Lembrete: Fatura ${invoiceNumber} (${formattedRemaining}) pendente de pagamento.${paymentLinkLine} Obrigado.`;
    }

    return {
      subject,
      body: body.trim(),
      variablesUsed: {
        nome: customerName,
        valor: formattedRemaining,
        referencia: invoiceNumber,
        vencimento: dueDateStr,
      },
      category,
      tone,
      channel,
      intent,
      versionLabel: `Versão ${v + 1} (SMS)`,
    };
  }

  // 2. CANAL WHATSAPP & E-MAIL
  // Gerador de acordo com a Categoria & Tom
  switch (category) {
    case 'before_due': {
      if (v === 0) {
        body = `${greeting}\n\nEscrevemos apenas para partilhar o lembrete da fatura ${invoiceNumber}, no valor de ${formattedRemaining}, com data de vencimento prevista para ${dueDateStr}.${paymentMethodLine}${paymentLinkLine}\n\nFicamos inteiramente ao dispor caso necessite de algum esclarecimento adicional.${signatureText}`;
      } else if (v === 1) {
        body = `${greeting}\n\nGostaríamos de recordar que a fatura ${invoiceNumber} (${formattedRemaining}) tem vencimento agendado para o dia ${dueDateStr}.${paymentMethodLine}${paymentLinkLine}\n\nSe já tiver agendado a transferência, por favor desconsidere este aviso.${signatureText}`;
      } else {
        body = `${greeting}\n\nPartilhamos a informação de pagamento referente à fatura ${invoiceNumber} (${formattedRemaining}), com termo de prazo a ${dueDateStr}.${paymentMethodLine}${paymentLinkLine}\n\nObrigado pela vossa habitual atenção.${signatureText}`;
      }
      break;
    }

    case 'due_date': {
      if (v === 0) {
        body = `${greeting}\n\nGostaríamos de lembrar que a fatura ${invoiceNumber}, no montante de ${formattedRemaining}, atinge hoje a data de vencimento (${dueDateStr}).${paymentMethodLine}${paymentLinkLine}\n\nAgradecemos a gentileza do envio do respetivo comprovativo logo que efetuada a transferência.${signatureText}`;
      } else if (v === 1) {
        body = `${greeting}\n\nPassamos para recordar que vence hoje o prazo para liquidação da fatura ${invoiceNumber} (${formattedRemaining}).${paymentMethodLine}${paymentLinkLine}\n\nCaso já tenha procedido ao pagamento, pedimos que desconsidere esta mensagem.${signatureText}`;
      } else {
        body = `${greeting}\n\nInformamos que a fatura ${invoiceNumber} (${formattedRemaining}) tem vencimento no dia de hoje.${paymentMethodLine}${paymentLinkLine}\n\nFicamos a aguardar a confirmação da regularização.${signatureText}`;
      }
      break;
    }

    case 'overdue_first': {
      if (v === 0) {
        body = `${greeting}\n\nEsperamos que esteja tudo bem. Entramos em contacto para informar que a fatura ${invoiceNumber}, no valor de ${formattedRemaining}, atingiu o vencimento no passado dia ${dueDateStr}${includeOverdueDays && daysOverdue > 0 ? ` (há ${daysOverdue} dias)` : ''}.\n\nComo sabemos que podem ocorrer pequenos contratempos involuntários, gostaríamos apenas de confirmar se receberam os dados de liquidação.${paymentMethodLine}${paymentLinkLine}\n\nAgradecemos a vossa atenção e o envio do comprovativo assim que possível.${signatureText}`;
      } else if (v === 1) {
        body = `${greeting}\n\nVerificámos que a fatura ${invoiceNumber} (${formattedRemaining}) completou o prazo de vencimento a ${dueDateStr}.\n\nPoderiam, por favor, verificar a situação e confirmar a previsão para o envio do comprovativo?${paymentMethodLine}${paymentLinkLine}\n\nMuito obrigado pela colaboração.${signatureText}`;
      } else {
        body = `${greeting}\n\nRegistamos a fatura ${invoiceNumber} (${formattedRemaining}) como pendente desde ${dueDateStr}.${paymentMethodLine}${paymentLinkLine}\n\nAgradecemos a gentileza da regularização na primeira oportunidade.${signatureText}`;
      }
      break;
    }

    case 'cordial_reminder': {
      if (v === 0) {
        body = `${greeting}\n\nEsperamos que se encontrem bem. Escrevemos este breve lembrete relativamente à fatura ${invoiceNumber}, com o saldo pendente de ${formattedRemaining}.\n\nPara facilitar o processo, relembramos os dados para pagamento.${paymentMethodLine}${paymentLinkLine}\n\nFicamos ao dispor para qualquer apoio e agradecemos desde já a vossa disponibilidade.${signatureText}`;
      } else if (v === 1) {
        body = `${greeting}\n\nEntramos em contacto com o intuito de acompanhar o estado da fatura ${invoiceNumber} (${formattedRemaining}).\n\nCaso necessitem de uma segunda via ou de algum esclarecimento sobre os valores faturados, estamos inteiramente à disposição.${paymentMethodLine}${paymentLinkLine}\n\nCom os nossos melhores cumprimentos,${signatureText}`;
      } else {
        body = `${greeting}\n\nPartilhamos este lembrete cordial sobre a regularização da fatura ${invoiceNumber}, no montante de ${formattedRemaining}.${paymentMethodLine}${paymentLinkLine}\n\nAgradecemos a vossa preferência e colaboração habitual.${signatureText}`;
      }
      break;
    }

    case 'professional_collection': {
      if (v === 0) {
        body = `${greeting}\n\nSolicitamos a vossa melhor atenção para a regularização da fatura ${invoiceNumber}, no montante de ${formattedRemaining}, cujo vencimento ocorreu no dia ${dueDateStr}${includeOverdueDays && daysOverdue > 0 ? ` (${daysOverdue} dias em atraso)` : ''}.\n\nPara efeitos de equilíbrio de conta corrente e encerramento contabilístico, agradecemos a emissão do pagamento e a partilha do comprovativo.${paymentMethodLine}${paymentLinkLine}\n\nCertos da vossa atenção ao assunto, subscrevemo-nos atenciosamente.${signatureText}`;
      } else if (v === 1) {
        body = `${greeting}\n\nVimos por este meio solicitar a liquidação do valor pendente de ${formattedRemaining}, referente à fatura ${invoiceNumber} vencida a ${dueDateStr}.\n\nPoderão proceder ao pagamento através dos canais habituais.${paymentMethodLine}${paymentLinkLine}\n\nAgradecemos o envio do documento comprovativo com a brevidade que vos for possível.${signatureText}`;
      } else {
        body = `${greeting}\n\nReportamos a existência da fatura ${invoiceNumber} (${formattedRemaining}) em aberto, com prazo ultrapassado desde ${dueDateStr}.\n\nPedimos o favor de nos informarem a data prevista para a liquidação correspondente.${paymentMethodLine}${paymentLinkLine}\n\nAtenciosamente,${signatureText}`;
      }
      break;
    }

    case 'direct_collection': {
      if (v === 0) {
        body = `${greeting}\n\nA fatura ${invoiceNumber}, com o valor de ${formattedRemaining}, encontra-se vencida desde ${dueDateStr}${includeOverdueDays && daysOverdue > 0 ? ` (${daysOverdue} dias de atraso)` : ''}.\n\nSolicitamos a regularização do saldo e a partilha do comprovativo bancário na primeira oportunidade.${paymentMethodLine}${paymentLinkLine}\n\nCaso exista alguma questão pendente que impeça a liquidação, por favor informem-nos de imediato.${signatureText}`;
      } else if (v === 1) {
        body = `${greeting}\n\nInformamos que o valor de ${formattedRemaining} referente à fatura ${invoiceNumber} permanece por liquidar desde ${dueDateStr}.\n\nAgradecemos que procedam ao pagamento e nos enviem o respetivo comprovativo.${paymentMethodLine}${paymentLinkLine}\n\nObrigado.`;
      } else {
        body = `${greeting}\n\nLembramos que a fatura ${invoiceNumber} (${formattedRemaining}) está em atraso desde ${dueDateStr}.\n\nPedimos que confirmem a data exata da emissão da transferência.${paymentMethodLine}${paymentLinkLine}\n\nCumprimentos,${signatureText}`;
      }
      break;
    }

    case 'high_value': {
      body = `${greeting}\n\nEsperamos que esteja tudo a correr da melhor forma convosco.\n\nEntramos em contacto de forma prioritária sobre a fatura ${invoiceNumber}, no montante de ${formattedRemaining}, vencida a ${dueDateStr}.\n\nTratando-se de um valor com impacto significativo no planeamento da nossa tesouraria, solicitamos a vossa confirmação quanto ao agendamento da liquidação ou envio do comprovativo bancário.${paymentMethodLine}${paymentLinkLine}\n\nFicamos disponíveis para o que for necessário para facilitar este fecho.${signatureText}`;
      break;
    }

    case 'no_response': {
      body = `${greeting}\n\nNão tendo obtido retorno à nossa comunicação anterior, voltamos ao vosso contacto relativamente à fatura ${invoiceNumber}, no valor de ${formattedRemaining}, vencida a ${dueDateStr}.\n\nPara evitarmos constrangimentos adicionais e manter a conta corrente regularizada, solicitamos uma resposta breve com a data prevista para a conclusão do pagamento.${paymentMethodLine}${paymentLinkLine}\n\nAgradecemos a vossa atenção ao assunto.${signatureText}`;
      break;
    }

    case 'after_promise':
    case 'promise_reminder': {
      const promiseText = promisedDateStr ? `acordada para ${promisedDateStr}` : 'previamente acordada';
      body = `${greeting}\n\nEsperamos que se encontrem bem. Entramos em contacto para dar seguimento à data de pagamento ${promiseText}, referente à fatura ${invoiceNumber} (${formattedRemaining}).\n\nAgradecemos a gentileza do envio do respetivo comprovativo logo que a transferência seja efetuada.${paymentMethodLine}${paymentLinkLine}\n\nMuito obrigado pelo vosso compromisso e colaboração.${signatureText}`;
      break;
    }

    case 'broken_promise': {
      const promiseText = promisedDateStr ? `no passado dia ${promisedDateStr}` : 'na data acordada';
      body = `${greeting}\n\nEsperamos que esteja tudo bem. Entramos em contacto porque tínhamos registado a previsão de liquidação da fatura ${invoiceNumber} (${formattedRemaining}) ${promiseText}.\n\nComo não identificámos a entrada do valor nem a receção do comprovativo, gostaríamos de confirmar se surgiu algum imprevisto com a operação bancária.\n\nAgradecemos a vossa atualização para podermos atualizar a nossa gestão com uma nova data concreta.${paymentMethodLine}${paymentLinkLine}\n\nCom os melhores cumprimentos,${signatureText}`;
      break;
    }

    case 'last_friendly': {
      body = `${greeting}\n\nEsperamos que se encontre bem. Escrevemos este último lembrete amigável sobre a fatura ${invoiceNumber}, no valor de ${formattedRemaining}, que se encontra pendente desde ${dueDateStr}${includeOverdueDays && daysOverdue > 0 ? ` (${daysOverdue} dias)` : ''}.\n\nValorizamos muito a nossa relação profissional e gostaríamos genuinamente de resolver esta pendência de forma simples e direta, sem necessidade de procedimentos administrativos adicionais.\n\nPedimos que procedam à liquidação ou entrem em contacto connosco com urgência.${paymentMethodLine}${paymentLinkLine}\n\nCertos da vossa colaboração e compreensão,${signatureText}`;
      break;
    }

    case 'payment_confirmation': {
      body = `${greeting}\n\nConfirmamos com agrado a boa receção do pagamento referente à fatura ${invoiceNumber}, no montante de ${formattedRemaining}.\n\nA respetiva conta corrente encontra-se devidamente regularizada.\n\nAgradecemos a vossa preferência e a excelente cooperação de sempre.${signatureText}`;
      break;
    }

    case 'payment_proof_request': {
      body = `${greeting}\n\nEsperamos que se encontrem bem. Para procedermos à reconciliação da fatura ${invoiceNumber} (${formattedRemaining}), solicitamos o favor de nos remeterem o comprovativo de transferência bancária.\n\nLogo que o rececionarmos, daremos baixa imediata no nosso sistema.${signatureText}`;
      break;
    }

    case 'friend_acquaintance': {
      if (v === 0) {
        body = `Olá ${firstName}, tudo bem contigo?\n\nEscrevo-te com tranquilidade só para falar sobre aquele valor pendente de ${formattedRemaining}${invoiceNumber !== 'fatura' ? ` referente a ${invoiceNumber}` : ''}.\n\nQuando te der jeito nos próximos dias, dá para fazeres a transferência ou MB WAY para eu conseguir fechar as minhas contas deste mês?${paymentLinkLine}\n\nQualquer coisa avisa. Um abraço!`;
      } else {
        body = `Boas ${firstName}! Como estão as coisas por aí?\n\nPassava só para te lembrar do valor de ${formattedRemaining} que ficou pendente. Consegues ver isso com calma esta semana?${paymentLinkLine}\n\nObrigado pela força e um grande abraço!`;
      }
      break;
    }

    case 'company_client': {
      body = `Exmos. Senhores,\n\nAo cuidado do Departamento Financeiro / Contabilidade,\n\nSolicitamos a vossa análise relativamente à fatura ${invoiceNumber}, emitida a favor da vossa empresa, no montante global de ${formattedTotal} (saldo em aberto: ${formattedRemaining}), com vencimento ocorrido a ${dueDateStr}.\n\nAgradecemos a inclusão desta liquidação na vossa próxima remessa de pagamentos e a partilha do respetivo aviso de lançamento.${paymentMethodLine}${paymentLinkLine}\n\nSubscrevemo-nos com elevada consideração,${signatureText}`;
      break;
    }

    case 'individual_client': {
      body = `${greeting}\n\nEsperamos que se encontre bem. Partilhamos as informações atualizadas da sua fatura ${invoiceNumber}, no valor de ${formattedRemaining}.\n\nCaso tenha alguma dúvida sobre os serviços prestados ou formas de pagamento, estamos totalmente disponíveis para ajudar.${paymentMethodLine}${paymentLinkLine}\n\nCom os melhores cumprimentos,${signatureText}`;
      break;
    }

    case 'follow_up':
    default: {
      body = `${greeting}\n\nEsperamos que esteja tudo bem. Entramos em contacto para fazer um breve ponto de situação referente à fatura ${invoiceNumber} (${formattedRemaining}).\n\nAgradecemos a vossa atenção e confirmação da previsão de pagamento.${paymentMethodLine}${paymentLinkLine}\n\nCom os melhores cumprimentos,${signatureText}`;
      break;
    }
  }

  // Ajustes finos de tom no texto final
  if (tone === 'formal' && !body.includes('Exmo')) {
    body = body.replace(/Olá [^,]+,/, `Exmo.(a) Sr.(a) ${customerName},`);
  }

  return {
    subject,
    body: body.trim(),
    variablesUsed: {
      nome: customerName,
      empresa: customer?.name || '',
      valor: formattedTotal,
      saldo: formattedRemaining,
      vencimento: dueDateStr,
      dias_atraso: String(daysOverdue),
      referencia: invoiceNumber,
      link_pagamento: paymentLink,
      metodo_pagamento: paymentMethodName,
      data_prometida: promisedDateStr,
    },
    category,
    tone,
    channel,
    intent,
    versionLabel: `Versão ${v + 1} (${tone === 'cordial' ? 'Cordial' : tone === 'professional' ? 'Profissional' : tone === 'direct' ? 'Direto' : tone === 'formal' ? 'Formal' : 'Amigável'})`,
  };
}

/**
 * Substitui tags de variáveis customizadas como {{nome}}, {{valor}}, {{referencia}} num texto
 */
export function replaceCustomVariables(
  templateText: string,
  variables: Record<string, string>
): string {
  let result = templateText;

  // Substituição de todas as variáveis suportadas
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, variables[key] || '');
  });

  // Limpeza de variáveis residuais que não foram preenchidas para não deixar tags vazias
  result = result.replace(/\{\{[a-zA-Z0-9_-]+\}\}/g, '');

  return result.trim();
}
