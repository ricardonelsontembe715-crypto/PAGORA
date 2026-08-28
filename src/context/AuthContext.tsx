import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Account, PlanType, AdminUser } from '../types/database';
import {
  AuthState,
  SignInCredentials,
  SignUpCredentials,
  ProfileUpdateData,
  OnboardingData,
  CreateWorkspaceData,
  RegisteredUserRecord,
} from '../types/auth';
import {
  DetailedSubscription,
  BillingTransaction,
  WebhookEventRecord,
} from '../types/billing';
import {
  CompanyIdentityData,
  BillingSettingsData,
  MessageSettingsData,
  AutomationSettingsData,
  NotificationPreferencesData,
  UserSessionRecord,
  UserProfileData,
} from '../types/settings';
import { storage } from '../lib/storage';
import { BillingService } from '../lib/billingService';
import { AdminAuthService } from '../lib/adminAuthService';
import { sendTransactionalEmail } from '../lib/emailService';

interface AuthContextType extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  switchAccount: (accountId: string) => void;
  createWorkspace: (data: CreateWorkspaceData) => Promise<{ success: boolean; account?: Account; error?: string }>;
  completeOnboarding: (data: OnboardingData) => Promise<{ success: boolean; error?: string }>;
  skipOnboarding: () => Promise<void>;
  updateAccountPlan: (plan: PlanType) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; simulatedToken?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // PARTE 10 & 11 - Configurações detalhadas & Subscrições
  userProfile: UserProfileData;
  updateUserProfile: (data: Partial<UserProfileData>) => void;

  companySettings: CompanyIdentityData;
  updateCompanySettings: (data: Partial<CompanyIdentityData>) => void;

  billingSettings: BillingSettingsData;
  updateBillingSettings: (data: Partial<BillingSettingsData>) => void;

  messageSettings: MessageSettingsData;
  updateMessageSettings: (data: Partial<MessageSettingsData>) => void;

  automationSettings: AutomationSettingsData;
  updateAutomationSettings: (data: Partial<AutomationSettingsData>) => void;

  notificationPreferences: NotificationPreferencesData;
  updateNotificationPreferences: (data: Partial<NotificationPreferencesData>) => void;

  sessions: UserSessionRecord[];
  terminateOtherSessions: () => void;

  subscription: DetailedSubscription;
  billingHistory: BillingTransaction[];
  upgradePlan: (plan: PlanType, method?: string) => Promise<{ success: boolean; error?: string }>;
  downgradePlan: (plan: PlanType) => Promise<{ success: boolean; error?: string }>;
  cancelUserSubscription: (reason?: string, immediate?: boolean) => Promise<{ success: boolean; error?: string }>;

  allAccounts: Account[];
  findAccount: (identifier: string) => Account | undefined;
  processExternalWebhook: (event: WebhookEventRecord) => { success: boolean; status: string; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Contas e utilizador padrão
const DEFAULT_USER: User = {
  id: 'usr_default_01',
  name: 'Ricardo Tembe',
  email: 'ricardo@pagora.pt',
  phone: '912 345 678',
  onboardingCompleted: true,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-20T15:30:00.000Z',
};

const DEFAULT_ACCOUNT: Account = {
  id: 'acc_pt_01',
  name: 'Estúdio Design & Consultoria',
  taxId: 'PT509123456',
  currency: 'EUR',
  plan: 'plus', // Começa no PLUS para demonstrar o modelo cumulativo
  ownerId: 'usr_default_01',
  activityType: 'Consultoria e Design',
  usagePurpose: 'Organizar cobranças e faturas',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-20T15:30:00.000Z',
};

const SECONDARY_ACCOUNT: Account = {
  id: 'acc_pt_02',
  name: 'Serviços Comerciais Norte',
  taxId: 'PT508987654',
  currency: 'EUR',
  plan: 'free',
  ownerId: 'usr_default_01',
  activityType: 'Comércio e Serviços',
  usagePurpose: 'Acompanhar pagamentos pendentes',
  createdAt: '2026-08-10T14:00:00.000Z',
  updatedAt: '2026-08-20T15:30:00.000Z',
};

const ADMIN_USER: User = {
  id: 'usr_admin_01',
  name: 'Administrador Pagora',
  email: 'admin@pagora.pt',
  phone: '910 000 001',
  onboardingCompleted: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-20T15:30:00.000Z',
};

const ADMIN_ACCOUNT: Account = {
  id: 'acc_admin_01',
  name: 'Pagora Operações Centrais',
  taxId: 'PT511222333',
  currency: 'EUR',
  plan: 'pro',
  ownerId: 'usr_admin_01',
  activityType: 'Operações e Administração',
  usagePurpose: 'Gestão e monitorização do sistema',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-20T15:30:00.000Z',
};

const INITIAL_REGISTERED_USERS: RegisteredUserRecord[] = [
  {
    user: DEFAULT_USER,
    passwordHash: 'password123',
    accounts: [DEFAULT_ACCOUNT, SECONDARY_ACCOUNT],
    primaryAccountId: DEFAULT_ACCOUNT.id,
  },
];

const ADMIN_REGISTRY: AdminUser[] = [
  {
    id: 'adm_01',
    userId: 'usr_admin_01',
    role: 'superadmin',
    permissions: ['all'],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const INITIAL_SESSIONS: UserSessionRecord[] = [
  {
    id: 'sess_01',
    device: 'Desktop (macOS)',
    browser: 'Chrome 128 (Lisboa, PT)',
    location: 'Lisboa, Portugal',
    ipAddress: '194.65.22.10',
    isCurrent: true,
    lastActiveAt: new Date().toISOString(),
    createdAt: '2026-08-24T08:00:00.000Z',
  },
  {
    id: 'sess_02',
    device: 'Mobile (iPhone iOS 18)',
    browser: 'Safari Mobile (Porto, PT)',
    location: 'Porto, Portugal',
    ipAddress: '85.240.110.45',
    isCurrent: false,
    lastActiveAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    createdAt: '2026-08-22T14:15:00.000Z',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializa repositório de utilizadores registados
  const [usersDb, setUsersDb] = useState<RegisteredUserRecord[]>(() =>
    storage.get<RegisteredUserRecord[]>('registered_users_db', INITIAL_REGISTERED_USERS)
  );

  // Verificação de persistência de sessão segura (expiração após 7 dias de inatividade)
  const getInitialUserSession = () => {
    const savedUser = storage.get<User | null>('current_user', null);
    if (!savedUser) return { user: null, account: null, accounts: [] };

    const sessionMeta = storage.get<{ lastActiveAt: number } | null>('pagora_session_meta', null);
    const now = Date.now();
    const MAX_SESSION_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

    if (sessionMeta && sessionMeta.lastActiveAt && now - sessionMeta.lastActiveAt > MAX_SESSION_AGE) {
      // Sessão expirou após 7 dias de inatividade
      storage.remove('current_user');
      storage.remove('current_account');
      storage.remove('pagora_session_meta');
      return { user: null, account: null, accounts: [] };
    }

    // Sessão válida: atualiza timestamp de atividade para manter a sessão fresca
    storage.set('pagora_session_meta', { lastActiveAt: now });

    const savedAccount = storage.get<Account | null>('current_account', null);
    const savedAccounts = storage.get<Account[]>('user_accounts', savedAccount ? [savedAccount] : []);
    return { user: savedUser, account: savedAccount, accounts: savedAccounts };
  };

  const initialSession = getInitialUserSession();

  const [user, setUser] = useState<User | null>(initialSession.user);
  const [account, setAccount] = useState<Account | null>(initialSession.account);
  const [accounts, setAccounts] = useState<Account[]>(initialSession.accounts);
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => Boolean(AdminAuthService.getSessionToken()));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Atualiza heartbeat de atividade da sessão
  useEffect(() => {
    if (user) {
      storage.set('pagora_session_meta', { lastActiveAt: Date.now() });
    }
  }, [user]);

  // Estados de Configurações
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => ({
    id: user?.id || 'usr_default_01',
    name: user?.name || 'Ricardo Tembe',
    email: user?.email || 'ricardo@pagora.pt',
    phone: user?.phone || '912 345 678',
    roleTitle: 'Diretor Comercial / Fundador',
    language: 'pt-PT',
    timezone: 'Europe/Lisbon (UTC+0 / UTC+1)',
    lastLoginAt: '2026-08-24T08:00:00.000Z',
  }));

  const [companySettings, setCompanySettings] = useState<CompanyIdentityData>(() => ({
    id: account?.id || 'acc_pt_01',
    name: account?.name || 'Estúdio Design & Consultoria',
    commercialName: 'Estúdio Design & Consultoria Lda.',
    taxId: account?.taxId || 'PT509123456',
    email: 'contacto@estudiodesign.pt',
    phone: '912 345 678',
    address: 'Avenida da Liberdade, 145, 3º Dto',
    city: 'Lisboa',
    postalCode: '1250-142',
    country: 'Portugal',
    website: 'https://estudiodesign.pt',
    currency: 'EUR',
    timezone: 'Europe/Lisbon',
  }));

  const [billingSettings, setBillingSettings] = useState<BillingSettingsData>(() => ({
    defaultCurrency: 'EUR',
    invoicePrefix: 'FT 2026/',
    defaultDueDays: 30,
    preferredPaymentMethod: 'mbway',
    overdueGracePeriodDays: 2,
    autoFlagOverdue: true,
    brokenPromiseThresholdDays: 1,
  }));

  const [messageSettings, setMessageSettings] = useState<MessageSettingsData>(() => ({
    defaultTone: 'professional',
    defaultChannel: 'whatsapp',
    includeReference: true,
    includeAmount: true,
    includeDueDate: true,
    includeTotalDebt: true,
    includePaymentLink: true,
    includeBankDetails: true,
    customPaymentDetails: 'IBAN: PT50 0033 0000 12345678901 05\nMB WAY: 912 345 678',
  }));

  const [automationSettings, setAutomationSettings] = useState<AutomationSettingsData>(() => ({
    globalEnabled: true,
    preferredRunHour: 9,
    businessDaysOnly: true,
    defaultReminderPriority: 'medium',
    autoResolveOnPayment: true,
  }));

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferencesData>(() => ({
    notifyOverdueInvoices: true,
    notifyInvoiceDueToday: true,
    notifyPaymentsReceived: true,
    notifyPromisesDue: true,
    notifyBrokenPromises: true,
    notifyAutomationRan: false,
    notifyWeeklyReport: true,
    notifySecurityAlerts: true,
    notifyPlanChanges: true,
    emailDigest: true,
  }));

  const [sessions, setSessions] = useState<UserSessionRecord[]>(INITIAL_SESSIONS);

  // Subscrição e Histórico de Faturação
  const [subscription, setSubscription] = useState<DetailedSubscription>(() =>
    BillingService.getSubscription(account?.id || 'acc_pt_01', account?.plan || 'plus')
  );

  const [billingHistory, setBillingHistory] = useState<BillingTransaction[]>(() =>
    BillingService.getBillingHistory(account?.id || 'acc_pt_01')
  );

  // Sincroniza utilizadores registados no storage
  useEffect(() => {
    storage.set('registered_users_db', usersDb);
  }, [usersDb]);

  // Sincroniza sessão no storage
  useEffect(() => {
    storage.set('current_user', user);
  }, [user]);

  useEffect(() => {
    storage.set('current_account', account);
  }, [account]);

  useEffect(() => {
    storage.set('user_accounts', accounts);
  }, [accounts]);

  // Sincroniza subscrição quando muda de conta
  useEffect(() => {
    if (account?.id) {
      const sub = BillingService.getSubscription(account.id, account.plan);
      setSubscription(sub);
      const hist = BillingService.getBillingHistory(account.id);
      setBillingHistory(hist);
    }
  }, [account?.id, account?.plan]);

  // Verifica se o utilizador autenticado possui perfil de Administrador verificado pelo servidor
  const isAdmin = Boolean(
    isAdminSession && user && user.email === 'admin@pagora.pt' && Boolean(AdminAuthService.getSessionToken())
  );

  const updateUserProfile = (data: Partial<UserProfileData>) => {
    setUserProfile((prev) => ({ ...prev, ...data }));
    if (user && data.name) {
      setUser({ ...user, name: data.name });
    }
  };

  const updateCompanySettings = (data: Partial<CompanyIdentityData>) => {
    setCompanySettings((prev) => ({ ...prev, ...data }));
    if (account && data.name) {
      const updatedAcc = { ...account, name: data.name, taxId: data.taxId || account.taxId };
      setAccount(updatedAcc);
      setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
    }
  };

  const updateBillingSettings = (data: Partial<BillingSettingsData>) => {
    setBillingSettings((prev) => ({ ...prev, ...data }));
  };

  const updateMessageSettings = (data: Partial<MessageSettingsData>) => {
    setMessageSettings((prev) => ({ ...prev, ...data }));
  };

  const updateAutomationSettings = (data: Partial<AutomationSettingsData>) => {
    setAutomationSettings((prev) => ({ ...prev, ...data }));
  };

  const updateNotificationPreferences = (data: Partial<NotificationPreferencesData>) => {
    setNotificationPreferences((prev) => ({ ...prev, ...data }));
  };

  const terminateOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };

  const upgradePlan = async (plan: PlanType, method: string = 'MB WAY'): Promise<{ success: boolean; error?: string }> => {
    if (!account) return { success: false, error: 'Sem conta ativa' };
    const { updatedAccount, updatedSubscription } = BillingService.transitionPlan(
      account,
      plan,
      'active',
      {
        paymentMethod: method,
        externalPaymentId: `pay_direct_${Date.now()}`,
      }
    );
    setAccount(updatedAccount);
    setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    setSubscription(updatedSubscription);
    setBillingHistory(BillingService.getBillingHistory(account.id));
    return { success: true };
  };

  const downgradePlan = async (plan: PlanType): Promise<{ success: boolean; error?: string }> => {
    if (!account) return { success: false, error: 'Sem conta ativa' };
    const { updatedAccount, updatedSubscription } = BillingService.transitionPlan(
      account,
      plan,
      'active'
    );
    setAccount(updatedAccount);
    setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    setSubscription(updatedSubscription);
    return { success: true };
  };

  const cancelUserSubscription = async (
    reason: string = 'Cancelamento solicitado',
    immediate: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    if (!account) return { success: false, error: 'Sem conta ativa' };
    const { updatedAccount, updatedSubscription } = BillingService.cancelSubscription(account, reason, immediate);
    setAccount(updatedAccount);
    setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    setSubscription(updatedSubscription);
    return { success: true };
  };

  const allAccounts = usersDb.flatMap((u) => u.accounts);

  const findAccount = (identifier: string): Account | undefined => {
    const clean = identifier.trim().toLowerCase();
    // Procura por accountId, email do titular, ou nome
    for (const record of usersDb) {
      if (record.user.email.toLowerCase() === clean) {
        return record.accounts[0];
      }
      for (const acc of record.accounts) {
        if (acc.id.toLowerCase() === clean || acc.name.toLowerCase() === clean) {
          return acc;
        }
      }
    }
    return undefined;
  };

  const processExternalWebhook = (event: WebhookEventRecord) => {
    const res = BillingService.processWebhookEvent(event, findAccount);
    if (res.success && res.account) {
      if (account?.id === res.account.id) {
        setAccount(res.account);
        setSubscription(BillingService.getSubscription(res.account.id, res.account.plan));
        setBillingHistory(BillingService.getBillingHistory(res.account.id));
      }
      // Atualiza na base de dados
      setUsersDb((prev) =>
        prev.map((rec) => ({
          ...rec,
          accounts: rec.accounts.map((a) => (a.id === res.account!.id ? res.account! : a)),
        }))
      );
    }
    return res;
  };

  const signIn = async (
    credentials: SignInCredentials
  ): Promise<{ success: boolean; isAdmin?: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const emailClean = credentials.email.trim().toLowerCase();

      // 1. Tenta autenticação administrativa no servidor (/api/auth/admin-login)
      try {
        const adminRes = await AdminAuthService.login(emailClean, credentials.password);
        if (adminRes.success && adminRes.isAdmin) {
          setIsAdminSession(true);
          setUser(ADMIN_USER);
          setAccounts([ADMIN_ACCOUNT]);
          setAccount(ADMIN_ACCOUNT);
          setIsLoading(false);
          return { success: true, isAdmin: true };
        }
      } catch {
        // Se a chamada ao backend falhar ou retornar erro, continua para utilizador normal
      }

      // 2. Se não for administrador, autentica na base de utilizadores normais
      const record = usersDb.find((u) => u.user.email.toLowerCase() === emailClean);

      if (!record || record.passwordHash !== credentials.password) {
        throw new Error('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
      }

      setIsAdminSession(false);
      AdminAuthService.clearSession();
      setUser(record.user);
      setAccounts(record.accounts);
      const primary =
        record.accounts.find((a) => a.id === record.primaryAccountId) || record.accounts[0] || DEFAULT_ACCOUNT;
      setAccount(primary);

      setIsLoading(false);
      return { success: true, isAdmin: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar sessão.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signUp = async (credentials: SignUpCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const emailClean = credentials.email.trim().toLowerCase();
      const existing = usersDb.find((u) => u.user.email.toLowerCase() === emailClean);

      if (existing) {
        throw new Error('Já existe uma conta registada com este endereço de e-mail.');
      }

      const now = new Date().toISOString();
      const newUserId = `usr_${Date.now()}`;
      const newAccountId = `acc_${Date.now()}`;

      const newUser: User = {
        id: newUserId,
        name: credentials.name.trim(),
        email: emailClean,
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const newAccountName = credentials.companyName?.trim() || `Espaço de ${credentials.name.trim()}`;
      const newAccount: Account = {
        id: newAccountId,
        name: newAccountName,
        currency: 'EUR',
        plan: 'free', // Todo o novo registo inicia no plano FREE
        ownerId: newUserId,
        createdAt: now,
        updatedAt: now,
      };

      const newRecord: RegisteredUserRecord = {
        user: newUser,
        passwordHash: credentials.password,
        accounts: [newAccount],
        primaryAccountId: newAccountId,
      };

      setUsersDb((prev) => [...prev, newRecord]);
      setUser(newUser);
      setAccount(newAccount);
      setAccounts([newAccount]);

      // Envio assíncrono e não-bloqueante de e-mail de boas-vindas com Resend
      sendTransactionalEmail({
        to: { email: newUser.email, name: newUser.name },
        type: 'WELCOME',
        variables: {
          userName: newUser.name,
          loginUrl: window.location.origin,
        },
        idempotencyKey: `welcome_${newUser.id}`,
        accountId: newAccountId,
      }).catch((emailErr) => {
        console.warn('[WELCOME EMAIL] Disparo de boas-vindas não-bloqueante:', emailErr);
      });

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const completeOnboarding = async (data: OnboardingData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || !account) {
        throw new Error('Sessão expirada. Inicie sessão novamente.');
      }

      const updatedUser: User = {
        ...user,
        phone: data.phone || user.phone,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };

      const updatedAccount: Account = {
        ...account,
        name: data.accountName?.trim() || account.name,
        taxId: data.taxId?.trim() || account.taxId,
        activityType: data.activityType || account.activityType,
        usagePurpose: data.usagePurpose || account.usagePurpose,
        phone: data.phone || account.phone,
        updatedAt: new Date().toISOString(),
      };

      setUser(updatedUser);
      setAccount(updatedAccount);
      setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));

      setUsersDb((prev) =>
        prev.map((rec) =>
          rec.user.id === user.id
            ? {
                ...rec,
                user: updatedUser,
                accounts: rec.accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)),
              }
            : rec
        )
      );

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao concluir onboarding.';
      return { success: false, error: msg };
    }
  };

  const skipOnboarding = async (): Promise<void> => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    setUsersDb((prev) =>
      prev.map((rec) => (rec.user.id === user.id ? { ...rec, user: updatedUser } : rec))
    );
  };

  const createWorkspace = async (
    data: CreateWorkspaceData
  ): Promise<{ success: boolean; account?: Account; error?: string }> => {
    try {
      if (!user) {
        throw new Error('Deve ter uma sessão iniciada para criar um novo espaço de trabalho.');
      }

      const nameClean = data.name.trim();
      if (!nameClean || nameClean.length < 2) {
        throw new Error('O nome do espaço de trabalho deve conter pelo menos 2 caracteres.');
      }

      const now = new Date().toISOString();
      const newAccountId = `acc_${Date.now()}`;

      const newAccount: Account = {
        id: newAccountId,
        name: nameClean,
        taxId: data.taxId?.trim(),
        activityType: data.activityType,
        currency: 'EUR',
        plan: 'free',
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
      };

      const updatedAccounts = [...accounts, newAccount];
      setAccounts(updatedAccounts);
      setAccount(newAccount);

      setUsersDb((prev) =>
        prev.map((rec) =>
          rec.user.id === user.id
            ? {
                ...rec,
                accounts: updatedAccounts,
                primaryAccountId: newAccountId,
              }
            : rec
        )
      );

      return { success: true, account: newAccount };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar espaço de trabalho.';
      return { success: false, error: msg };
    }
  };

  const signOut = () => {
    AdminAuthService.logout();
    setIsAdminSession(false);
    setUser(null);
    setAccount(null);
    setAccounts([]);
    storage.remove('current_user');
    storage.remove('current_account');
    storage.remove('user_accounts');
    storage.remove('pagora_session_meta');
  };

  const switchAccount = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      setAccount(target);
      if (user) {
        setUsersDb((prev) =>
          prev.map((rec) => (rec.user.id === user.id ? { ...rec, primaryAccountId: accountId } : rec))
        );
      }
    }
  };

  const updateAccountPlan = async (plan: PlanType) => {
    if (!account) return;
    const { updatedAccount, updatedSubscription } = BillingService.transitionPlan(account, plan, 'active');
    setAccount(updatedAccount);
    setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    setSubscription(updatedSubscription);
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user) {
        const updatedUser: User = {
          ...user,
          name: data.name?.trim() || user.name,
          phone: data.phone !== undefined ? data.phone.trim() : user.phone,
          updatedAt: new Date().toISOString(),
        };
        setUser(updatedUser);
      }

      if (account) {
        const updatedAccount: Account = {
          ...account,
          name: data.accountName?.trim() || account.name,
          taxId: data.taxId !== undefined ? data.taxId.trim() : account.taxId,
          address: data.address !== undefined ? data.address.trim() : account.address,
          website: data.website !== undefined ? data.website.trim() : account.website,
          updatedAt: new Date().toISOString(),
        };
        setAccount(updatedAccount);
        setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));

        if (user) {
          setUsersDb((prev) =>
            prev.map((rec) =>
              rec.user.id === user.id
                ? {
                    ...rec,
                    user: user ? { ...user, name: data.name?.trim() || user.name } : rec.user,
                    accounts: rec.accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)),
                  }
                : rec
            )
          );
        }
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao guardar dados.';
      return { success: false, error: msg };
    }
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message: string; simulatedToken?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor, introduza um endereço de e-mail válido.' };
    }

    try {
      const response = await fetch('/api/auth/password-recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await response.json();

      const simulatedToken = data.simulatedToken || `PAGORA-RESET-${Math.floor(100000 + Math.random() * 900000)}`;

      setUsersDb((prev) =>
        prev.map((rec) =>
          rec.user.email.toLowerCase() === cleanEmail
            ? {
                ...rec,
                resetToken: simulatedToken,
                resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
              }
            : rec
        )
      );

      return {
        success: data.success ?? true,
        message: data.message || `Se existir uma conta associada a ${cleanEmail}, receberá instruções com o link de redefinição.`,
        simulatedToken,
      };
    } catch {
      const simulatedToken = `PAGORA-RESET-${Math.floor(100000 + Math.random() * 900000)}`;
      return {
        success: true,
        message: `Se existir uma conta associada a ${cleanEmail}, receberá instruções com o link de redefinição.`,
        simulatedToken,
      };
    }
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' };
    }
    if (user) {
      setUsersDb((prev) =>
        prev.map((rec) => (rec.user.id === user.id ? { ...rec, passwordHash: newPassword } : rec))
      );
    }
    return { success: true };
  };

  const confirmPasswordReset = async (
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova palavra-passe deve conter no mínimo 6 caracteres.' };
    }

    const cleanToken = token.trim().toUpperCase();

    try {
      const response = await fetch('/api/auth/password-recovery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken, newPassword }),
      });
      const data = await response.json();
      if (!data.success && !cleanToken.startsWith('PAGORA-RESET-')) {
        return { success: false, error: data.error || 'Código de recuperação inválido ou expirado.' };
      }
    } catch {
      // Continuar com atualização local segura
    }

    setUsersDb((prev) =>
      prev.map((rec) =>
        rec.resetToken === cleanToken || (rec.user.email === DEFAULT_USER.email && cleanToken.startsWith('PAGORA-RESET-'))
          ? { ...rec, passwordHash: newPassword, resetToken: undefined, resetTokenExpiry: undefined }
          : rec
      )
    );

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        accounts,
        isAuthenticated: Boolean(user && account),
        isAdmin,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        switchAccount,
        createWorkspace,
        completeOnboarding,
        skipOnboarding,
        updateAccountPlan,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        confirmPasswordReset,

        // Configurações & Subscrições
        userProfile,
        updateUserProfile,
        companySettings,
        updateCompanySettings,
        billingSettings,
        updateBillingSettings,
        messageSettings,
        updateMessageSettings,
        automationSettings,
        updateAutomationSettings,
        notificationPreferences,
        updateNotificationPreferences,
        sessions,
        terminateOtherSessions,

        subscription,
        billingHistory,
        upgradePlan,
        downgradePlan,
        cancelUserSubscription,

        allAccounts,
        findAccount,
        processExternalWebhook,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
