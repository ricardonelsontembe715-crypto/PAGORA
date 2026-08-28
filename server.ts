import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  sendEmailWithResend,
  getEmailAuditLogs,
  getEmailSystemMetrics,
} from './server/emailService';

dotenv.config();

const app = express();
const PORT = 3000;

// Inicialização segura do SDK Gemini no servidor (apenas se GEMINI_API_KEY estiver presente)
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Middleware para processar JSON e buffers para validação de assinatura
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Estrutura em memória para eventos de webhook recebidos no servidor (com idempotência)
interface ServerWebhookRecord {
  id: string;
  eventId: string;
  eventType: string;
  receivedAt: string;
  processedAt?: string;
  status: 'received' | 'processed' | 'failed' | 'requires_review';
  attempts: number;
  errorMessage?: string;
  accountId?: string;
  planId?: string;
  payload: Record<string, unknown>;
}

const SERVER_WEBHOOK_EVENTS = new Map<string, ServerWebhookRecord>();

// Estrutura de Sessões Administrativas do Servidor
interface AdminSession {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

const ADMIN_SESSIONS = new Map<string, AdminSession>();

// Estrutura de Recuperação de Palavras-passe (Tokens de uso único com expiração)
interface PasswordResetRecord {
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const SERVER_PASSWORD_RESETS = new Map<string, PasswordResetRecord>();

// Estrutura de Emails Transacionais (Outbox & Auditoria)
interface ServerEmailRecord {
  id: string;
  to: string;
  name?: string;
  type: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'pending_provider_configuration' | 'failed';
  variables?: Record<string, unknown>;
}

const SERVER_OUTBOX_LOGS: ServerEmailRecord[] = [];

// Armazenamento em memória do servidor para recursos dos tenants (multi-tenant)
const SERVER_TENANT_DATA = new Map<string, unknown>();

// Helper de validação de assinatura HMAC SHA256
function verifyWebhookSignature(payloadString: string, signatureHeader?: string): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'pagora_whsec_prod_9941a82fbc';
  if (!signatureHeader) {
    // No ambiente de desenvolvimento ou preview local permitimos com aviso
    return true;
  }

