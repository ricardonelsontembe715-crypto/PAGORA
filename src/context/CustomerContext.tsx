import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Customer,
  CustomerFormData,
  CustomerFinancialStats,
  CustomerMetrics,
  Invoice,
  ActivityLog,
} from '../types/database';
import { useAuth } from './AuthContext';
import { storage } from '../lib/storage';
import { hasQuota } from '../lib/permissions';
import { PLANS } from '../config/plans';

interface CustomerContextType {
  customers: Customer[];
  allAccountCustomers: Customer[];
  isLoading: boolean;
  getCustomerById: (id: string) => Customer | undefined;
  createCustomer: (data: CustomerFormData) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  updateCustomer: (id: string, data: CustomerFormData) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  archiveCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;
  restoreCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkDuplicate: (data: { name: string; email?: string; taxId?: string }, excludeId?: string) => Customer | null;
  getCustomerStats: (customerId: string) => CustomerFinancialStats;
  getAccountCustomerMetrics: () => CustomerMetrics;
  getCustomerInvoices: (customerId: string) => Invoice[];
  getCustomerActivityLogs: (customerId: string) => ActivityLog[];
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, user } = useAuth();

  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => {
    return storage.get<Customer[]>('pagora_customers_db', []);
  });

  const [allInvoices] = useState<Invoice[]>(() => {
    return storage.get<Invoice[]>('pagora_invoices_db', []);
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    return storage.get<ActivityLog[]>('pagora_activity_logs', []);
  });

  const [isLoading] = useState<boolean>(false);

  // Sincroniza persistência de clientes
  useEffect(() => {
    storage.set('pagora_customers_db', allCustomers);
  }, [allCustomers]);

  // Sincroniza persistência de logs de atividade
  useEffect(() => {
    storage.set('pagora_activity_logs', activityLogs);
  }, [activityLogs]);

  // Sincroniza persistência de faturas
  useEffect(() => {
    storage.set('pagora_invoices_db', allInvoices);
  }, [allInvoices]);

  // Regista uma entrada de atividade
  const logActivity = (action: string, entityId: string, details?: Record<string, unknown>) => {
    if (!account || !user) return;
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      accountId: account.id,
      userId: user.id,
      action,
      entityType: 'customer',
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Clientes pertencentes estritamente à conta/workspace ativo (Isolamento Multi-Tenant)
  const allAccountCustomers = useMemo(() => {
    if (!account) return [];
    return allCustomers.filter((c) => c.accountId === account.id);
  }, [allCustomers, account]);

  // Clientes ativos por defeito
  const customers = useMemo(() => {
    return allAccountCustomers.filter((c) => c.status === 'active');
  }, [allAccountCustomers]);

  // Obter cliente por ID com verificação estrita de posse pela conta ativa
  const getCustomerById = (id: string): Customer | undefined => {
    if (!account) return undefined;
    return allCustomers.find((c) => c.id === id && c.accountId === account.id);
  };

  // Deteção inteligente de duplicação dentro da mesma conta
  const checkDuplicate = (
    data: { name: string; email?: string; taxId?: string },
    excludeId?: string
  ): Customer | null => {
    if (!account) return null;
    const cleanName = data.name.trim().toLowerCase();
    const cleanEmail = data.email?.trim().toLowerCase();
    const cleanTaxId = data.taxId?.trim().replace(/\s+/g, '');

    const accountCusts = allCustomers.filter(
      (c) => c.accountId === account.id && (!excludeId || c.id !== excludeId)
    );

    for (const c of accountCusts) {
      if (c.name.trim().toLowerCase() === cleanName) {
        return c;
      }
      if (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail) {
        return c;
      }
      if (cleanTaxId && c.taxId && c.taxId.trim().replace(/\s+/g, '') === cleanTaxId) {
        return c;
      }
    }
    return null;
  };

  // Criação de novo cliente
  const createCustomer = async (
    data: CustomerFormData
  ): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    try {
      if (!account || !user) {
        throw new Error('Sessão expirada. Inicie sessão para adicionar clientes.');
      }

      // Validação estrita de quota de clientes pelo plano ativo
      if (!hasQuota(account, 'customers', allAccountCustomers.length)) {
        const planKey = account.plan || 'free';
        const planLimit = PLANS[planKey]?.limits?.maxCustomers || 10;
        throw new Error(
          `Atingiu o limite de ${planLimit} clientes ativos do seu plano (${planKey.toUpperCase()}). Faça upgrade para o plano PLUS ou PRO para adicionar mais clientes.`
        );
      }

      const nameClean = data.name.trim();
      if (!nameClean || nameClean.length < 2) {
        throw new Error('O nome do cliente é obrigatório (mínimo de 2 caracteres).');
      }

      if (data.email && data.email.trim()) {
        const emailClean = data.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailClean)) {
          throw new Error('Por favor, introduza um endereço de e-mail válido.');
        }
      }

      const now = new Date().toISOString();
      const newCustomer: Customer = {
        id: `cus_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        accountId: account.id,
        name: nameClean,
        type: data.type || 'company',
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        taxId: data.taxId?.trim() || undefined,
        address: data.address?.trim() || undefined,
        city: data.city?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        country: data.country?.trim() || 'Portugal',
        notes: data.notes?.trim() || undefined,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      setAllCustomers((prev) => [newCustomer, ...prev]);

      logActivity('Cliente criado', newCustomer.id, {
        name: newCustomer.name,
        type: newCustomer.type,
      });

      return { success: true, customer: newCustomer };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível concluir esta ação.';
      return { success: false, error: msg };
    }
  };

  // Edição de cliente existente
  const updateCustomer = async (
    id: string,
    data: CustomerFormData
  ): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    try {
      if (!account || !user) {
        throw new Error('Sessão expirada. Inicie sessão novamente.');
      }

      const existing = getCustomerById(id);
      if (!existing) {
        throw new Error('Cliente não encontrado ou não pertence a este espaço de trabalho.');
      }

      const nameClean = data.name.trim();
      if (!nameClean || nameClean.length < 2) {
        throw new Error('O nome do cliente é obrigatório (mínimo de 2 caracteres).');
      }

      if (data.email && data.email.trim()) {
        const emailClean = data.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailClean)) {
          throw new Error('Por favor, introduza um endereço de e-mail válido.');
        }
      }

      const now = new Date().toISOString();
      const updatedCustomer: Customer = {
        ...existing,
        name: nameClean,
        type: data.type,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        taxId: data.taxId?.trim() || undefined,
        address: data.address?.trim() || undefined,
        city: data.city?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        country: data.country?.trim() || 'Portugal',
        notes: data.notes?.trim() || undefined,
        updatedAt: now,
      };

      setAllCustomers((prev) => prev.map((c) => (c.id === id ? updatedCustomer : c)));

      logActivity('Dados do cliente atualizados', id, {
        name: updatedCustomer.name,
      });

      return { success: true, customer: updatedCustomer };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível concluir esta ação.';
      return { success: false, error: msg };
    }
  };

  // Arquivamento de cliente (Soft delete / Archive)
  const archiveCustomer = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!account) throw new Error('Sessão expirada.');
      const existing = getCustomerById(id);
      if (!existing) throw new Error('Cliente não encontrado.');

      const now = new Date().toISOString();
      const updated: Customer = {
        ...existing,
        status: 'archived',
        archivedAt: now,
        updatedAt: now,
      };

      setAllCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));

      logActivity('Cliente arquivado', id, { name: existing.name });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível concluir esta ação.';
      return { success: false, error: msg };
    }
  };

  // Restauração de cliente arquivado
  const restoreCustomer = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!account) throw new Error('Sessão expirada.');
      const existing = getCustomerById(id);
      if (!existing) throw new Error('Cliente não encontrado.');

      const now = new Date().toISOString();
      const updated: Customer = {
        ...existing,
        status: 'active',
        archivedAt: undefined,
        updatedAt: now,
      };

      setAllCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));

      logActivity('Cliente restaurado', id, { name: existing.name });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível concluir esta ação.';
      return { success: false, error: msg };
    }
  };

  // Obter faturas de um cliente específico (com isolamento multi-tenant)
  const getCustomerInvoices = (customerId: string): Invoice[] => {
    if (!account) return [];
    const currentInvoices = storage.get<Invoice[]>('pagora_invoices_db', []);
    return currentInvoices.filter(
      (inv) => inv.customerId === customerId && inv.accountId === account.id
    );
  };

  // Eliminação definitiva com política estrita de proteção financeira
  const deleteCustomer = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!account) throw new Error('Sessão expirada.');
      const existing = getCustomerById(id);
      if (!existing) throw new Error('Cliente não encontrado.');

      // Verifica se o cliente tem faturas associadas
      const currentInvoices = storage.get<Invoice[]>('pagora_invoices_db', []);
      const hasInvoices = currentInvoices.some(
        (inv) => inv.customerId === id && inv.accountId === account.id
      );

      if (hasInvoices) {
        throw new Error(
          'Não é possível eliminar definitivamente um cliente com histórico de cobranças ou faturas. Por favor, arquive o cliente para preservar a integridade dos dados fiscais.'
        );
      }

      setAllCustomers((prev) => prev.filter((c) => c.id !== id));
      setActivityLogs((prev) => prev.filter((l) => l.entityId !== id));

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível concluir esta ação.';
      return { success: false, error: msg };
    }
  };

  // Obter estatísticas financeiras reais do cliente
  const getCustomerStats = (customerId: string): CustomerFinancialStats => {
    const invoices = getCustomerInvoices(customerId);

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let overdueInvoicesCount = 0;
    let lastInvoiceDate: string | undefined = undefined;
    let lastPaymentDate: string | undefined = undefined;

    invoices.forEach((inv) => {
      totalInvoiced += inv.amount;
      totalPaid += inv.paidAmount;

      const remaining = Math.max(0, inv.amount - inv.paidAmount);

      if (inv.status === 'overdue') {
        totalOverdue += remaining;
        overdueInvoicesCount += 1;
      } else if (inv.status === 'pending' || inv.status === 'partially_paid') {
        totalPending += remaining;
      }

      if (!lastInvoiceDate || new Date(inv.issueDate) > new Date(lastInvoiceDate)) {
        lastInvoiceDate = inv.issueDate;
      }
      if (inv.status === 'paid' && (!lastPaymentDate || new Date(inv.updatedAt) > new Date(lastPaymentDate))) {
        lastPaymentDate = inv.updatedAt;
      }
    });

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      invoicesCount: invoices.length,
      overdueInvoicesCount,
      lastInvoiceDate,
      lastPaymentDate,
    };
  };

  // Obter métricas globais da secção de clientes para o espaço ativo
  const getAccountCustomerMetrics = (): CustomerMetrics => {
    const accCustomers = allAccountCustomers;
    const totalCustomers = accCustomers.length;
    const activeCustomers = accCustomers.filter((c) => c.status === 'active').length;
    const archivedCustomers = accCustomers.filter((c) => c.status === 'archived').length;

    let customersWithPending = 0;
    let customersWithOverdue = 0;

    accCustomers.forEach((c) => {
      const stats = getCustomerStats(c.id);
      if (stats.totalPending > 0) {
        customersWithPending += 1;
      }
      if (stats.totalOverdue > 0) {
        customersWithOverdue += 1;
      }
    });

    return {
      totalCustomers,
      activeCustomers,
      archivedCustomers,
      customersWithPending,
      customersWithOverdue,
    };
  };

  // Obter logs de atividade reais para um cliente
  const getCustomerActivityLogs = (customerId: string): ActivityLog[] => {
    if (!account) return [];
    return activityLogs.filter(
      (log) =>
        log.accountId === account.id &&
        log.entityType === 'customer' &&
        log.entityId === customerId
    );
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        allAccountCustomers,
        isLoading,
        getCustomerById,
        createCustomer,
        updateCustomer,
        archiveCustomer,
        restoreCustomer,
        deleteCustomer,
        checkDuplicate,
        getCustomerStats,
        getAccountCustomerMetrics,
        getCustomerInvoices,
        getCustomerActivityLogs,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers deve ser utilizado dentro de um CustomerProvider');
  }
  return context;
};
