import React, { createContext, useContext, useState } from 'react';

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

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [navParams, setNavParams] = useState<NavigationParams>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const navigate = (view: AppView, params?: NavigationParams) => {
    setNavParams(params || {});

    if (params?.customerId) {
      setSelectedCustomerId(params.customerId);
    } else if (view !== 'dashboard_customer_detail') {
      setSelectedCustomerId(null);
    }

    if (params?.invoiceId) {
      setSelectedInvoiceId(params.invoiceId);
    } else if (view !== 'dashboard_invoice_detail') {
      setSelectedInvoiceId(null);
    }

    setCurrentView(view);
    // Fecha sidebar no mobile ao mudar de página
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedInvoiceId(null);
    setCurrentView('dashboard_customer_detail');
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setCurrentView('dashboard_invoice_detail');
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentView,
        selectedCustomerId,
        selectedInvoiceId,
        navParams,
        navigate,
        navigateToCustomer,
        navigateToInvoice,
        isSidebarOpen,
        setSidebarOpen: setIsSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser utilizado dentro de um NavigationProvider');
  }
  return context;
};