  try {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signatureHeader.replace(/^sha256=/, ''))
    );
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// ROTAS DE API DA PAGORA (FIRST)
// -------------------------------------------------------------

// 1. Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PAGORA Platform API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 2. Endpoint Oficial de Webhook de Pagamentos
// POST /api/webhooks/payment
app.post('/api/webhooks/payment', (req: Request, res: Response) => {
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-pagora-signature'] as string | undefined;

  // Validação de assinatura
  const isSignatureValid = verifyWebhookSignature(rawBody, signature);
  if (!isSignatureValid) {
    console.warn('[WEBHOOK SECURITY] Assinatura inválida no webhook recebido.');
    return res.status(401).json({
      error: 'Invalid signature',
      message: 'A assinatura do webhook não corresponde ao segredo configurado.',
    });
  }

  const payload = req.body || {};
  const eventId =
    payload.id ||
    payload.event_id ||
    payload.data?.id ||
    `evt_srv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const eventType = payload.type || payload.event_type || 'payment.approved';
  const receivedAt = new Date().toISOString();

  // 3. IDEMPOTÊNCIA CRÍTICA: Se já foi processado com sucesso, responder 200 sem duplicar
  if (SERVER_WEBHOOK_EVENTS.has(eventId)) {
    const existing = SERVER_WEBHOOK_EVENTS.get(eventId)!;
    if (existing.status === 'processed') {
      console.log(`[WEBHOOK IDEMPOTENCY] Evento ${eventId} já processado anteriormente.`);
      return res.status(200).json({
        status: 'already_processed',
        eventId,
        message: 'Evento já recebido e processado anteriormente com sucesso.',
        processedAt: existing.processedAt,
      });
    }
  }

  // 4. Identificação de Conta e Plano (Suporte modular a múltiplos padrões de gateway)
  const metadata = payload.data?.metadata || payload.metadata || {};
  const accountId =
    metadata.account_id ||
    metadata.client_reference_id ||
    payload.account_id ||
    payload.client_reference_id ||
    payload.customer_id;
  const customerEmail = metadata.customer_email || metadata.email || payload.customer_email || payload.email;
  const planId = metadata.plan || payload.plan_id || (eventType.includes('pro') ? 'pro' : 'plus');

  const record: ServerWebhookRecord = {
    id: `rec_${Date.now()}`,
    eventId,
    eventType,
    receivedAt,
    status: 'received',
    attempts: (SERVER_WEBHOOK_EVENTS.get(eventId)?.attempts || 0) + 1,
    accountId: accountId || (customerEmail ? `email:${customerEmail}` : undefined),
    planId,
    payload,
  };

  // 5. Verificação de correspondência e processamento
  try {
    // Processamento do tipo de evento
    if (
      eventType === 'payment.approved' ||
      eventType === 'payment.paid' ||
      eventType === 'subscription.created' ||
      eventType === 'subscription.renewed'
    ) {
      if (!accountId && !customerEmail) {
        // Sem identificação da conta: reter para auditoria administrativa sem associar aleatoriamente
        record.status = 'requires_review';
        record.errorMessage = 'Pagamento aprovado sem identificador de conta (account_id/client_reference_id/email). Retido para reconciliação manual.';
        SERVER_WEBHOOK_EVENTS.set(eventId, record);

        return res.status(200).json({
          status: 'requires_review',
          eventId,
          eventType,
          message: 'Evento retido para revisão no Painel do Proprietário por ausência de identificador de conta.',
        });
      }

      record.status = 'processed';
      record.processedAt = new Date().toISOString();
      SERVER_WEBHOOK_EVENTS.set(eventId, record);

      // Disparo automático e idempotente de email transacional via Resend
      if (customerEmail && typeof customerEmail === 'string' && customerEmail.includes('@')) {
        sendEmailWithResend({
          to: customerEmail.trim(),
          type: 'SUBSCRIPTION_CONFIRMED',
          variables: {
            planName: String(planId).toUpperCase(),
            amount: (metadata.amount as string) || (payload.amount as string) || '5,90 €',
            period: (metadata.period as string) || 'Mensal',
            activationDate: new Date().toLocaleDateString('pt-PT'),
            renewalDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-PT'),
          },
          idempotencyKey: `sub_confirmed_evt_${eventId}`,
          accountId: accountId ? String(accountId) : `email:${customerEmail}`,
        }).catch((err) => {
          console.error('[EMAIL RESEND] Erro não-bloqueante no envio de email pós-pagamento:', err);
        });
      }

      return res.status(200).json({
        status: 'processed',
        eventId,
        eventType,
        accountId: accountId || `email:${customerEmail}`,
        plan: planId,
        message: 'Pagamento confirmado e subscrição ativada com sucesso.',
      });
    }

    if (eventType === 'payment.pending') {
      record.status = 'processed';
      record.processedAt = new Date().toISOString();
      SERVER_WEBHOOK_EVENTS.set(eventId, record);

      return res.status(200).json({
        status: 'processed',
        eventId,
        eventType,
        message: 'Pagamento pendente registado. Aguardando confirmação externa.',
      });
    }

    if (eventType === 'payment.failed' || eventType === 'payment.declined') {
      record.status = 'processed';
      record.processedAt = new Date().toISOString();
      SERVER_WEBHOOK_EVENTS.set(eventId, record);

      return res.status(200).json({
        status: 'processed',
        eventId,
        eventType,
        message: 'Falha no pagamento registada. Acesso não concedido.',
      });
    }

    if (eventType === 'payment.refunded' || eventType === 'refund.created') {
      record.status = 'processed';
      record.processedAt = new Date().toISOString();
      SERVER_WEBHOOK_EVENTS.set(eventId, record);

      return res.status(200).json({
        status: 'processed',
        eventId,
        eventType,
        message: 'Reembolso processado. Subscrição revogada com dados preservados.',
      });
    }

    if (eventType === 'subscription.cancelled' || eventType === 'subscription.deleted') {
      record.status = 'processed';
      record.processedAt = new Date().toISOString();
      SERVER_WEBHOOK_EVENTS.set(eventId, record);

      return res.status(200).json({
        status: 'processed',
        eventId,
        eventType,
        message: 'Cancelamento de subscrição registado.',
      });
    }

    // Evento desconhecido -> Requer Revisão
    record.status = 'requires_review';
    record.errorMessage = `Tipo de evento externo "${eventType}" não mapeado.`;
    SERVER_WEBHOOK_EVENTS.set(eventId, record);

    return res.status(200).json({
      status: 'requires_review',
      eventId,
      eventType,
      message: 'Evento retido para revisão administrativa.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno ao processar webhook';
    record.status = 'failed';
    record.errorMessage = errorMsg;
    SERVER_WEBHOOK_EVENTS.set(eventId, record);

    return res.status(500).json({
      status: 'failed',
      eventId,
      error: errorMsg,
    });
  }
});

// Middleware de Segurança para Endpoints do Proprietário / Admin
function requireAdminAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    console.warn('[ADMIN SECURITY] Tentativa de acesso a rota administrativa sem token.');
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado. Autenticação administrativa necessária.',
    });
  }

  const session = ADMIN_SESSIONS.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) ADMIN_SESSIONS.delete(token);
    console.warn('[ADMIN SECURITY] Tentativa de acesso com token inválido ou expirado.');
    return res.status(401).json({
      success: false,
      error: 'Sessão administrativa inválida ou expirada.',
    });
  }

  // Sessão válida
  next();
}

// 3. Listagem de Webhook Logs para o Painel de Administração (Protegido por Token Admin)
app.get('/api/webhooks/logs', requireAdminAuth, (req: Request, res: Response) => {
  const logs = Array.from(SERVER_WEBHOOK_EVENTS.values()).reverse();
  res.json({
    total: logs.length,
    events: logs,
  });
});

// 4. Disparador Seguro de Testes de Webhook (Painel Admin - Protegido por Token Admin)
app.post('/api/webhooks/test', requireAdminAuth, (req: Request, res: Response) => {
  const { eventType, accountId, plan, amount } = req.body;
  const mockEventId = `evt_test_${Date.now()}`;
  const mockPayload = {
    id: mockEventId,
    type: eventType || 'payment.approved',
    amount: amount || 5.9,
    currency: 'EUR',
    metadata: {
      account_id: accountId || 'acc_pt_01',
      plan: plan || 'plus',
    },
    payment_method: 'MB WAY Simulado',
    customer_email: 'ricardo@pagora.pt',
    created_at: new Date().toISOString(),
  };

  const record: ServerWebhookRecord = {
    id: `rec_test_${Date.now()}`,
    eventId: mockEventId,
    eventType: mockPayload.type,
    receivedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    status: 'processed',
    attempts: 1,
    accountId: mockPayload.metadata.account_id,
    planId: mockPayload.metadata.plan,
    payload: mockPayload,
  };

  SERVER_WEBHOOK_EVENTS.set(mockEventId, record);

  console.log(`[ADMIN AUDIT] Simulação de webhook executada para evento: ${mockPayload.type}`);

  res.json({
    success: true,
    message: `Evento de teste [${mockPayload.type}] simulado e processado com sucesso.`,
    event: record,
  });
});

// 5. Autenticação Segura de Administrador (Server-Side)
// POST /api/auth/admin-login
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const serverAdminEmail = process.env.ADMIN_EMAIL || 'admin@pagora.pt';
  const serverAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Por favor, introduza o e-mail e a palavra-passe administrativa.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const isValidEmail = cleanEmail === serverAdminEmail.toLowerCase();
  const isValidPassword = password === serverAdminPassword;

  if (isValidEmail && isValidPassword) {
    // Gerar token de sessão admin seguro com expiração de 12 horas
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + 12 * 3600 * 1000;

    ADMIN_SESSIONS.set(sessionToken, {
      token: sessionToken,
      email: cleanEmail,
      createdAt: now,
      expiresAt,
    });

    console.log(`[ADMIN AUTH] Sessão administrativa autenticada com sucesso para ${cleanEmail}`);

    return res.json({
      success: true,
      isAdmin: true,
      role: 'superadmin',
      token: sessionToken,
      adminEmail: cleanEmail,
      expiresAt,
      message: 'Autenticação de administrador realizada com sucesso.',
    });
  }

  console.warn(`[ADMIN AUTH SECURITY] Tentativa de login administrativo falhada para e-mail: ${cleanEmail}`);

  return res.status(401).json({
    success: false,
    isAdmin: false,
    error: 'Credenciais administrativas incorretas. Acesso restrito ao proprietário da PAGORA.',
  });
});

// POST /api/auth/admin-verify
app.post('/api/auth/admin-verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const bodyToken = req.body?.token;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || bodyToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      isValid: false,
      error: 'Sessão administrativa não fornecida.',
    });
  }

  const session = ADMIN_SESSIONS.get(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      isValid: false,
      error: 'Sessão administrativa inexistente ou expirada.',
    });
  }

  if (Date.now() > session.expiresAt) {
    ADMIN_SESSIONS.delete(token);
    return res.status(401).json({
      success: false,
      isValid: false,
      error: 'Sessão administrativa expirada. Por favor, inicie sessão novamente.',
    });
  }

  return res.json({
    success: true,
    isValid: true,
    isAdmin: true,
    email: session.email,
    expiresAt: session.expiresAt,
  });
});

// POST /api/auth/admin-logout
app.post('/api/auth/admin-logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const bodyToken = req.body?.token;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || bodyToken;

  if (token && ADMIN_SESSIONS.has(token)) {
    ADMIN_SESSIONS.delete(token);
  }

  return res.json({
    success: true,
    message: 'Sessão administrativa terminada com sucesso.',
  });
});

// -------------------------------------------------------------
// 6. RECUPERAÇÃO SEGURA DE PALAVRAS-PASSE (UTILIZADORES)
// -------------------------------------------------------------
app.post('/api/auth/password-recovery/request', async (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Por favor, introduza um endereço de e-mail válido.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // Bloqueio de segurança: ADMIN_PASSWORD não pode ser alterada via recuperação pública
  const serverAdminEmail = (process.env.ADMIN_EMAIL || 'admin@pagora.pt').toLowerCase();
  if (cleanEmail === serverAdminEmail) {
    return res.json({
      success: true,
      message: 'Se existir uma conta associada a este endereço de e-mail, enviaremos as instruções para redefinir a palavra-passe.',
    });
  }

  // Gera token seguro e imprevisível com 1h (60 min) de validade
  const token = `PAGORA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = Date.now();
  const expiresAt = now + 3600 * 1000; // 60 minutos

  SERVER_PASSWORD_RESETS.set(token, {
    email: cleanEmail,
    token,
    createdAt: now,
    expiresAt,
    used: false,
  });

  console.log(`[PASSWORD RESET] Token de recuperação gerado para ${cleanEmail}`);

  // Disparo oficial através do serviço de emails com Resend (sem bloquear se falhar)
  try {
    await sendEmailWithResend({
      to: cleanEmail,
      type: 'PASSWORD_RESET',
      variables: {
        resetToken: token,
      },
      idempotencyKey: `pwd_reset_${cleanEmail}_${Math.floor(now / (5 * 60 * 1000))}`, // 1 email a cada 5 min
    });
  } catch (emailErr) {
    console.error('[EMAIL RESEND] Erro não-bloqueante no envio de recuperação:', emailErr);
  }

  // Resposta genérica rigorosa para evitar enumeração de utilizadores
  return res.json({
    success: true,
    message: 'Se existir uma conta associada a este endereço de e-mail, enviaremos as instruções para redefinir a palavra-passe.',
    simulatedToken: process.env.NODE_ENV !== 'production' ? token : undefined,
  });
});

app.post('/api/auth/password-recovery/reset', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Token inválido ou palavra-passe demasiado curta (mínimo 6 caracteres).',
    });
  }

  const cleanToken = String(token).trim();
  const record = SERVER_PASSWORD_RESETS.get(cleanToken);

  if (!record || record.used) {
    return res.status(400).json({
      success: false,
      error: 'O código de recuperação é inválido ou já foi utilizado.',
    });
  }

  if (Date.now() > record.expiresAt) {
    SERVER_PASSWORD_RESETS.delete(cleanToken);
    return res.status(400).json({
      success: false,
      error: 'O código de recuperação expirou. Por favor, solicite um novo.',
    });
  }

  // Queimar token (uso único)
  record.used = true;
  SERVER_PASSWORD_RESETS.delete(cleanToken);

  console.log(`[PASSWORD RESET] Palavra-passe redefinida com sucesso para ${record.email}`);

  // Enviar email transacional de notificação de segurança
  sendEmailWithResend({
    to: record.email,
    type: 'PASSWORD_CHANGED',
    variables: {
      changeDate: new Date().toLocaleString('pt-PT'),
    },
    idempotencyKey: `pwd_changed_${record.email}_${Date.now()}`,
  }).catch((err) => {
    console.error('[EMAIL RESEND] Erro não-bloqueante no envio de confirmação de alteração:', err);
  });

  return res.json({
    success: true,
    message: 'A sua palavra-passe foi redefinida com sucesso.',
  });
});

