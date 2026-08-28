import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Invoice,
  InvoiceFormData,
  InvoicePayment,
  InvoicePaymentFormData,
  PaymentPromise,
  PaymentPromiseFormData,
  PaymentPromiseStatus,
  InvoiceMetrics,
  ActivityLog,
  Customer,
} from '../types/database';
import { useAuth } from './AuthContext';
import { useCustomers } from './CustomerContext';
import { storage } from '../lib/storage';
import { getDaysOverdue, isDatePassed, isValidUrl } from '../lib/formatters';
import { hasFeature, hasQuota } from '../lib/permissions';
import { PLANS } from '../config/plans';

interface InvoiceContextType {
  invoices: Invoice[];
  allAccountInvoices: Invoice[];
  payments: InvoicePayment[];
  promises: PaymentPromise[];
  activityLogs: ActivityLog[];
  isLoading: boolean;
  getInvoiceById: (id: string) => Invoice | undefined;
  createInvoice: (data: InvoiceFormData) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  updateInvoice: (id: string, data: Partial<InvoiceFormData>) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  cancelInvoice: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  reopenInvoice: (id: string) => Promise<{ success: boolean; error?: string }>;
  recordPayment: (invoiceId: string, data: InvoicePaymentFormData) => Promise<{ success: boolean; payment?: InvoicePayment; error?: string }>;
  recordPromise: (invoiceId: string, data: PaymentPromiseFormData) => Promise<{ success: boolean; promise?: PaymentPromise; error?: string }>;
  updatePromiseStatus: (promiseId: string, status: PaymentPromiseStatus) => Promise<{ success: boolean; error?: string }>;
  getInvoicePayments: (invoiceId: string) => InvoicePayment[];
  getInvoicePromises: (invoiceId: string) => PaymentPromise[];
  getInvoiceTimeline: (invoiceId: string) => ActivityLog[];
  getAccountInvoiceMetrics: () => InvoiceMetrics;
  generateInvoiceNumber: () => string;
  checkInvoiceNumberUnique: (num: string, excludeId?: string) => boolean;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, user } = useAuth();
  const { getCustomerById } = useCustomers();

  const [allInvoices, setAllInvoices] = useState<Invoice[]>(() => {
    return storage.get<Invoice[]>('pagora_invoices_db', []);
  });

  const [allPayments, setAllPayments] = useState<InvoicePayment[]>(() => {
    return storage.get<InvoicePayment[]>('pagora_payments_db', []);
  });

  const [allPromises, setAllPromises] = useState<PaymentPromise[]>(() => {
    return storage.get<PaymentPromise[]>('pagora_promises_db', []);
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    return storage.get<ActivityLog[]>('pagora_activity_logs', []);
  });

  const [isLoading] = useState<boolean>(false);

  // Sincronizar persistência
  useEffect(() => {
    storage.set('pagora_invoices_db', allInvoices);
  }, [allInvoices]);

  useEffect(() => {
    storage.set('pagora_payments_db', allPayments);
  }, [allPayments]);

  useEffect(() => {
    storage.set('pagora_promises_db', allPromises);
  }, [allPromises]);

  // Função auxiliar para registar atividade
  const logActivity = useCallback(
    (
      action: string,
      entityType: 'invoice' | 'payment',
      entityId: string,
      details?: Record<string, unknown>
    ) => {
      if (!account || !user) return;
      const newLog: ActivityLog = {
        id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        accountId: account.id,
        userId: user.id,
        action,
        entityType,
        entityId,
        details,
        createdAt: new Date().toISOString(),
      };
      setActivityLogs((prev) => {
        const updated = [newLog, ...prev];
        storage.set('pagora_activity_logs', updated);
        return updated;
      });
    },
    [account, user]
  );

  // Invoices do workspace ativo (Isolamento Multi-Tenant)
  const allAccountInvoices = useMemo(() => {
    if (!account) return [];
    return allInvoices.filter((i) => i.accountId === account.id);
  }, [allInvoices, account]);

  // Processa dinamicamente os estados com base no atraso e pagamentos
  const invoices = useMemo(() => {
    return allAccountInvoices.map((inv) => {
      if (inv.status === 'canceled' || inv.status === 'draft') {
        return inv;
      }
      const remaining = inv.amount - (inv.paidAmount || 0);
      if (remaining <= 0) {
        if (inv.status !== 'paid') {
          return { ...inv, status: 'paid' as const };
        }
        return inv;
      }
      // Se tiver saldo por receber e a data de vencimento tiver passado
      const isOverdue = isDatePassed(inv.dueDate);
      if (isOverdue) {
        if (inv.status !== 'overdue') {
          return { ...inv, status: 'overdue' as const };
        }
      } else {
        if (inv.paidAmount > 0) {
          if (inv.status !== 'partially_paid') {
            return { ...inv, status: 'partially_paid' as const };
          }
        } else {
          if (inv.status !== 'pending') {
            return { ...inv, status: 'pending' as const };
          }
        }
      }
      return inv;
    });
  }, [allAccountInvoices]);

  // Pagamentos do workspace ativo
  const payments = useMemo(() => {
    if (!account) return [];
    return allPayments.filter((p) => p.accountId === account.id);
  }, [allPayments, account]);

  // Promessas do workspace ativo
  const promises = useMemo(() => {
    if (!account) return [];
    return allPromises.filter((p) => p.accountId === account.id);
  }, [allPromises, account]);

  // Atividades do workspace ativo
  const accountActivityLogs = useMemo(() => {
    if (!account) return [];
    return activityLogs.filter((l) => l.accountId === account.id);
  }, [activityLogs, account]);

  // Obter cobrança por ID
  const getInvoiceById = useCallback(
    (id: string): Invoice | undefined => {
      if (!account) return undefined;
      return invoices.find((i) => i.id === id && i.accountId === account.id);
    },
    [invoices, account]
  );

  // Verificar se o número de cobrança é único dentro da conta
  const checkInvoiceNumberUnique = useCallback(
    (num: string, excludeId?: string): boolean => {
      if (!account) return false;
      const cleanNum = num.trim().toUpperCase();
      return !allInvoices.some(
        (i) =>
          i.accountId === account.id &&
          i.invoiceNumber.trim().toUpperCase() === cleanNum &&
          (!excludeId || i.id !== excludeId)
      );
    },
    [allInvoices, account]
  );

  // Gerar referência sequencial única (ex: PG-2026-0001)
  const generateInvoiceNumber = useCallback((): string => {
    if (!account) return 'PG-2026-0001';
    const currentYear = new Date().getFullYear();
    const prefix = `PG-${currentYear}-`;

    const accountInvs = allInvoices.filter((i) => i.accountId === account.id);
    const existingSeqNumbers: number[] = [];

    accountInvs.forEach((inv) => {
      if (inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)) {
        const numPart = parseInt(inv.invoiceNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart)) {
          existingSeqNumbers.push(numPart);
        }
      }
    });

    const nextSeq = existingSeqNumbers.length > 0 ? Math.max(...existingSeqNumbers) + 1 : accountInvs.length + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }, [allInvoices, account]);

  // Criar nova cobrança
  const createInvoice = async (
    data: InvoiceFormData
  ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
    try {
      if (!account || !user) {
        throw new Error('Sessão expirada. Inicie sessão para registar cobranças.');
      }

      // Validação estrita de quota de cobranças mensais pelo plano ativo
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const monthlyInvoicesCount = allAccountInvoices.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      if (!hasQuota(account, 'invoices', monthlyInvoicesCount)) {
        const planKey = account.plan || 'free';
        const planLimit = PLANS[planKey]?.limits?.maxInvoicesPerMonth || 10;
        throw new Error(
          `Atingiu o limite de ${planLimit} cobranças emitidas este mês no seu plano (${planKey.toUpperCase()}). Faça upgrade para o plano PLUS ou PRO para emitir mais cobranças.`
        );
      }

      // Validação do cliente
      if (!data.customerId || !data.customerId.trim()) {
        throw new Error('Por favor, selecione um cliente.');
      }

      const customer = getCustomerById(data.customerId);
      if (!customer) {
        throw new Error('Cliente inválido ou não pertence a esta conta.');
      }

      // Validação do valor
      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('O valor da cobrança deve ser um número positivo superior a 0,00 €.');
      }

      // Validação das datas
      if (!data.issueDate || !data.dueDate) {
        throw new Error('As datas de emissão e de vencimento são obrigatórias.');
      }

      const issueTime = new Date(data.issueDate).getTime();
      const dueTime = new Date(data.dueDate).getTime();
      if (isNaN(issueTime) || isNaN(dueTime)) {
        throw new Error('Por favor, introduza datas válidas.');
      }

      // Validação do link de pagamento
      if (data.paymentLink && data.paymentLink.trim()) {
        if (!isValidUrl(data.paymentLink)) {
          throw new Error('O link de pagamento introduzido não é um URL válido (deve começar por http:// ou https://).');
        }
      }

      // Gerar ou validar referência
      let refNumber = data.invoiceNumber?.trim() || '';
      if (!refNumber) {
        refNumber = generateInvoiceNumber();
      } else if (!checkInvoiceNumberUnique(refNumber)) {
        throw new Error(`Já existe uma cobrança com a referência "${refNumber}" nesta conta.`);
      }

      // Determinar estado inicial
      const isOverdue = isDatePassed(data.dueDate);
      const initialStatus = isOverdue ? 'overdue' : 'pending';

      const now = new Date().toISOString();
      const newInvoice: Invoice = {
        id: `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        accountId: account.id,
        customerId: data.customerId,
        invoiceNumber: refNumber,
        description: data.description?.trim() || undefined,
        amount: Math.round(numAmount * 100) / 100,
        paidAmount: 0,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        status: initialStatus,
        paymentMethod: data.paymentMethod || 'bank_transfer',
        paymentLink: data.paymentLink?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      setAllInvoices((prev) => [newInvoice, ...prev]);

      logActivity('Cobrança criada', 'invoice', newInvoice.id, {
        invoiceNumber: newInvoice.invoiceNumber,
        customerName: customer.name,
        amount: newInvoice.amount,
        dueDate: newInvoice.dueDate,
      });

      return { success: true, invoice: newInvoice };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível registar a cobrança.';
      return { success: false, error: msg };
    }
  };

  // Atualizar dados da cobrança
  const updateInvoice = async (
    id: string,
    data: Partial<InvoiceFormData>
  ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
    try {
      if (!account || !user) throw new Error('Sessão expirada.');

      const existing = getInvoiceById(id);
      if (!existing) {
        throw new Error('Cobrança não encontrada ou sem permissões de acesso.');
      }

      if (existing.status === 'canceled') {
        throw new Error('Não é possível editar uma cobrança cancelada. Reabra-a primeiro.');
      }

      // Se alterou o número, validar unicidade
      if (data.invoiceNumber && data.invoiceNumber.trim() !== existing.invoiceNumber) {
        if (!checkInvoiceNumberUnique(data.invoiceNumber.trim(), id)) {
          throw new Error(`A referência "${data.invoiceNumber}" já está a ser utilizada.`);
        }
      }

      // Se alterou o valor, não permitir valor menor que o já pago
      let newAmount = existing.amount;
      if (data.amount !== undefined) {
        const parsed = Number(data.amount);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error('O valor da cobrança deve ser um número positivo superior a 0,00 €.');
        }
        if (parsed < existing.paidAmount) {
          throw new Error(
            `O novo valor (${parsed.toFixed(2)} €) não pode ser inferior ao montante já pago (${existing.paidAmount.toFixed(2)} €).`
          );
        }
        newAmount = Math.round(parsed * 100) / 100;
      }

      // Validação do link de pagamento
      if (data.paymentLink && data.paymentLink.trim()) {
        if (!isValidUrl(data.paymentLink)) {
          throw new Error('O link de pagamento introduzido não é um URL válido.');
        }
      }

      const now = new Date().toISOString();
      const updated: Invoice = {
        ...existing,
        invoiceNumber: data.invoiceNumber?.trim() || existing.invoiceNumber,
        description: data.description !== undefined ? data.description.trim() || undefined : existing.description,
        amount: newAmount,
        issueDate: data.issueDate || existing.issueDate,
        dueDate: data.dueDate || existing.dueDate,
        paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : existing.paymentMethod,
        paymentLink: data.paymentLink !== undefined ? data.paymentLink.trim() || undefined : existing.paymentLink,
        notes: data.notes !== undefined ? data.notes.trim() || undefined : existing.notes,
        updatedAt: now,
      };

      setAllInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));

      logActivity('Dados da cobrança alterados', 'invoice', id, {
        invoiceNumber: updated.invoiceNumber,
        amount: updated.amount,
      });

      return { success: true, invoice: updated };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível atualizar a cobrança.';
      return { success: false, error: msg };
    }
  };

  // Cancelar cobrança (preservando integridade e histórico)
  const cancelInvoice = async (id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!account || !user) throw new Error('Sessão expirada.');
      const existing = getInvoiceById(id);
      if (!existing) throw new Error('Cobrança não encontrada.');

      if (existing.status === 'canceled') {
        throw new Error('Esta cobrança já se encontra cancelada.');
      }

      const now = new Date().toISOString();
      const updated: Invoice = {
        ...existing,
        status: 'canceled',
        canceledAt: now,
        cancelReason: reason?.trim() || undefined,
        updatedAt: now,
      };

      setAllInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));

      logActivity('Cobrança cancelada', 'invoice', id, {
        invoiceNumber: existing.invoiceNumber,
        reason: reason || 'Sem motivo especificado',
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cancelar a cobrança.';
      return { success: false, error: msg };
    }
  };

  // Reabrir cobrança cancelada
  const reopenInvoice = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!account || !user) throw new Error('Sessão expirada.');
      const existing = getInvoiceById(id);
      if (!existing) throw new Error('Cobrança não encontrada.');

      if (existing.status !== 'canceled') {
        throw new Error('Apenas cobranças canceladas podem ser reabertas.');
      }

      const remaining = existing.amount - (existing.paidAmount || 0);
      let newStatus: Invoice['status'] = 'pending';
      if (remaining <= 0) {
        newStatus = 'paid';
      } else if (isDatePassed(existing.dueDate)) {
        newStatus = 'overdue';
      } else if (existing.paidAmount > 0) {
        newStatus = 'partially_paid';
      }

      const now = new Date().toISOString();
      const updated: Invoice = {
        ...existing,
        status: newStatus,
        canceledAt: undefined,
        cancelReason: undefined,
        updatedAt: now,
      };

      setAllInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));

      logActivity('Cobrança reaberta', 'invoice', id, {
        invoiceNumber: existing.invoiceNumber,
        newStatus,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível reabrir a cobrança.';
      return { success: false, error: msg };
    }
  };

  // Registar pagamento (total ou parcial)
  const recordPayment = async (
    invoiceId: string,
    data: InvoicePaymentFormData
  ): Promise<{ success: boolean; payment?: InvoicePayment; error?: string }> => {
    try {
      if (!account || !user) throw new Error('Sessão expirada.');
      const invoice = getInvoiceById(invoiceId);
      if (!invoice) throw new Error('Cobrança não encontrada.');

      if (invoice.status === 'canceled') {
        throw new Error('Não é possível registar pagamentos numa cobrança cancelada.');
      }

      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('O valor do pagamento deve ser um montante positivo superior a 0,00 €.');
      }

      const remainingBalance = Math.round((invoice.amount - invoice.paidAmount) * 100) / 100;
      const paymentAmount = Math.round(numAmount * 100) / 100;

      // Proteção Financeira: Aviso se valor superior ao restante
      if (paymentAmount > remainingBalance + 0.001) {
        throw new Error(
          `O valor indicado (${paymentAmount.toFixed(2)} €) é superior ao saldo em aberto (${remainingBalance.toFixed(2)} €).`
        );
      }

      if (!data.paymentDate) {
        throw new Error('A data do pagamento é obrigatória.');
      }

      const now = new Date().toISOString();
      const newPayment: InvoicePayment = {
        id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        accountId: account.id,
        invoiceId: invoice.id,
        amount: paymentAmount,
        paymentDate: data.paymentDate,
        method: data.method || 'bank_transfer',
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        createdAt: now,
      };

      const newPaidTotal = Math.round((invoice.paidAmount + paymentAmount) * 100) / 100;
      const isFullyPaid = newPaidTotal >= invoice.amount - 0.001;

      const updatedInvoice: Invoice = {
        ...invoice,
        paidAmount: Math.min(newPaidTotal, invoice.amount),
        status: isFullyPaid ? 'paid' : 'partially_paid',
        updatedAt: now,
      };

      // Adiciona o pagamento
      setAllPayments((prev) => [newPayment, ...prev]);

      // Atualiza a cobrança
      setAllInvoices((prev) => prev.map((i) => (i.id === invoiceId ? updatedInvoice : i)));

      // Se houver promessas pendentes para esta cobrança, atualizar se foi pago integralmente
      if (isFullyPaid) {
        setAllPromises((prev) =>
          prev.map((pr) =>
            pr.invoiceId === invoiceId && pr.status === 'pending'
              ? { ...pr, status: 'kept', updatedAt: now }
              : pr
          )
        );
      }

      logActivity(
        isFullyPaid ? 'Cobrança liquidada (Total)' : 'Pagamento parcial registado',
        'payment',
        newPayment.id,
        {
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: paymentAmount,
          remaining: Math.max(0, invoice.amount - newPaidTotal),
          method: newPayment.method,
        }
      );

      return { success: true, payment: newPayment };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível registar o pagamento.';
      return { success: false, error: msg };
    }
  };

  // Registar promessa de pagamento
  const recordPromise = async (
    invoiceId: string,
    data: PaymentPromiseFormData
  ): Promise<{ success: boolean; promise?: PaymentPromise; error?: string }> => {
    try {
      if (!account || !user) throw new Error('Sessão expirada.');

      // Validação de funcionalidade por plano (disponível em PLUS e PRO)
      if (!hasFeature(account, 'feature.payment_promises')) {
        throw new Error(
          'O registo e gestão de promessas de pagamento está disponível a partir do plano PLUS. Faça upgrade para desbloquear.'
        );
      }

      const invoice = getInvoiceById(invoiceId);
      if (!invoice) throw new Error('Cobrança não encontrada.');

      if (invoice.status === 'canceled' || invoice.status === 'paid') {
        throw new Error('Não é possível registar promessas numa cobrança cancelada ou já liquidada.');
      }

      if (!data.promisedDate) {
        throw new Error('A data prometida para o pagamento é obrigatória.');
      }

      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('O valor prometido deve ser superior a 0,00 €.');
      }

      const remainingBalance = invoice.amount - invoice.paidAmount;
      if (numAmount > remainingBalance + 0.001) {
        throw new Error(
          `O valor prometido (${numAmount.toFixed(2)} €) não pode ser superior ao saldo em aberto (${remainingBalance.toFixed(2)} €).`
        );
      }

      const now = new Date().toISOString();
      const newPromise: PaymentPromise = {
        id: `prom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        accountId: account.id,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        promisedDate: data.promisedDate,
        amount: Math.round(numAmount * 100) / 100,
        status: 'pending',
        notes: data.notes?.trim() || undefined,
        createdAt: now,
      };

      setAllPromises((prev) => [newPromise, ...prev]);

      logActivity('Promessa de pagamento registada', 'invoice', invoice.id, {
        invoiceNumber: invoice.invoiceNumber,
        promisedDate: newPromise.promisedDate,
        amount: newPromise.amount,
      });

      return { success: true, promise: newPromise };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível registar a promessa de pagamento.';
      return { success: false, error: msg };
    }
  };

  // Atualizar estado de uma promessa (cumprida, não cumprida, cancelada)
  const updatePromiseStatus = async (
    promiseId: string,
    status: PaymentPromiseStatus
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!account) throw new Error('Sessão expirada.');
      const existing = allPromises.find((p) => p.id === promiseId && p.accountId === account.id);
      if (!existing) throw new Error('Promessa não encontrada.');

      const now = new Date().toISOString();
      const updated: PaymentPromise = {
        ...existing,
        status,
        updatedAt: now,
      };

      setAllPromises((prev) => prev.map((p) => (p.id === promiseId ? updated : p)));

      logActivity(`Promessa de pagamento marcada como ${status}`, 'invoice', existing.invoiceId, {
        promiseId,
        newStatus: status,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível atualizar a promessa.';
      return { success: false, error: msg };
    }
  };

  // Obter pagamentos de uma fatura
  const getInvoicePayments = useCallback(
    (invoiceId: string): InvoicePayment[] => {
      if (!account) return [];
      return payments.filter((p) => p.invoiceId === invoiceId && p.accountId === account.id);
    },
    [payments, account]
  );

  // Obter promessas de uma fatura
  const getInvoicePromises = useCallback(
    (invoiceId: string): PaymentPromise[] => {
      if (!account) return [];
      return promises.filter((p) => p.invoiceId === invoiceId && p.accountId === account.id);
    },
    [promises, account]
  );

  // Obter timeline de eventos de uma fatura
  const getInvoiceTimeline = useCallback(
    (invoiceId: string): ActivityLog[] => {
      if (!account) return [];
      return activityLogs.filter(
        (log) =>
          log.accountId === account.id &&
          ((log.entityType === 'invoice' && log.entityId === invoiceId) ||
            (log.entityType === 'payment' && log.details?.invoiceNumber))
      );
    },
    [activityLogs, account]
  );

  // Métricas globais reais do módulo de cobranças
  const getAccountInvoiceMetrics = useCallback((): InvoiceMetrics => {
    let totalReceivable = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let paidAmount = 0;

    let overdueInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let paidInvoicesCount = 0;

    invoices.forEach((inv) => {
      paidAmount += inv.paidAmount || 0;

      if (inv.status === 'canceled' || inv.status === 'draft') {
        return;
      }

      const remaining = Math.max(0, inv.amount - (inv.paidAmount || 0));

      if (inv.status === 'paid' || remaining <= 0) {
        paidInvoicesCount += 1;
      } else if (inv.status === 'overdue' || (isDatePassed(inv.dueDate) && remaining > 0)) {
        overdueAmount += remaining;
        totalReceivable += remaining;
        overdueInvoicesCount += 1;
      } else {
        // 'pending' ou 'partially_paid' no prazo
        pendingAmount += remaining;
        totalReceivable += remaining;
        pendingInvoicesCount += 1;
      }
    });

    const activePromisesCount = promises.filter((pr) => pr.status === 'pending').length;

    return {
      totalReceivable,
      pendingAmount,
      overdueAmount,
      paidAmount,
      totalInvoicesCount: invoices.length,
      overdueInvoicesCount,
      pendingInvoicesCount,
      paidInvoicesCount,
      activePromisesCount,
    };
  }, [invoices, promises]);

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        allAccountInvoices,
        payments,
        promises,
        activityLogs: accountActivityLogs,
        isLoading,
        getInvoiceById,
        createInvoice,
        updateInvoice,
        cancelInvoice,
        reopenInvoice,
        recordPayment,
        recordPromise,
        updatePromiseStatus,
        getInvoicePayments,
        getInvoicePromises,
        getInvoiceTimeline,
        getAccountInvoiceMetrics,
        generateInvoiceNumber,
        checkInvoiceNumberUnique,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = (): InvoiceContextType => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices deve ser utilizado dentro de um InvoiceProvider');
  }
  return context;
};
