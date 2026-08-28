import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  GeneratedMessage,
  MessageTemplate,
  MessageStatus,
  AccountSignature,
  ActivityLog,
} from '../types/database';
import { useAuth } from './AuthContext';
import { useCustomers } from './CustomerContext';
import { useInvoices } from './InvoiceContext';
import { storage } from '../lib/storage';
import { PLANS } from '../config/plans';
import { hasFeature } from '../lib/permissions';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';
import {
  generateMessageText,
  analyzeMessageContext,
  GeneratorOptions,
  GeneratedMessageOutput,
  EngineRecommendation,
} from '../lib/messageEngine';

interface GenerationStats {
  currentMonthCount: number;
  maxAllowed: number | 'unlimited';
  remaining: number | 'unlimited';
  isLimitReached: boolean;
}

interface MessageContextType {
  messages: GeneratedMessage[];
  templates: MessageTemplate[];
  customTemplates: MessageTemplate[];
  systemTemplates: MessageTemplate[];
  signature: AccountSignature;
  isLoading: boolean;
  generationStats: GenerationStats;
  analyzeContext: (customerId: string, invoiceId?: string) => EngineRecommendation;
  generateDraft: (params: {
    customerId: string;
    invoiceId?: string;
    options: GeneratorOptions;
  }) => { success: boolean; output?: GeneratedMessageOutput; error?: string };
  saveGeneratedMessage: (
    messageData: Omit<GeneratedMessage, 'id' | 'accountId' | 'createdAt'>
  ) => Promise<{ success: boolean; message?: GeneratedMessage; error?: string }>;
  updateMessageStatus: (
    messageId: string,
    status: MessageStatus,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteMessage: (messageId: string) => Promise<{ success: boolean; error?: string }>;
  createTemplate: (
    templateData: Omit<MessageTemplate, 'id' | 'accountId' | 'createdAt' | 'isDefault'>
  ) => Promise<{ success: boolean; template?: MessageTemplate; error?: string }>;
  updateTemplate: (
    id: string,
    templateData: Partial<MessageTemplate>
  ) => Promise<{ success: boolean; template?: MessageTemplate; error?: string }>;
  duplicateTemplate: (
    id: string
  ) => Promise<{ success: boolean; template?: MessageTemplate; error?: string }>;
  deleteTemplate: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveSignature: (signature: AccountSignature) => Promise<{ success: boolean; error?: string }>;
  getMessagesByCustomer: (customerId: string) => GeneratedMessage[];
  getMessagesByInvoice: (invoiceId: string) => GeneratedMessage[];
  getTemplateById: (templateId: string) => MessageTemplate | undefined;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, user } = useAuth();
  const { getCustomerById } = useCustomers();
  const { getInvoiceById, getInvoicePromises } = useInvoices();

  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [signature, setSignature] = useState<AccountSignature>({
    enabled: true,
    name: user?.name || '',
    companyName: account?.name || '',
    role: 'Gestão Financeira',
    phone: account?.phone || '',
    email: user?.email || '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const accountId = account?.id;

  // Carregamento de dados com isolamento multi-tenant
  useEffect(() => {
    if (!accountId) {
      setMessages([]);
      setCustomTemplates([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const storedMessages = storage.getTenantData<GeneratedMessage[]>(
        accountId,
        'generated_messages',
        []
      );

      const storedCustomTemplates = storage.getTenantData<MessageTemplate[]>(
        accountId,
        'custom_templates',
        []
      );

      const storedSignature = storage.getTenantData<AccountSignature>(
        accountId,
        'signature',
        {
          enabled: true,
          name: user?.name || '',
          companyName: account.name || '',
          role: 'Gestão Financeira',
          phone: account.phone || '',
          email: user?.email || '',
        }
      );

      setMessages(storedMessages);
      setCustomTemplates(storedCustomTemplates);
      setSignature(storedSignature);
    } catch (err) {
      console.error('Erro ao carregar mensagens do armazenamento:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, account?.name, account?.phone, user?.name, user?.email]);

  // Grava mensagens no armazenamento local
  const persistMessages = useCallback(
    (newMessages: GeneratedMessage[]) => {
      if (!accountId) return;
      setMessages(newMessages);
      storage.setTenantData(accountId, 'generated_messages', newMessages);
    },
    [accountId]
  );

  // Grava modelos customizados
  const persistCustomTemplates = useCallback(
    (newTemplates: MessageTemplate[]) => {
      if (!accountId) return;
      setCustomTemplates(newTemplates);
      storage.setTenantData(accountId, 'custom_templates', newTemplates);
    },
    [accountId]
  );

  // Lista unificada de modelos (sistema + personalizados da conta)
  const templates = useMemo(() => {
    return [...DEFAULT_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  const systemTemplates = useMemo(() => {
    return DEFAULT_TEMPLATES;
  }, []);

  // Registo de log de auditoria
  const logActivity = useCallback(
    (action: string, entityId?: string, details?: Record<string, unknown>) => {
      if (!accountId || !user?.id) return;
      const logs = storage.getTenantData<ActivityLog[]>(accountId, 'activity_logs', []);
      const newLog: ActivityLog = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        accountId,
        userId: user.id,
        action,
        entityType: 'message',
        entityId,
        details,
        createdAt: new Date().toISOString(),
      };
      storage.setTenantData(accountId, 'activity_logs', [newLog, ...logs]);
    },
    [accountId, user?.id]
  );

  // Estatísticas de geração no mês corrente e limites do plano
  const generationStats = useMemo<GenerationStats>(() => {
    const planType = account?.plan || 'free';
    const planConfig = PLANS[planType];
    const maxAllowed = planConfig.limits.maxMessageGenerationsPerMonth;

    // Filtra mensagens geradas no mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthCount = messages.filter((m) => {
      const d = new Date(m.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    let remaining: number | 'unlimited' = 'unlimited';
    let isLimitReached = false;

    if (typeof maxAllowed === 'number') {
      remaining = Math.max(0, maxAllowed - thisMonthCount);
      isLimitReached = remaining <= 0;
    }

    return {
      currentMonthCount: thisMonthCount,
      maxAllowed,
      remaining,
      isLimitReached,
    };
  }, [account?.plan, messages]);

  // Analisa o contexto completo de uma fatura e cliente
  const analyzeContext = useCallback(
    (customerId: string, invoiceId?: string): EngineRecommendation => {
      const customer = getCustomerById(customerId);
      const invoice = invoiceId ? getInvoiceById(invoiceId) : undefined;
      const promises = invoiceId ? getInvoicePromises(invoiceId) : [];
      const activePromise = promises.find((p) => p.status === 'pending');

      return analyzeMessageContext({
        customer,
        invoice,
        activePromise,
        signature,
        accountName: account?.name,
      });
    },
    [getCustomerById, getInvoiceById, getInvoicePromises, signature, account?.name]
  );

  // Gera rascunho de mensagem sem persistir ainda
  const generateDraft = useCallback(
    (params: {
      customerId: string;
      invoiceId?: string;
      options: GeneratorOptions;
    }): { success: boolean; output?: GeneratedMessageOutput; error?: string } => {
      const { customerId, invoiceId, options } = params;
      const customer = getCustomerById(customerId);
      const invoice = invoiceId ? getInvoiceById(invoiceId) : undefined;
      const promises = invoiceId ? getInvoicePromises(invoiceId) : [];
      const activePromise = promises.find((p) => p.status === 'pending');

      // Verificação de limites do plano
      if (generationStats.isLimitReached) {
        return {
          success: false,
          error: `Atingiu o limite de ${generationStats.maxAllowed} gerações de mensagens para o plano ${account?.plan?.toUpperCase() || 'FREE'}. Atualize o seu plano para continuar.`,
        };
      }

      const output = generateMessageText(
        {
          customer,
          invoice,
          activePromise,
          signature,
          accountName: account?.name,
        },
        options
      );

      return {
        success: true,
        output,
      };
    },
    [getCustomerById, getInvoiceById, getInvoicePromises, signature, account?.name, account?.plan, generationStats]
  );

  // Salva mensagem no histórico com estado
  const saveGeneratedMessage = useCallback(
    async (
      messageData: Omit<GeneratedMessage, 'id' | 'accountId' | 'createdAt'>
    ): Promise<{ success: boolean; message?: GeneratedMessage; error?: string }> => {
      if (!accountId) {
        return { success: false, error: 'Sessão inválida. Inicie sessão novamente.' };
      }

      const newMessage: GeneratedMessage = {
        ...messageData,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        accountId,
        createdAt: new Date().toISOString(),
      };

      const updated = [newMessage, ...messages];
      persistMessages(updated);

      logActivity(
        'Mensagem de cobrança gerada e registada',
        newMessage.id,
        {
          channel: newMessage.channel,
          category: newMessage.category,
          status: newMessage.status,
          invoiceId: newMessage.invoiceId,
        }
      );

      return { success: true, message: newMessage };
    },
    [accountId, messages, persistMessages, logActivity]
  );

  // Atualiza estado da mensagem (ex: Copiada, Enviada manualmente, Arquivada)
  const updateMessageStatus = useCallback(
    async (
      messageId: string,
      status: MessageStatus,
      notes?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!accountId) return { success: false, error: 'Sessão inválida.' };

      const existingIndex = messages.findIndex((m) => m.id === messageId);
      if (existingIndex === -1) {
        return { success: false, error: 'Mensagem não encontrada.' };
      }

      const now = new Date().toISOString();
      const updatedList = [...messages];
      const target = { ...updatedList[existingIndex] };

      target.status = status;
      target.updatedAt = now;
      if (notes !== undefined) target.notes = notes;

      if (status === 'copied') {
        target.copiedAt = now;
      } else if (status === 'sent_manually') {
        target.sentManuallyAt = now;
      }

      updatedList[existingIndex] = target;
      persistMessages(updatedList);

      logActivity(`Estado da mensagem atualizado para ${status}`, messageId, { status, notes });

      return { success: true };
    },
    [accountId, messages, persistMessages, logActivity]
  );

  // Elimina mensagem do histórico
  const deleteMessage = useCallback(
    async (messageId: string): Promise<{ success: boolean; error?: string }> => {
      if (!accountId) return { success: false, error: 'Sessão inválida.' };

      const updated = messages.filter((m) => m.id !== messageId);
      persistMessages(updated);

      logActivity('Mensagem removida do histórico', messageId);
      return { success: true };
    },
    [accountId, messages, persistMessages, logActivity]
  );

  // Criação de modelo personalizado
  const createTemplate = useCallback(
    async (
      templateData: Omit<MessageTemplate, 'id' | 'accountId' | 'createdAt' | 'isDefault'>
    ): Promise<{ success: boolean; template?: MessageTemplate; error?: string }> => {
      if (!accountId) return { success: false, error: 'Sessão inválida.' };

      const planType = account?.plan || 'free';
      const maxTemplates = PLANS[planType].limits.customTemplates;

      if (typeof maxTemplates === 'number' && customTemplates.length >= maxTemplates) {
        return {
          success: false,
          error: `O seu plano ${planType.toUpperCase()} permite até ${maxTemplates} modelos personalizados. Faça upgrade para PLUS ou PRO para criar mais modelos.`,
        };
      }

      const newTemplate: MessageTemplate = {
        ...templateData,
        id: `tpl_custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        accountId,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [newTemplate, ...customTemplates];
      persistCustomTemplates(updated);

      logActivity('Novo modelo de mensagem criado', newTemplate.id, {
        title: newTemplate.title,
        category: newTemplate.category,
      });

      return { success: true, template: newTemplate };
    },
    [accountId, account?.plan, customTemplates, persistCustomTemplates, logActivity]
  );

  // Atualização de modelo personalizado
  const updateTemplate = useCallback(
    async (
      id: string,
      templateData: Partial<MessageTemplate>
    ): Promise<{ success: boolean; template?: MessageTemplate; error?: string }> => {
      if (!accountId) return { success: false, error: 'Sessão inválida.' };

      const idx = customTemplates.findIndex((t) => t.id === id);
      if (idx === -1) {
        return { success: false, error: 'Modelo não encontrado ou modelo padrão do sistema.' };
      }

      const updatedList = [...customTemplates];
      const updatedTemplate = {
        ...updatedList[idx],
        ...templateData,
        updatedAt: new Date().toISOString(),
      };

      updatedList[idx] = updatedTemplate;
      persistCustomTemplates(updatedList);

      logActivity('Modelo de mensagem atualizado', id, { title: updatedTemplate.title });
      return { success: true, template: updatedTemplate };
    },
    [accountId, customTemplates, persistCustomTemplates, logActivity]
  );

  // Duplicação de modelo
  const duplicateTemplate = useCallback(
    async (id: string): Promise<{ success: boolean; template?: MessageTemplate; error?: string }> => {
      const templateToCopy = templates.find((t) => t.id === id);
      if (!templateToCopy) {
        return { success: false, error: 'Modelo de origem não encontrado.' };
      }

      return createTemplate({
        title: `${templateToCopy.title} (Cópia)`,
        category: templateToCopy.category,
        channel: templateToCopy.channel,
        tone: templateToCopy.tone,
        intent: templateToCopy.intent,
        subject: templateToCopy.subject,
        content: templateToCopy.content,
      });
    },
    [templates, createTemplate]
  );

  // Eliminação de modelo personalizado
  const deleteTemplate = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!accountId) return { success: false, error: 'Sessão inválida.' };

      const updated = customTemplates.filter((t) => t.id !== id);
      persistCustomTemplates(updated);

      logActivity('Modelo de mensagem eliminado', id);
      return { success: true };
    },
    [accountId, customTemplates, persistCustomTemplates, logActivity]
  );

  // Grava assinatura da conta
  const saveSignature = useCallback(
    async (newSignature: AccountSignature): Promise<{ success: boolean; error?: string }> => {
      if (!accountId) return { success: false, error: 'Sessão inválida.' };

      setSignature(newSignature);
      storage.setTenantData(accountId, 'signature', newSignature);

      logActivity('Assinatura de mensagens atualizada');
      return { success: true };
    },
    [accountId, logActivity]
  );

  const getMessagesByCustomer = useCallback(
    (customerId: string) => {
      return messages.filter((m) => m.customerId === customerId);
    },
    [messages]
  );

  const getMessagesByInvoice = useCallback(
    (invoiceId: string) => {
      return messages.filter((m) => m.invoiceId === invoiceId);
    },
    [messages]
  );

  const getTemplateById = useCallback(
    (templateId: string) => {
      return templates.find((t) => t.id === templateId);
    },
    [templates]
  );

  return (
    <MessageContext.Provider
      value={{
        messages,
        templates,
        customTemplates,
        systemTemplates,
        signature,
        isLoading,
        generationStats,
        analyzeContext,
        generateDraft,
        saveGeneratedMessage,
        updateMessageStatus,
        deleteMessage,
        createTemplate,
        updateTemplate,
        duplicateTemplate,
        deleteTemplate,
        saveSignature,
        getMessagesByCustomer,
        getMessagesByInvoice,
        getTemplateById,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages deve ser utilizado dentro de um MessageProvider');
  }
  return context;
};
