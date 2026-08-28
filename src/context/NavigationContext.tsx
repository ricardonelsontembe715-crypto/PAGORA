import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type AppView =
  | 'landing'
  | 'auth_login'
  | 'auth_register'
  | 'auth_recovery'
  | 'auth_onboarding'
  | 'dashboard_overview'
  | 'dashboard_collection_center'
  | 'dashboard_reminders'
  | 'dashboard_customers'
  | 'dashboard_customer_detail'
  | 'dashboard_invoices'
  | 'dashboard_invoice_detail'
  | 'dashboard_messages'
  | 'dashboard_templates'
  | 'dashboard_automations'
  | 'dashboard_reports'
  | 'dashboard_notifications'
  | 'dashboard_plans'
  | 'dashboard_settings'
  | 'admin_portal';

export interface NavigationParams {
  customerId?: string;
  invoiceId?: string;
  initialFilter?: string;
  [key: string]: unknown;
}

interface NavigationState {
  view: AppView;
  params: NavigationParams;
}

interface NavigationContextType {
  currentView: AppView;
  selectedCustomerId: string | null;
  selectedInvoiceId: string | null;
  navParams: NavigationParams;
  navigate: (view: AppView, params?: NavigationParams) => void;
  navigateToCustomer: (customerId: string) => void;
  navigateToInvoice: (invoiceId: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const HISTORY_KEY = 'pagora-navigation';
const initialNavigation: NavigationState = { view: 'landing', params: {} };
const isNavigationState = (value: unknown): value is NavigationState => {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<NavigationState>;
  return typeof state.view === 'string' && typeof state.params === 'object' && state.params !== null;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigation, setNavigation] = useState<NavigationState>(initialNavigation);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isApplyingHistory = useRef(false);

  const applyNavigation = useCallback((next: NavigationState) => {
    setNavigation(next);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const currentState = window.history.state?.[HISTORY_KEY];
    if (!isNavigationState(currentState)) {
      window.history.replaceState({ ...window.history.state, [HISTORY_KEY]: initialNavigation }, '');
    } else {
      applyNavigation(currentState);
    }

    const handlePopState = (event: PopStateEvent) => {
      const previous = event.state?.[HISTORY_KEY];
      if (isNavigationState(previous)) {
        isApplyingHistory.current = true;
        applyNavigation(previous);
        queueMicrotask(() => {
          isApplyingHistory.current = false;
        });
      } else {
        // Keep browser navigation inside the SPA when an external/old entry is reached.
        window.history.pushState({ ...window.history.state, [HISTORY_KEY]: navigation }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyNavigation, navigation]);

  const navigate = useCallback((view: AppView, params: NavigationParams = {}) => {
    const next: NavigationState = { view, params: { ...params } };
    setNavigation(next);
    setIsSidebarOpen(false);
    if (!isApplyingHistory.current) {
      const current = window.history.state || {};
      window.history.pushState({ ...current, [HISTORY_KEY]: next }, '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToCustomer = useCallback((customerId: string) => {
    navigate('dashboard_customer_detail', { customerId });
  }, [navigate]);

  const navigateToInvoice = useCallback((invoiceId: string) => {
    navigate('dashboard_invoice_detail', { invoiceId });
  }, [navigate]);

  return (
    <NavigationContext.Provider
      value={{
        currentView: navigation.view,
        selectedCustomerId: navigation.params.customerId || null,
        selectedInvoiceId: navigation.params.invoiceId || null,
        navParams: navigation.params,
        navigate,
        navigateToCustomer,
        navigateToInvoice,
        isSidebarOpen,
        setSidebarOpen: setIsSidebarOpen,
        toggleSidebar: () => setIsSidebarOpen((previous) => !previous),
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation deve ser utilizado dentro de um NavigationProvider');
  return context;
};


/* end */
