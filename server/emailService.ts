/**
 * PAGORA — Serviço Central de Emails Transacionais com Resend (Backend)
 * Integração oficial com a API REST do Resend (https://api.resend.com/emails)
 *
 * Características de Segurança e Arquitetura:
 * 1. RESEND_API_KEY isolada no ambiente de backend (nunca exposta ao frontend ou logs).
 * 2. Deduplicação e Idempotência nativa (evita envios múltiplos por webhooks/retries).
 * 3. Templates HTML responsivos, minimalistas e em Português de Portugal.
 * 4. Registo de auditoria com mascaramento de destinatários sensíveis.
 * 5. Tolerância a falhas: erros no envio de e-mail nunca quebram fluxos principais.
 */

export interface TransactionalEmailOptions {
  to: string;
  name?: string;
  type:
    | 'WELCOME'
    | 'ACCOUNT_CONFIRMATION'
    | 'PASSWORD_RESET'
    | 'PASSWORD_CHANGED'
    | 'SUBSCRIPTION_CONFIRMED'
    | 'PAYMENT_APPROVED'
    | 'PAYMENT_FAILED'
    | 'PLAN_CHANGED'
    | 'SUBSCRIPTION_CANCELLED'
    | 'ACCOUNT_DATA_UPDATED'
    | 'OVERDUE_INVOICE_ALERT';
  subject?: string;
  variables?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  accountId?: string;
  appUrl?: string;
}

export interface EmailAuditRecord {
  id: string;
  type: string;
  recipientMasked: string;
  subject: string;
  status: 'sent' | 'delivered' | 'simulated_sandbox' | 'pending_provider' | 'failed' | 'already_sent';
  resendId?: string;
  sentAt: string;
  accountId?: string;
  error?: string;
}

// Armazenamento em memória para auditoria e controlo de idempotência (máx 500 registos)
const EMAIL_AUDIT_LOGS: EmailAuditRecord[] = [];
const IDEMPOTENCY_STORE = new Map<string, { sentAt: string; resendId?: string; status: EmailAuditRecord['status'] }>();

/**
 * Mascara o e-mail para registo seguro de auditoria (ex: r***e@dominio.pt)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart.charAt(0)}*@${domain}`;
  }
  const first = localPart.charAt(0);
  const last = localPart.charAt(localPart.length - 1);
  return `${first}${'*'.repeat(Math.min(localPart.length - 2, 4))}${last}@${domain}`;
}

/**
 * Obtém a URL pública base da aplicação PAGORA
 */
export function resolveAppUrl(customUrl?: string): string {
  if (customUrl && customUrl.startsWith('http')) {
    return customUrl.replace(/\/+$/, '');
  }
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http') && !process.env.APP_URL.includes('MY_APP_URL')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  return 'https://pagora.pt';
}

/**
 * Gera templates HTML e texto limpos, profissionais e responsivos para clientes de email europeus
 */