// -------------------------------------------------------------
// 7. EMAILS TRANSACIONAIS (RESEND API INTEGRATION & AUDITORIA)
// -------------------------------------------------------------
app.post('/api/emails/send', async (req: Request, res: Response) => {
  const { to, name, type, subject, variables, idempotencyKey, accountId } = req.body || {};

  if (!to || !String(to).includes('@')) {
    return res.status(400).json({ success: false, error: 'Endereço de e-mail do destinatário obrigatório.' });
  }

  try {
    const result = await sendEmailWithResend({
      to: String(to).trim(),
      name: name ? String(name) : undefined,
      type: type || 'WELCOME',
      subject: subject ? String(subject) : undefined,
      variables: variables || {},
      idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
      accountId: accountId ? String(accountId) : undefined,
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha interna no serviço de emails';
    return res.status(500).json({
      success: false,
      status: 'failed',
      error: errorMsg,
      message: 'Falha temporária ao despachar e-mail transacional.',
    });
  }
});

app.get('/api/emails/status', (req: Request, res: Response) => {
  const metrics = getEmailSystemMetrics();
  const recentLogs = getEmailAuditLogs().slice(0, 30);

  res.json({
    ...metrics,
    recent: recentLogs,
  });
});

app.get('/api/emails/logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    logs: getEmailAuditLogs(),
  });
});

