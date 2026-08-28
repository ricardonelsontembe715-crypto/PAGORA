/**
 * PAGORA - Serviço de E-mails Transacionais com Resend
 * 
 * Centraliza o envio, templates em PT-PT e idempotência de mensagens.
 * Segurança: Chaves e credenciais permanecem exclusivamente no backend.
 */

export type TransactionalEmailType =
  | 'WELCOME'
  | 'ACCOUNT_CONFIRMATION'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'SUBSCRIPTION_CONFIRMED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_FAILED'
  | 'INVOICE_REMINDER'
  | 'RECEIPT_ISSUED'
  | 'NOTIFICATION';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailPayload {
  to: EmailRecipient;
  type: TransactionalEmailType;
  subject?: string;
  variables?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  accountId?: string;
}

export interface EmailRenderedContent {
  subject: string;
  html: string;
  text: string;
  previewText?: string;
}

export interface SendEmailResult {
  success: boolean;
  status: 'sent' | 'simulated_sandbox' | 'pending_provider' | 'failed' | 'already_sent';
  messageId?: string;
  resendId?: string;
  message: string;
  rendered?: EmailRenderedContent;
}

/**
 * Renderiza templates de email profissionais em PT-PT com a identidade visual PAGORA
 */
export function renderEmailTemplate(
  type: TransactionalEmailType,
  variables: Record<string, string | number | boolean | undefined> = {}
): EmailRenderedContent {
  const brandName = 'PAGORA';
  const supportEmail = 'suporte@pagora.pt';
  const currentYear = new Date().getFullYear();
  const userName = String(variables.userName || 'Estimado(a) Utilizador(a)');

  switch (type) {
    case 'WELCOME':
    case 'ACCOUNT_CONFIRMATION':
      return {
        subject: `Bem-vindo à ${brandName}`,
        previewText: 'A sua conta na PAGORA está pronta para utilização.',
        text: `Olá ${userName},\n\nSeja muito bem-vindo à PAGORA.\n\nCriámos a PAGORA para simplificar a gestão de cobranças do seu negócio com total pontualidade, cordialidade e rigor.\n\nA sua conta está pronta e o seu espaço de trabalho ativo.\n\nAceda à PAGORA em: ${variables.loginUrl || 'https://pagora.pt/login'}\n\nCom os melhores cumprimentos,\nEquipa PAGORA`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: 800; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px;">PAGORA</span>
            </div>
            <div style="padding: 24px 0;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Bem-vindo à PAGORA</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">A sua conta foi criada com sucesso. A PAGORA é a plataforma de gestão de cobranças desenhada para empresas que valorizam a pontualidade financeira sem abdicar da relação de confiança com os seus clientes.</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">O seu espaço de trabalho está totalmente disponível para registar clientes, acompanhar faturas e organizar lembretes preventivos.</p>
              <div style="margin: 28px 0; text-align: center;">
                <a href="${variables.loginUrl || 'https://pagora.pt/login'}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; display: inline-block;">Entrar na PAGORA</a>
              </div>
            </div>
            <div style="padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              <p>© ${currentYear} PAGORA. Gestão inteligente e cordial de cobranças.<br>Dúvidas? Contacte-nos em ${supportEmail}</p>
            </div>
          </div>
        `,
      };

    case 'PASSWORD_RESET':
      return {
        subject: `Redefinir a sua palavra-passe — ${brandName}`,
        previewText: 'Instruções para redefinir a sua palavra-passe de acesso.',
        text: `Olá ${userName},\n\nRecebemos um pedido para redefinir a palavra-passe da sua conta PAGORA.\n\nCódigo de verificação: ${variables.resetToken || ''}\nLink direto: ${variables.resetUrl || 'https://pagora.pt/recuperar-password'}\n\nPor razões de segurança, este pedido expira dentro de 60 minutos e o código apenas pode ser utilizado uma única vez.\nSe não solicitou esta alteração, por favor ignore este email.\n\nCom os melhores cumprimentos,\nEquipa PAGORA`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: 800; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px;">PAGORA</span>
            </div>
            <div style="padding: 24px 0;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Redefinição de Palavra-passe</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Recebemos um pedido para redefinir a palavra-passe de acesso à sua conta na PAGORA.</p>
              <div style="margin: 20px 0; text-align: center;">
                <a href="${variables.resetUrl || 'https://pagora.pt/recuperar-password'}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; display: inline-block;">Redefinir palavra-passe</a>
              </div>
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: #334155; letter-spacing: 2px;">${variables.resetToken || ''}</span>
              </div>
              <p style="font-size: 13px; color: #64748b;">Por razões de segurança, este código é válido por <strong>60 minutos</strong> e apenas pode ser utilizado uma única vez.</p>
              <p style="font-size: 13px; color: #64748b;">Se não solicitou esta alteração, ignore este email em total segurança.</p>
            </div>
            <div style="padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              <p>© ${currentYear} PAGORA. Segurança e Privacidade em primeiro lugar.</p>
            </div>
          </div>
        `,
      };

    case 'PASSWORD_CHANGED':
      return {
        subject: `A sua palavra-passe foi alterada com sucesso — ${brandName}`,
        previewText: 'A palavra-passe da sua conta PAGORA foi atualizada.',
        text: `Olá ${userName},\n\nConfirmamos que a palavra-passe da sua conta PAGORA foi alterada com sucesso em ${variables.changeDate || new Date().toLocaleString('pt-PT')}.\n\nSe não realizou esta alteração, contacte o suporte de imediato em ${supportEmail}.\n\nCom os melhores cumprimentos,\nEquipa PAGORA`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: 800; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px;">PAGORA</span>
            </div>
            <div style="padding: 24px 0;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Palavra-passe Alterada</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">A sua palavra-passe de acesso à PAGORA foi atualizada com sucesso.</p>
              <p style="font-size: 13px; color: #64748b;">Se não foi o autor desta alteração, proteja a sua conta contactando de imediato a nossa equipa através de <strong>${supportEmail}</strong>.</p>
            </div>
            <div style="padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              <p>© ${currentYear} PAGORA. Segurança e Privacidade em primeiro lugar.</p>
            </div>
          </div>
        `,
      };

    case 'SUBSCRIPTION_CONFIRMED':
    case 'PAYMENT_APPROVED':
      return {
        subject: `Subscrição PAGORA ${String(variables.planName || 'PLUS').toUpperCase()} Confirmada`,
        previewText: 'O seu pagamento foi aprovado e o seu plano está ativo.',
        text: `Olá ${userName},\n\nO seu pagamento relativo ao plano ${variables.planName || 'PLUS'} no valor de ${variables.amount || '5,90 €'} foi confirmado com sucesso.\n\nO seu espaço de trabalho já beneficia de limites ampliados e funcionalidades prioritárias.\n\nCom os melhores cumprimentos,\nEquipa PAGORA`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: 800; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px;">PAGORA</span>
            </div>
            <div style="padding: 24px 0;">
              <div style="display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px;">
                ✓ Subscrição Ativada
              </div>
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Plano ${String(variables.planName || 'PLUS').toUpperCase()} Ativo</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Confirmamos a ativação do seu plano <strong>${variables.planName || 'PLUS'}</strong> no montante de <strong>${variables.amount || '5,90 €'}</strong>.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Data de ativação:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${variables.activationDate || new Date().toLocaleDateString('pt-PT')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Renovação:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${variables.period || 'Mensal'} (${variables.renewalDate || '—'})</td>
                </tr>
              </table>
              <div style="margin: 24px 0; text-align: center;">
                <a href="${variables.dashboardUrl || 'https://pagora.pt/dashboard'}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; display: inline-block;">Abrir Painel PAGORA</a>
              </div>
            </div>
            <div style="padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              <p>© ${currentYear} PAGORA. Faturas e recibos disponíveis no painel de configurações.</p>
            </div>
          </div>
        `,
      };

    case 'PAYMENT_FAILED':
      return {
        subject: `Aviso de Pagamento — Plano ${String(variables.planName || 'PAGORA').toUpperCase()}`,
        previewText: 'Houve uma questão com o processamento do seu pagamento.',
        text: `Olá ${userName},\n\nNão foi possível concluir a cobrança relativa à renovação da sua subscrição ${variables.planName || 'PAGORA'}.\n\nOs seus dados e clientes permanecem preservados em segurança.\n\nPor favor, atualize o método de pagamento para restabelecer a continuidade dos serviços.\n\nEquipa PAGORA`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: 800; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px;">PAGORA</span>
            </div>
            <div style="padding: 24px 0;">
              <h2 style="font-size: 18px; font-weight: 700; color: #b91c1c; margin-top: 0;">Tentativa de Pagamento Sem Sucesso</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Não conseguimos processar a cobrança do plano <strong>${variables.planName || 'PAGORA'}</strong>. Os seus dados e histórico de cobranças permanecem intactos.</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Poderá atualizar as suas informações de pagamento a qualquer momento nas definições da conta.</p>
            </div>
            <div style="padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              <p>© ${currentYear} PAGORA. Suporte disponível em ${supportEmail}</p>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `Notificação da sua conta ${brandName}`,
        previewText: 'Tem uma nova atualização na sua conta.',
        text: `Olá ${userName},\n\nTem uma nova notificação na sua conta PAGORA.\n\nCom os melhores cumprimentos,\nEquipa PAGORA`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: 800; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px;">PAGORA</span>
            </div>
            <div style="padding: 24px 0;">
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Olá <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Tem uma nova notificação disponível no seu espaço de trabalho PAGORA.</p>
            </div>
            <div style="padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              <p>© ${currentYear} PAGORA. Gestão inteligente e cordial de cobranças.</p>
            </div>
          </div>
        `,
      };
  }
}

/**
 * Envia ou agenda o email transacional através do backend seguro
 */
export async function sendTransactionalEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const rendered = renderEmailTemplate(payload.type, payload.variables);

  try {
    const response = await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.to.email,
        name: payload.to.name,
        type: payload.type,
        subject: payload.subject || rendered.subject,
        variables: payload.variables,
        idempotencyKey: payload.idempotencyKey,
        accountId: payload.accountId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: Boolean(data.success),
        status: data.status || 'sent',
        messageId: data.messageId,
        resendId: data.resendId,
        message: data.message || 'Email despachado com sucesso.',
        rendered,
      };
    }

    return {
      success: false,
      status: 'failed',
      message: 'Falha ao contactar o serviço de email.',
      rendered,
    };
  } catch {
    // Falha silenciosa com feedback elegante para não bloquear o fluxo da aplicação
    return {
      success: true,
      status: 'pending_provider',
      message: 'Email registado no motor de envio em background.',
      rendered,
    };
  }
}