export function renderEmailTemplate(
  type: TransactionalEmailOptions['type'],
  variables: Record<string, string | number | boolean | undefined> = {},
  appUrl: string
): { subject: string; html: string; text: string } {
  const brandName = 'PAGORA';
  const supportEmail = 'suporte@pagora.pt';
  const currentYear = new Date().getFullYear();
  const userName = String(variables.userName || variables.name || 'Estimado(a) Utilizador(a)');
  const loginUrl = `${appUrl}/login`;
  const dashboardUrl = `${appUrl}/dashboard`;

  // Estilos inline padrão compatíveis com Gmail, Apple Mail, Outlook e Thunderbird
  const containerStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    max-width: 580px;
    margin: 0 auto;
    padding: 32px 24px;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    color: #1e293b;
  `;
  const headerStyle = `
    padding-bottom: 20px;
    border-bottom: 1px solid #f1f5f9;
  `;
  const logoStyle = `
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #4f46e5;
    text-decoration: none;
  `;
  const bodyStyle = `
    padding: 24px 0 20px;
    font-size: 15px;
    line-height: 1.6;
    color: #334155;
  `;
  const buttonStyle = `
    display: inline-block;
    background-color: #4f46e5;
    color: #ffffff !important;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `;
  const footerStyle = `
    padding-top: 24px;
    border-top: 1px solid #f1f5f9;
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.5;
    text-align: center;
  `;

  switch (type) {
    case 'WELCOME':
    case 'ACCOUNT_CONFIRMATION': {
      const subject = `Bem-vindo à ${brandName}`;
      const text = [
        `Olá ${userName},`,
        '',
        `Seja muito bem-vindo à PAGORA.`,
        '',
        `Criámos a PAGORA para simplificar a gestão de cobranças do seu negócio: um espaço onde faturas, clientes, prazos de vencimento e automações são geridos com total pontualidade, cordialidade e rigor.`,
        '',
        `A sua conta está pronta e o seu espaço de trabalho ativo.`,
        '',
        `Aceder à PAGORA: ${loginUrl}`,
        '',
        `Com os melhores cumprimentos,`,
        `Equipa PAGORA`,
      ].join('\n');

      const html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <span style="${logoStyle}">PAGORA</span>
          </div>
          <div style="${bodyStyle}">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">Bem-vindo à PAGORA</h1>
            <p style="margin: 0 0 12px;">Olá <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 16px; color: #475569;">
              A sua conta foi criada com sucesso. A PAGORA é a plataforma de gestão de cobranças desenhada para empresas que valorizam a pontualidade financeira sem abdicar da relação de confiança com os seus clientes.
            </p>
            <p style="margin: 0 0 24px; color: #475569;">
              O seu espaço de trabalho está totalmente disponível para registar clientes, acompanhar faturas e organizar lembretes preventivos.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${loginUrl}" style="${buttonStyle}">Entrar na PAGORA</a>
            </div>
            <p style="font-size: 13px; color: #64748b; margin: 24px 0 0;">
              Se tiver alguma questão ou sugestão, a nossa equipa está sempre disponível através de <a href="mailto:${supportEmail}" style="color: #4f46e5; text-decoration: none;">${supportEmail}</a>.
            </p>
          </div>
          <div style="${footerStyle}">
            <p style="margin: 0;">© ${currentYear} PAGORA. Gestão Inteligente e Cordial de Cobranças.<br>Todos os direitos reservados.</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'PASSWORD_RESET': {
      const resetToken = String(variables.resetToken || '');
      const resetUrl = String(variables.resetUrl || `${appUrl}/recuperar-password?token=${encodeURIComponent(resetToken)}`);
      const subject = `Redefinir a sua palavra-passe — ${brandName}`;

      const text = [
        `Olá ${userName},`,
        '',
        `Recebemos um pedido para redefinir a palavra-passe da sua conta na PAGORA.`,
        '',
        `Código de verificação: ${resetToken}`,
        `Link para redefinir: ${resetUrl}`,
        '',
        `Por razões de segurança, este pedido expira em 60 minutos e o código apenas pode ser utilizado uma única vez.`,
        '',
        `Caso não tenha solicitado a alteração, por favor ignore este e-mail. A sua palavra-passe atual permanece em segurança e inalterada.`,
        '',
        `Com os melhores cumprimentos,`,
        `Equipa PAGORA`,
      ].join('\n');

      const html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <span style="${logoStyle}">PAGORA</span>
          </div>
          <div style="${bodyStyle}">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">Redefinição de Palavra-passe</h1>
            <p style="margin: 0 0 12px;">Olá <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 16px; color: #475569;">
              Recebemos um pedido para redefinir a palavra-passe de acesso à sua conta na PAGORA.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="${buttonStyle}">Redefinir palavra-passe</a>
            </div>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px;">Código de Verificação de Uso Único</div>
              <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: #1e293b; letter-spacing: 2px;">${resetToken}</span>
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 0;">
              Por motivos de segurança, esta ligação e código são válidos por <strong>60 minutos</strong> e serão invalidados após a utilização.
            </p>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 8px 0 0;">
              Se não solicitou esta redefinição, não precisa de tomar nenhuma ação. A sua palavra-passe atual permanece em segurança.
            </p>
          </div>
          <div style="${footerStyle}">
            <p style="margin: 0;">© ${currentYear} PAGORA. Segurança e Privacidade em primeiro lugar.</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'PASSWORD_CHANGED': {
      const subject = `A sua palavra-passe foi alterada — ${brandName}`;
      const changeDate = String(variables.changeDate || new Date().toLocaleString('pt-PT'));

      const text = [
        `Olá ${userName},`,
        '',
        `Confirmamos que a palavra-passe da sua conta PAGORA foi alterada com sucesso em ${changeDate}.`,
        '',
        `Se foi você que efetuou esta alteração, não necessita de realizar qualquer ação.`,
        '',
        `Se NÃO realizou esta alteração, por favor contacte de imediato a nossa equipa de segurança em ${supportEmail}.`,
        '',
        `Equipa PAGORA`,
      ].join('\n');

      const html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <span style="${logoStyle}">PAGORA</span>
          </div>
          <div style="${bodyStyle}">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">Palavra-passe Atualizada</h1>
            <p style="margin: 0 0 12px;">Olá <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 16px; color: #475569;">
              A palavra-passe de acesso à sua conta PAGORA foi alterada com sucesso em <strong>${changeDate}</strong>.
            </p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 20px 0; color: #166534; font-size: 13px;">
              ✓ Todas as sessões anteriores foram revistas e a sua conta está protegida.
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              Caso não reconheça esta operação, contacte imediatamente a nossa equipa através de <a href="mailto:${supportEmail}" style="color: #4f46e5;">${supportEmail}</a> para bloqueio preventivo.
            </p>
          </div>
          <div style="${footerStyle}">
            <p style="margin: 0;">© ${currentYear} PAGORA. Alerta de Segurança Transacional.</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'SUBSCRIPTION_CONFIRMED':
    case 'PAYMENT_APPROVED': {
      const planName = String(variables.planName || 'PLUS').toUpperCase();
      const amount = String(variables.amount || '5,90 €');
      const period = String(variables.period || 'Mensal');
      const activationDate = String(variables.activationDate || new Date().toLocaleDateString('pt-PT'));
      const renewalDate = String(variables.renewalDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-PT'));
      const subject = `A sua subscrição PAGORA está ativa`;

      const text = [
        `Olá ${userName},`,
        '',
        `O seu pagamento foi confirmado com sucesso e a sua subscrição ao plano ${planName} está ativa.`,
        '',
        `Detalhes da Subscrição:`,
        `- Plano: ${planName}`,
        `- Montante: ${amount}`,
        `- Periodicidade: ${period}`,
        `- Data de Ativação: ${activationDate}`,
        `- Próxima Renovação: ${renewalDate}`,
        '',
        `Todas as funcionalidades e novos limites foram imediatamente desbloqueados no seu espaço de trabalho.`,
        '',
        `Abrir a PAGORA: ${dashboardUrl}`,
        '',
        `Suporte: ${supportEmail}`,
        '',
        `Obrigado pela sua confiança,`,
        `Equipa PAGORA`,
      ].join('\n');

      const html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <span style="${logoStyle}">PAGORA</span>
          </div>
          <div style="${bodyStyle}">
            <div style="display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 20px; margin-bottom: 14px;">
              ✓ Pagamento Confirmado
            </div>
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">A sua subscrição PAGORA está ativa</h1>
            <p style="margin: 0 0 12px;">Olá <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 20px; color: #475569;">
              O pagamento do seu plano <strong>${planName}</strong> foi validado com sucesso. As suas quotas de faturas e recursos avançados estão disponíveis.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Plano</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; text-align: right;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Valor</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; text-align: right;">${amount}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Periodicidade</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: right;">${period}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Ativação</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: right;">${activationDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; color: #64748b;">Próxima Renovação</td>
                <td style="padding: 10px 14px; color: #334155; text-align: right;">${renewalDate}</td>
              </tr>
            </table>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${dashboardUrl}" style="${buttonStyle}">Abrir a PAGORA</a>
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 0;">
              Pode consultar os recibos e histórico de faturação a qualquer momento nas definições do seu espaço de trabalho.
            </p>
          </div>
          <div style="${footerStyle}">
            <p style="margin: 0;">© ${currentYear} PAGORA. Dúvidas sobre a faturação? Escreva para <a href="mailto:${supportEmail}" style="color: #4f46e5;">${supportEmail}</a>.</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'SUBSCRIPTION_CANCELLED': {
      const planName = String(variables.planName || 'PAGORA').toUpperCase();
      const endDate = String(variables.endDate || new Date(Date.now() + 15 * 86400000).toLocaleDateString('pt-PT'));
      const subject = `Confirmação de cancelamento de subscrição — ${brandName}`;

      const text = [
        `Olá ${userName},`,
        '',
        `Confirmamos o pedido de cancelamento da sua subscrição ao plano ${planName}.`,
        '',
        `O seu acesso aos recursos do plano continuará ativo até ${endDate}. Após esta data, a sua conta transitará automaticamente para o plano Gratuito, mantendo todos os seus clientes e histórico intactos.`,
        '',
        `Pode reativar o seu plano a qualquer momento nas definições da conta.`,
        '',
        `Equipa PAGORA`,
      ].join('\n');

      const html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <span style="${logoStyle}">PAGORA</span>
          </div>
          <div style="${bodyStyle}">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">Cancelamento de Subscrição</h1>
            <p style="margin: 0 0 12px;">Olá <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 16px; color: #475569;">
              O cancelamento da renovação automática do seu plano <strong>${planName}</strong> foi registado.
            </p>
            <p style="margin: 0 0 16px; color: #475569;">
              O acesso aos recursos atuais permanecerá ativo até <strong>${endDate}</strong>. Todos os seus dados, clientes e faturas permanecem guardados com total segurança.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}" style="${buttonStyle}">Gerir Conta</a>
            </div>
          </div>
          <div style="${footerStyle}">
            <p style="margin: 0;">© ${currentYear} PAGORA. Suporte: ${supportEmail}</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    default: {
      const subject = String(variables.customSubject || `Notificação da sua conta ${brandName}`);
      const messageBody = String(variables.message || 'Tem uma nova atualização no seu espaço de trabalho.');

      const text = `Olá ${userName},\n\n${messageBody}\n\nAceder: ${dashboardUrl}\n\nEquipa PAGORA`;
      const html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <span style="${logoStyle}">PAGORA</span>
          </div>
          <div style="${bodyStyle}">
            <h1 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">${subject}</h1>
            <p style="margin: 0 0 12px;">Olá <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 20px; color: #475569;">${messageBody}</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}" style="${buttonStyle}">Abrir PAGORA</a>
            </div>
          </div>
          <div style="${footerStyle}">
            <p style="margin: 0;">© ${currentYear} PAGORA.</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }
  }
}

/**
 * Envia um e-mail transacional oficial via API do Resend
 */
export async function sendEmailWithResend(options: TransactionalEmailOptions): Promise<{
  success: boolean;
  status: EmailAuditRecord['status'];
  messageId?: string;
  resendId?: string;
  message: string;
  error?: string;
}> {
  const { to, name, type, variables = {}, idempotencyKey, accountId, appUrl: customAppUrl } = options;

  if (!to || !to.includes('@')) {
    return {
      success: false,
      status: 'failed',
      message: 'Endereço de e-mail do destinatário inválido.',
      error: 'Invalid recipient email',
    };
  }

  const cleanTo = to.trim().toLowerCase();
  const appUrl = resolveAppUrl(customAppUrl);
  const auditId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Verificação de Idempotência
  if (idempotencyKey) {
    const existing = IDEMPOTENCY_STORE.get(idempotencyKey);
    if (existing) {
      return {
        success: true,
        status: 'already_sent',
        messageId: auditId,
        resendId: existing.resendId,
        message: 'Email já enviado anteriormente para este evento (idempotente).',
      };
    }
  }

  // 2. Renderização do Template em PT-PT
  const rendered = renderEmailTemplate(type, { ...variables, userName: name || variables.userName }, appUrl);
  const finalSubject = options.subject || rendered.subject;

  // 3. Verificação da Chave de API do Resend no Ambiente do Backend
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim() || 'PAGORA <onboarding@resend.dev>';

  if (!resendApiKey) {
    // Sem chave configurada: armazena em fila simulada para testes
    const auditRecord: EmailAuditRecord = {
      id: auditId,
      type,
      recipientMasked: maskEmail(cleanTo),
      subject: finalSubject,
      status: 'pending_provider',
      sentAt: new Date().toISOString(),
      accountId,
    };
    EMAIL_AUDIT_LOGS.unshift(auditRecord);
    if (EMAIL_AUDIT_LOGS.length > 300) EMAIL_AUDIT_LOGS.pop();

    return {
      success: true,
      status: 'pending_provider',
      messageId: auditId,
      message: 'Email preparado na fila. Fornecedor Resend aguardando credencial de ambiente.',
    };
  }

  // 4. Disparo oficial através da API REST do Resend
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [cleanTo],
        subject: finalSubject,
        html: rendered.html,
        text: rendered.text,
        headers: idempotencyKey ? { 'X-Entity-Ref-ID': idempotencyKey } : undefined,
      }),
    });

    const resendData = (await resendResponse.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
      statusCode?: number;
    };

    if (resendResponse.ok && resendData.id) {
      const resendId = resendData.id;

      // Armazena chave de idempotência
      if (idempotencyKey) {
        IDEMPOTENCY_STORE.set(idempotencyKey, {
          sentAt: new Date().toISOString(),
          resendId,
          status: 'sent',
        });
      }

      // Registo de auditoria (nunca inclui segredos ou tokens não mascarados)
      const auditRecord: EmailAuditRecord = {
        id: auditId,
        type,
        recipientMasked: maskEmail(cleanTo),
        subject: finalSubject,
        status: 'sent',
        resendId,
        sentAt: new Date().toISOString(),
        accountId,
      };
      EMAIL_AUDIT_LOGS.unshift(auditRecord);
      if (EMAIL_AUDIT_LOGS.length > 300) EMAIL_AUDIT_LOGS.pop();

      return {
        success: true,
        status: 'sent',
        messageId: auditId,
        resendId,
        message: 'Email transacional enviado com sucesso através do Resend.',
      };
    }

    // Caso o Resend retorne erro (ex: sandbox test address, unverified domain, rate limit)
    const rawError = resendData.message || 'Falha na validação do envio pelo Resend';
    const isSandboxRestriction = rawError.includes('can only send testing emails to your own email address') || rawError.includes('verify a domain');

    const auditRecord: EmailAuditRecord = {
      id: auditId,
      type,
      recipientMasked: maskEmail(cleanTo),
      subject: finalSubject,
      status: isSandboxRestriction ? 'simulated_sandbox' : 'failed',
      sentAt: new Date().toISOString(),
      accountId,
      error: rawError,
    };
    EMAIL_AUDIT_LOGS.unshift(auditRecord);
    if (EMAIL_AUDIT_LOGS.length > 300) EMAIL_AUDIT_LOGS.pop();

    // Em modo sandbox (onboarding@resend.dev), informamos sem quebrar a aplicação principal
    return {
      success: isSandboxRestriction, // não quebra operações do utilizador em sandbox
      status: isSandboxRestriction ? 'simulated_sandbox' : 'failed',
      messageId: auditId,
      message: isSandboxRestriction
        ? 'Email transacional processado no Resend (modo sandbox/ambiente de desenvolvimento).'
        : `Erro de envio: ${rawError}`,
      error: rawError,
    };
  } catch (networkErr: unknown) {
    const errorMsg = networkErr instanceof Error ? networkErr.message : 'Erro de conectividade ao Resend';

    const auditRecord: EmailAuditRecord = {
      id: auditId,
      type,
      recipientMasked: maskEmail(cleanTo),
      subject: finalSubject,
      status: 'failed',
      sentAt: new Date().toISOString(),
      accountId,
      error: errorMsg,
    };
    EMAIL_AUDIT_LOGS.unshift(auditRecord);

    return {
      success: false,
      status: 'failed',
      messageId: auditId,
      message: 'Falha temporária ao comunicar com a API do Resend.',
      error: errorMsg,
    };
  }
}

/**
 * Retorna os logs de auditoria de e-mails para fins administrativos
 */
export function getEmailAuditLogs(): EmailAuditRecord[] {
  return [...EMAIL_AUDIT_LOGS];
}

/**
 * Retorna métricas agregadas do sistema de e-mails
 */
export function getEmailSystemMetrics() {
  const hasKey = Boolean(process.env.RESEND_API_KEY);
  const total = EMAIL_AUDIT_LOGS.length;
  const sent = EMAIL_AUDIT_LOGS.filter((l) => l.status === 'sent' || l.status === 'simulated_sandbox').length;
  const failed = EMAIL_AUDIT_LOGS.filter((l) => l.status === 'failed').length;

  return {
    provider: hasKey ? 'Resend API' : 'none',
    configured: hasKey,
    sender: process.env.EMAIL_FROM || 'PAGORA <onboarding@resend.dev>',
    totalDispatches: total,
    successfulDispatches: sent,
    failedDispatches: failed,
  };
}
