import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Automation,
  CollectionReminder,
  CollectionSequence,
  AutomationExecutionLog,
  AutomationMetrics,
  ReminderPriority,
  RecommendedActionType,
  AutomationStatus,
} from '../types/automations';
import { useAuth } from './AuthContext';
import { useCustomers } from './CustomerContext';
import { useInvoices } from './InvoiceContext';
import { useNotifications } from './NotificationContext';
import { storage } from '../lib/storage';
import { PRESET_AUTOMATIONS, PRESET_SEQUENCES, DEFAULT_AUTOMATION_SETTINGS } from '../data/defaultAutomations';
import { runAutomationEngine } from '../lib/automationEngine';
import { hasFeature } from '../lib/permissions';

interface AutomationContextType {
  automations: Automation[];
  reminders: CollectionReminder[];
  sequences: CollectionSequence[];
  executionLogs: AutomationExecutionLog[];
  metrics: AutomationMetrics;
  isLoading: boolean;
  // Gestão de Automações
  createAutomation: (data: Omit<Automation, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failedCount'>) => Promise<{ success: boolean; automation?: Automation; error?: string }>;
  updateAutomation: (id: string, data: Partial<Automation>) => Promise<{ success: boolean; error?: string }>;
  toggleAutomationStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateAutomation: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteAutomation: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Gestão de Lembretes
  createReminder: (data: Omit<CollectionReminder, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<{ success: boolean; reminder?: CollectionReminder; error?: string }>;
  resolveReminder: (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  snoozeReminder: (id: string, daysOrDate: number | string) => Promise<{ success: boolean; error?: string }>;
  updateReminder: (id: string, data: Partial<CollectionReminder>) => Promise<{ success: boolean; error?: string }>;
  deleteReminder: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Gestão de Sequências
  createSequence: (data: Omit<CollectionSequence, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; sequence?: CollectionSequence; error?: string }>;
  updateSequence: (id: string, data: Partial<CollectionSequence>) => Promise<{ success: boolean; error?: string }>;
  toggleSequenceStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateSequence: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteSequence: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Ações Operacionais
  runEngineManually: () => void;
  getRemindersForCustomer: (customerId: string) => CollectionReminder[];
  getRemindersForInvoice: (invoiceId: string) => CollectionReminder[];
}

const AutomationContext = createContext<AutomationContextType | undefined>(undefined);

export const AutomationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account } = useAuth();
  const { customers } = useCustomers();
  const { invoices, promises } = useInvoices();
  const { addNotification, showToast } = useNotifications();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados com persistência por conta (multi-tenant)
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [reminders, setReminders] = useState<CollectionReminder[]>([]);
  const [sequences, setSequences] = useState<CollectionSequence[]>([]);
  const [executionLogs, setExecutionLogs] = useState<AutomationExecutionLog[]>([]);

  // Carrega e sincroniza dados com a conta ativa
  useEffect(() => {
    if (!account?.id) {
      setAutomations([]);
      setReminders([]);
      setSequences([]);
      setExecutionLogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Inicializa automações padrão para o tenant se ainda não existirem
    const defaultAccountAutomations: Automation[] = PRESET_AUTOMATIONS.map((preset, idx) => ({
      ...preset,
      id: `auto_${account.id}_${idx + 1}`,
      accountId: account.id,
      createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const storedAutomations = storage.getTenantData<Automation[]>(
      account.id,
      'automations',
      defaultAccountAutomations
    );

    const defaultAccountSequences: CollectionSequence[] = PRESET_SEQUENCES.map((preset, idx) => ({
      ...preset,
      id: `seq_${account.id}_${idx + 1}`,
      accountId: account.id,
      createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const storedSequences = storage.getTenantData<CollectionSequence[]>(
      account.id,
      'collection_sequences',
      defaultAccountSequences
    );

    const storedReminders = storage.getTenantData<CollectionReminder[]>(
      account.id,
      'collection_reminders',
      []
    );

    const storedLogs = storage.getTenantData<AutomationExecutionLog[]>(
      account.id,
      'automation_execution_logs',
      []
    );

    setAutomations(storedAutomations);
    setSequences(storedSequences);
    setReminders(storedReminders);
    setExecutionLogs(storedLogs);
    setIsLoading(false);
  }, [account?.id]);

  // Persiste alterações nas automações
  useEffect(() => {
    if (account?.id && !isLoading) {
      storage.setTenantData(account.id, 'automations', automations);
    }
  }, [automations, account?.id, isLoading]);

  // Persiste alterações nos lembretes
  useEffect(() => {
    if (account?.id && !isLoading) {
      storage.setTenantData(account.id, 'collection_reminders', reminders);
    }
  }, [reminders, account?.id, isLoading]);

  // Persiste alterações nas sequências
  useEffect(() => {
    if (account?.id && !isLoading) {
      storage.setTenantData(account.id, 'collection_sequences', sequences);
    }
  }, [sequences, account?.id, isLoading]);

  // Persiste logs
  useEffect(() => {
    if (account?.id && !isLoading) {
      storage.setTenantData(account.id, 'automation_execution_logs', executionLogs);
    }
  }, [executionLogs, account?.id, isLoading]);

  // Executa o motor e sincroniza com faturas e clientes
  const runEngine = useCallback(() => {
    if (!account || isLoading) return;

    const result = runAutomationEngine({
      account,
      automations,
      sequences,
      invoices,
      customers,
      promises,
      existingReminders: reminders,
    });

    let hasChanges = false;

    if (result.newReminders.length > 0 || result.updatedReminders.length > 0) {
      hasChanges = true;
      setReminders((prev) => {
        // Atualiza lembretes existentes modificados (ex: resolvidos por pagamento)
        const updatedMap = new Map<string, CollectionReminder>();
        result.updatedReminders.forEach((r) => updatedMap.set(r.id, r));

        const base = prev.map((r) => updatedMap.get(r.id) || r);
        return [...result.newReminders, ...base];
      });
    }

    if (result.newLogs.length > 0) {
      setExecutionLogs((prev) => [...result.newLogs, ...prev].slice(0, 150));
    }

    if (result.newNotifications.length > 0) {
      result.newNotifications.forEach((n) => addNotification(n));
    }

    if (hasChanges && result.newReminders.length > 0) {
      // Atualiza contadores de execução nas automações ativas
      setAutomations((prev) =>
        prev.map((auto) => {
          const autoLogs = result.newLogs.filter((l) => l.automationId === auto.id);
          if (autoLogs.length > 0) {
            return {
              ...auto,
              executionCount: auto.executionCount + autoLogs.length,
              successCount: auto.successCount + autoLogs.filter((l) => l.result === 'success').length,
              lastRunAt: new Date().toISOString(),
            };
          }
          return auto;
        })
      );
    }
  }, [account, isLoading, automations, sequences, invoices, customers, promises, reminders, addNotification]);

  // Aciona o motor quando as faturas, pagamentos ou promessas sofrem mutações
  useEffect(() => {
    if (!isLoading && account?.id) {
      runEngine();
    }
  }, [invoices, promises, customers.length, isLoading, account?.id]);

  const runEngineManually = () => {
    runEngine();
    showToast({
      title: 'Automações sincronizadas',
      message: 'Todas as regras e lembretes foram avaliados com base no estado atual da carteira.',
      type: 'success',
    });
  };

  // Cálculo dos indicadores de automações
  const metrics = useMemo<AutomationMetrics>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const active = automations.filter((a) => a.status === 'active').length;
    const paused = automations.filter((a) => a.status === 'paused').length;

    const pending = reminders.filter((r) => r.status === 'pending');
    const todayCount = pending.filter((r) => r.scheduledDate === todayStr).length;
    const overdueCount = pending.filter((r) => r.scheduledDate < todayStr).length;
    const completed = reminders.filter((r) => r.status === 'completed').length;

    const totalExecs = automations.reduce((sum, a) => sum + a.executionCount, 0);
    const successful = automations.reduce((sum, a) => sum + a.successCount, 0);

    const customersInFollowup = new Set(pending.map((r) => r.customerId)).size;
    const promisesDueSoon = promises.filter((p) => p.status === 'pending').length;

    return {
      activeAutomations: active,
      pausedAutomations: paused,
      totalAutomations: automations.length,
      pendingReminders: pending.length,
      todayReminders: todayCount,
      overdueReminders: overdueCount,
      completedReminders: completed,
      totalExecutions: totalExecs,
      successfulActions: successful,
      customersInFollowup,
      promisesDueSoon,
    };
  }, [automations, reminders, promises]);

  // ==========================================
  // MÉTODOS DE GESTÃO DE AUTOMAÇÕES
  // ==========================================

  const createAutomation = async (
    data: Omit<Automation, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failedCount'>
  ) => {
    if (!account) return { success: false, error: 'Conta não autenticada' };

    // Limites de plano cumulativo
    const isPro = account.plan === 'pro';
    const isPlus = account.plan === 'plus' || isPro;
    const maxAllowed = isPro ? 9999 : isPlus ? 10 : 3;

    const currentActive = automations.filter((a) => a.status === 'active').length;
    if (data.status === 'active' && currentActive >= maxAllowed) {
      return {
        success: false,
        error: `O seu plano ${account.plan.toUpperCase()} permite até ${maxAllowed} automações ativas. Faça upgrade para expandir o limite.`,
      };
    }

    const newAuto: Automation = {
      ...data,
      id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      accountId: account.id,
      executionCount: 0,
      successCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAutomations((prev) => [newAuto, ...prev]);
    showToast({
      title: 'Automação criada',
      message: `A regra "${newAuto.name}" foi adicionada com sucesso.`,
      type: 'success',
    });

    return { success: true, automation: newAuto };
  };

  const updateAutomation = async (id: string, data: Partial<Automation>) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id
          ? {
              ...auto,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : auto
      )
    );
    showToast({
      title: 'Automação atualizada',
      message: 'As alterações da regra foram guardadas.',
      type: 'success',
    });
    return { success: true };
  };

  const toggleAutomationStatus = async (id: string) => {
    const auto = automations.find((a) => a.id === id);
    if (!auto) return { success: false, error: 'Automação não encontrada' };

    const nextStatus: AutomationStatus = auto.status === 'active' ? 'paused' : 'active';

    if (nextStatus === 'active') {
      const isPro = account?.plan === 'pro';
      const isPlus = account?.plan === 'plus' || isPro;
      const maxAllowed = isPro ? 9999 : isPlus ? 10 : 3;
      const currentActive = automations.filter((a) => a.status === 'active' && a.id !== id).length;

      if (currentActive >= maxAllowed) {
        showToast({
          title: 'Limite de automações atingido',
          message: `O seu plano ${account?.plan.toUpperCase()} permite até ${maxAllowed} automações ativas.`,
          type: 'warning',
        });
        return { success: false, error: 'Limite atingido' };
      }
    }

    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus, updatedAt: new Date().toISOString() } : a))
    );

    showToast({
      title: nextStatus === 'active' ? 'Automação ativada' : 'Automação pausada',
      message: `A regra "${auto.name}" está agora ${nextStatus === 'active' ? 'ativa' : 'em pausa'}.`,
      type: 'info',
    });

    return { success: true };
  };

  const duplicateAutomation = async (id: string) => {
    const original = automations.find((a) => a.id === id);
    if (!original || !account) return { success: false, error: 'Automação não encontrada' };

    const cloned: Automation = {
      ...original,
      id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `${original.name} (Cópia)`,
      status: 'paused',
      isPreset: false,
      executionCount: 0,
      successCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAutomations((prev) => [cloned, ...prev]);
    showToast({
      title: 'Automação duplicada',
      message: `Cópia criada como "${cloned.name}".`,
      type: 'success',
    });
    return { success: true };
  };

  const deleteAutomation = async (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    showToast({
      title: 'Automação eliminada',
      message: 'A regra foi removida do sistema.',
      type: 'info',
    });
    return { success: true };
  };

  // ==========================================
  // MÉTODOS DE GESTÃO DE LEMBRETES
  // ==========================================

  const createReminder = async (
    data: Omit<CollectionReminder, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    if (!account) return { success: false, error: 'Conta não autenticada' };

    const newReminder: CollectionReminder = {
      ...data,
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      accountId: account.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReminders((prev) => [newReminder, ...prev]);
    showToast({
      title: 'Lembrete criado',
      message: `Lembrete agendado para ${newReminder.scheduledDate}.`,
      type: 'success',
    });

    return { success: true, reminder: newReminder };
  };

  const resolveReminder = async (id: string, notes?: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'completed',
              completedAt: new Date().toISOString(),
              notes: notes || r.notes,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    showToast({
      title: 'Lembrete concluído',
      message: 'Ação resolvida e arquivada com sucesso.',
      type: 'success',
    });
    return { success: true };
  };

  const snoozeReminder = async (id: string, daysOrDate: number | string) => {
    let nextDate: string;

    if (typeof daysOrDate === 'number') {
      const d = new Date();
      d.setDate(d.getDate() + daysOrDate);
      nextDate = d.toISOString().split('T')[0];
    } else {
      nextDate = daysOrDate;
    }

    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'pending',
              scheduledDate: nextDate,
              snoozedUntil: nextDate,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    showToast({
      title: 'Lembrete adiado',
      message: `Reagendado para ${nextDate}.`,
      type: 'info',
    });
    return { success: true };
  };

  const updateReminder = async (id: string, data: Partial<CollectionReminder>) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r))
    );
    showToast({
      title: 'Lembrete atualizado',
      message: 'Detalhes guardados com sucesso.',
      type: 'success',
    });
    return { success: true };
  };

  const deleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    showToast({
      title: 'Lembrete removido',
      message: 'O lembrete foi eliminado da lista.',
      type: 'info',
    });
    return { success: true };
  };

  // ==========================================
  // MÉTODOS DE GESTÃO DE SEQUÊNCIAS
  // ==========================================

  const createSequence = async (
    data: Omit<CollectionSequence, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!account) return { success: false, error: 'Conta não autenticada' };

    const newSeq: CollectionSequence = {
      ...data,
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      accountId: account.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSequences((prev) => [newSeq, ...prev]);
    showToast({
      title: 'Sequência criada',
      message: `A estratégia "${newSeq.name}" foi guardada.`,
      type: 'success',
    });

    return { success: true, sequence: newSeq };
  };

  const updateSequence = async (id: string, data: Partial<CollectionSequence>) => {
    setSequences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s))
    );
    showToast({
      title: 'Sequência atualizada',
      message: 'As etapas da sequência foram atualizadas.',
      type: 'success',
    });
    return { success: true };
  };

  const toggleSequenceStatus = async (id: string) => {
    setSequences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString() } : s))
    );
    return { success: true };
  };

  const duplicateSequence = async (id: string) => {
    const original = sequences.find((s) => s.id === id);
    if (!original || !account) return { success: false, error: 'Sequência não encontrada' };

    const cloned: CollectionSequence = {
      ...original,
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `${original.name} (Personalizada)`,
      isPreset: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSequences((prev) => [cloned, ...prev]);
    showToast({
      title: 'Sequência duplicada',
      message: 'Pode agora personalizar livremente cada etapa da sequência.',
      type: 'success',
    });
    return { success: true };
  };

  const deleteSequence = async (id: string) => {
    setSequences((prev) => prev.filter((s) => s.id !== id));
    showToast({
      title: 'Sequência eliminada',
      message: 'A sequência foi removida.',
      type: 'info',
    });
    return { success: true };
  };

  const getRemindersForCustomer = (customerId: string) => {
    return reminders.filter((r) => r.customerId === customerId);
  };

  const getRemindersForInvoice = (invoiceId: string) => {
    return reminders.filter((r) => r.invoiceId === invoiceId);
  };

  return (
    <AutomationContext.Provider
      value={{
        automations,
        reminders,
        sequences,
        executionLogs,
        metrics,
        isLoading,
        createAutomation,
        updateAutomation,
        toggleAutomationStatus,
        duplicateAutomation,
        deleteAutomation,
        createReminder,
        resolveReminder,
        snoozeReminder,
        updateReminder,
        deleteReminder,
        createSequence,
        updateSequence,
        toggleSequenceStatus,
        duplicateSequence,
        deleteSequence,
        runEngineManually,
        getRemindersForCustomer,
        getRemindersForInvoice,
      }}
    >
      {children}
    </AutomationContext.Provider>
  );
};

export const useAutomations = (): AutomationContextType => {
  const context = useContext(AutomationContext);
  if (!context) {
    throw new Error('useAutomations deve ser utilizado dentro de um AutomationProvider');
  }
  return context;
};