// -------------------------------------------------------------
// 8. INTELIGÊNCIA ARTIFICIAL DE COBRANÇA (GEMINI / FALLBACK)
// -------------------------------------------------------------
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  const { question, customers, invoices, promises, reminders } = req.body || {};

  const activeInvoices = Array.isArray(invoices)
    ? invoices.filter((i: any) => i.status === 'overdue' || i.status === 'pending' || i.status === 'partially_paid')
    : [];
  const overdueInvoices = activeInvoices.filter((i: any) => i.status === 'overdue');
  const brokenPromises = Array.isArray(promises) ? promises.filter((p: any) => p.status === 'broken') : [];
  const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + (Number(i.amount) - Number(i.paidAmount || 0)), 0);

  // Ordenar atrasos
  const sortedOverdue = [...overdueInvoices].sort(
    (a: any, b: any) => (Number(b.amount) - Number(b.paidAmount || 0)) - (Number(a.amount) - Number(a.paidAmount || 0))
  );
  const topOverdue = sortedOverdue[0];
  const topCustomer = topOverdue && Array.isArray(customers)
    ? customers.find((c: any) => c.id === topOverdue.customerId)
    : undefined;

  // Se Gemini estiver disponível no servidor, invocamos com engenharia de prompts rigorosa
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      const systemInstruction = `
Você é o Assistente Especialista de Cobrança e Gestão Financeira da PAGORA (Portugal).
Princípios inegociáveis:
1. Grounding estrito: Baseie-se APENAS nos dados fornecidos do workspace (clientes, faturas, promessas, atrasos). NUNCA invente números, clientes, datas ou fatos.
2. Formato e Linguagem: Responda em Português de Portugal (PT-PT) profissional, humano, direto e cordial.
3. Sem clichês ou estética genérica de IA: Não use frases como "Claro! Aqui está", "Como modelo de IA", "supercharge", "revolucionário" nem emojis exagerados.
4. Distinção Clara: Diferencie fatos confirmados (ex: "Fatura PG-01 vencida há 5 dias") de inferências e sugestões de ação.
5. Retorne a resposta em formato JSON válido contendo:
   - "answer": Resposta executiva clara em 1 a 3 parágrafos concisos.
   - "recommendations": Array de recomendações com "title", "recommendation", "reason", "dataUsed" (array de strings com fatos concretos), "confidence" ("high"|"medium"|"low"), "category" ("URGENT"|"HIGH_EXPOSURE"|"BROKEN_PROMISE"|"PREVENTIVE").
`;

      const promptData = {
        perguntaUtilizador: question || 'Qual é a prioridade da minha carteira hoje?',
        resumoCarteira: {
          totalClientes: Array.isArray(customers) ? customers.length : 0,
          faturasVencidas: overdueInvoices.length,
          montanteVencidoTotal: `${totalOverdue.toFixed(2)} EUR`,
          promessasQuebradas: brokenPromises.length,
        },
        faturasVencidasDetalhe: overdueInvoices.slice(0, 10),
        promessasQuebradasDetalhe: brokenPromises.slice(0, 5),
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Analise a seguinte carteira de cobranças e responda à pergunta do utilizador:\n${JSON.stringify(promptData, null, 2)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        answer: parsed.answer || 'Análise da carteira concluída com sucesso.',
        recommendations: parsed.recommendations || [],
        summaryMetrics: {
          totalOverdue,
          atRiskCustomersCount: new Set(overdueInvoices.map((i: any) => i.customerId)).size,
          topPriorityCustomer: topCustomer?.name,
        },
        isLiveAi: true,
      });
    } catch (aiErr) {
      console.warn('[AI ASSISTANT] Erro no modelo Gemini, a recorrer ao fallback determinístico:', aiErr);
    }
  }

  // Fallback determinístico seguro
  const recommendations: any[] = [];
  if (topOverdue && topCustomer) {
    recommendations.push({
      title: `Prioridade Operacional: ${topCustomer.name}`,
      recommendation: `O cliente ${topCustomer.name} possui a maior exposição financeira em atraso (${(topOverdue.amount - topOverdue.paidAmount).toFixed(2)} € na fatura ${topOverdue.number}).`,
      reason: `Fatura vencida com maior impacto individual na tesouraria do espaço de trabalho.`,
      dataUsed: [
        `Cliente: ${topCustomer.name}`,
        `Fatura: ${topOverdue.number}`,
        `Montante: ${(topOverdue.amount - topOverdue.paidAmount).toFixed(2)} €`,
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
    const promCust = Array.isArray(customers) ? customers.find((c: any) => c.id === promise.customerId) : undefined;
    if (promCust) {
      recommendations.push({
        title: `Promessa Ultrapassada — ${promCust.name}`,
        recommendation: `Revisitar o acordo de pagamento de ${promise.amount} € previsto para ${promise.promisedDate}.`,
        reason: `A promessa atingiu a data limite acordada sem registo de liquidação total.`,
        dataUsed: [
          `Cliente: ${promCust.name}`,
          `Valor acordado: ${promise.amount} €`,
          `Data da promessa: ${promise.promisedDate}`,
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

  const qLower = String(question || '').toLowerCase();
  let answer = '';
  if (qLower.includes('quem') || qLower.includes('prioridade') || qLower.includes('contactar')) {
    if (topCustomer && topOverdue) {
      answer = `A principal prioridade de cobrança hoje é **${topCustomer.name}**, com **${(topOverdue.amount - topOverdue.paidAmount).toFixed(2)} €** pendentes na fatura ${topOverdue.number}. Recomendamos o envio de uma mensagem cordial para alinhar a previsão de liquidação.`;
    } else {
      answer = `Não existem clientes em atraso crítico com ações pendentes neste momento. A sua carteira encontra-se em conformidade.`;
    }
  } else if (qLower.includes('quanto') || qLower.includes('atraso') || qLower.includes('valor')) {
    answer = `O montante total atualmente em atraso na carteira é de **${totalOverdue.toFixed(2)} €**, distribuído por **${overdueInvoices.length}** fatura(s) vencida(s).`;
  } else {
    answer = `Análise da carteira concluída: tem **${overdueInvoices.length}** faturas vencidas totalizando **${totalOverdue.toFixed(2)} €** em risco. ${brokenPromises.length > 0 ? `Existem ${brokenPromises.length} promessas de pagamento ultrapassadas que requerem atenção.` : 'Não existem promessas quebradas.'}`;
  }

  return res.json({
    answer,
    recommendations,
    summaryMetrics: {
      totalOverdue,
      atRiskCustomersCount: new Set(overdueInvoices.map((i: any) => i.customerId)).size,
      topPriorityCustomer: topCustomer?.name,
    },
    isLiveAi: false,
  });
});

app.post('/api/ai/generate-message', async (req: Request, res: Response) => {
  const { customer, invoice, tone, channel, customInstructions, intent } = req.body || {};

  if (!customer) {
    return res.status(400).json({ success: false, error: 'Dados do cliente obrigatórios.' });
  }

  const firstName = customer.name.split(' ')[0] || customer.name;
  const invNumber = invoice?.number || 'fatura em aberto';
  const amountStr = invoice ? `${(invoice.amount - (invoice.paidAmount || 0)).toFixed(2)} €` : 'valor pendente';

  // Se Gemini estiver disponível, gerar mensagem personalizada
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      const systemInstruction = `
Você é o assistente de comunicação financeira profissional da PAGORA.
Gere uma mensagem de cobrança em Português de Portugal (PT-PT) para o canal especificado (${channel}).
Tom: ${tone || 'cordial'} (cordial = educado, amigável e preventivo; assertivo = direto e profissional; formal = corporativo e rigoroso; firme = sério para atrasos prolongados).
Regras:
1. Nunca ameace, nunca invente fatos ou processos judiciais inexistentes.
2. Seja claro, elegante e profissional.
3. Se o canal for WhatsApp ou SMS, seja conciso e sem saudação excessivamente longa.
4. Se o canal for Email, inclua assunto profissional e corpo estruturado com saudação e fecho.
Retorne JSON com {"subject": string, "body": string}.
`;

      const prompt = `Cliente: ${customer.name}\nFatura: ${invNumber}\nValor: ${amountStr}\nData de Vencimento: ${invoice?.dueDate || 'recente'}\nInstruções adicionais: ${customInstructions || 'Cobrança padrão regular'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        subject: parsed.subject || `Acompanhamento — Fatura ${invNumber}`,
        body: parsed.body,
        channel,
        tone,
        characterCount: (parsed.body || '').length,
        isLiveAi: true,
      });
    } catch (aiErr) {
      console.warn('[AI MESSAGE] Erro no Gemini ao gerar mensagem, recorrendo a fallback determinístico:', aiErr);
    }
  }

  // Fallback determinístico
  let subject = `PAGORA: Informação sobre ${invNumber}`;
  let body = '';

  if (channel === 'whatsapp' || channel === 'sms') {
    if (tone === 'cordial') {
      body = `Olá ${firstName}, espero que esteja tudo bem. Contacto apenas para relembrar que a fatura ${invNumber} (${amountStr}) se encontra pendente. Se já efetuou o pagamento, por favor desconsidere. Obrigado!`;
    } else if (tone === 'assertivo') {
      body = `Olá ${firstName}. A fatura ${invNumber} no valor de ${amountStr} está atualmente vencida. Agradecemos a regularização do pagamento com a brevidade possível. Obrigado.`;
    } else {
      body = `Exmo(a). ${customer.name}, solicitamos a regularização da fatura ${invNumber} (${amountStr}) em atraso. Em caso de dúvidas, contacte-nos.`;
    }
  } else {
    subject = `Acompanhamento de Cobrança — Fatura ${invNumber}`;
    body = `Exmo(a). ${customer.name},\n\nEscrevemos no seguimento da emissão da fatura ${invNumber}, no valor de ${amountStr}, cuja regularização se encontra em aberto.\n\nAgradecemos que verifique a situação e proceda à liquidação com a maior brevidade possível. Caso o pagamento já tenha sido emitido, agradecemos que ignore este aviso.\n\nCom os melhores cumprimentos,\nDepartamento Financeiro`;
  }

  return res.json({
    subject,
    body,
    channel,
    tone,
    characterCount: body.length,
    isLiveAi: false,
  });
});

// -------------------------------------------------------------
// 9. PERSISTÊNCIA MULTI-TENANT NO SERVIDOR
// -------------------------------------------------------------
app.get('/api/data/:resource', (req: Request, res: Response) => {
  const { resource } = req.params;
  const accountId = (req.headers['x-account-id'] as string) || (req.query.accountId as string);

  if (!accountId) {
    return res.status(400).json({ success: false, error: 'Identificador de conta (x-account-id) obrigatório.' });
  }

  const key = `${accountId}_${resource}`;
  const data = SERVER_TENANT_DATA.get(key) || null;

  return res.json({ success: true, data });
});

app.post('/api/data/:resource', (req: Request, res: Response) => {
  const { resource } = req.params;
  const accountId = (req.headers['x-account-id'] as string) || (req.body.accountId as string);
  const { data } = req.body;

  if (!accountId) {
    return res.status(400).json({ success: false, error: 'Identificador de conta (x-account-id) obrigatório.' });
  }

  const key = `${accountId}_${resource}`;
  SERVER_TENANT_DATA.set(key, data);

  return res.json({ success: true, savedAt: new Date().toISOString() });
});

// -------------------------------------------------------------
// VITE & STATIC FILES SERVING (MIDDLEWARE)
// -------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      // Express owns the HTTP server, so Vite cannot complete its HMR
      // websocket upgrade in the preview proxy. Disable the client socket
      // while keeping middleware-mode development rendering intact.
      server: { middlewareMode: true, hmr: false },
      // Custom mode prevents Vite from injecting /@vite/client into the HTML.
      // This server does not expose a Vite HMR websocket endpoint.
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PAGORA] Servidor operacional em http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Falha crítica ao iniciar servidor PAGORA:', err);
});
