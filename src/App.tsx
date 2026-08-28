import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { NavigationProvider, useNavigation, AppView } from './context/NavigationContext';
import { CustomerProvider } from './context/CustomerContext';
import { InvoiceProvider } from './context/InvoiceContext';
import { MessageProvider } from './context/MessageContext';
import { AutomationProvider } from './context/AutomationContext';
import { pageTransitionVariants } from './lib/motionTokens';


// Layout & Landing
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './components/landing/LandingPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';

// Auth Views
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { PasswordRecoveryView } from './components/auth/PasswordRecoveryView';
import { OnboardingView } from './components/auth/OnboardingView';

// App Views
import { OverviewView } from './components/views/OverviewView';
import { CollectionCenterView } from './components/views/CollectionCenterView';
import { RemindersView } from './components/views/RemindersView';
import { CustomersView } from './components/views/CustomersView';
import { CustomerDetailView } from './components/views/CustomerDetailView';
import { InvoicesView } from './components/views/InvoicesView';
import { InvoiceDetailView } from './components/views/InvoiceDetailView';
import { MessagesView } from './components/views/MessagesView';
import { TemplatesView } from './components/views/TemplatesView';
import { AutomationsView } from './components/views/AutomationsView';
import { ReportsView } from './components/views/ReportsView';
import { PlansView } from './components/views/PlansView';
import { SettingsView } from './components/views/SettingsView';
import { NotificationsView } from './components/views/NotificationsView';
import { AdminPortalView } from './components/views/AdminPortalView';

const AppContent: React.FC = () => {
  const { currentView } = useNavigation();
  const { isAuthenticated } = useAuth();

  // Rotas públicas e de autenticação
  if (currentView === 'landing') {
    return <LandingPage />;
  }

  if (currentView === 'auth_login') {
    return <LoginForm />;
  }

  if (currentView === 'auth_register') {
    return <RegisterForm />;
  }

  if (currentView === 'auth_recovery') {
    return <PasswordRecoveryView />;
  }

  // Rota de onboarding após registo
  if (currentView === 'auth_onboarding') {
    if (!isAuthenticated) {
      return <LoginForm />;
    }
    return <OnboardingView />;
  }

  // Rota administrativa direta (pode ser acedida sem sessão de utilizador comum se autenticado no portal do proprietário)
  if (currentView === 'admin_portal') {
    return <AdminPortalView />;
  }

  // Redireciona para o login caso tente aceder a uma rota protegida sem autenticação
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Visualizador central das rotas autenticadas dentro da AppShell
  const renderDashboardView = () => {
    switch (currentView) {
      case 'dashboard_overview':
        return <OverviewView />;

      case 'dashboard_collection_center':
        return <CollectionCenterView />;

      case 'dashboard_reminders':
        return <RemindersView />;

      case 'dashboard_customers':
        return <CustomersView />;

      case 'dashboard_customer_detail':
        return <CustomerDetailView />;

      case 'dashboard_invoices':
        return <InvoicesView />;

      case 'dashboard_invoice_detail':
        return <InvoiceDetailView />;

      case 'dashboard_messages':
        return <MessagesView />;

      case 'dashboard_templates':
        return <TemplatesView />;

      case 'dashboard_automations':
        return <AutomationsView />;

      case 'dashboard_reports':
        return <ReportsView />;

      case 'dashboard_notifications':
        return <NotificationsView />;

      case 'dashboard_plans':
        return <PlansView />;

      case 'dashboard_settings':
        return <SettingsView />;

      default:
        return <OverviewView />;
    }
  };

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentView}
          variants={pageTransitionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full"
        >
          {renderDashboardView()}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
};


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <NavigationProvider>
            <CustomerProvider>
              <InvoiceProvider>
                <MessageProvider>
                  <AutomationProvider>
                    <AppContent />
                    <PwaInstallBanner />
                  </AutomationProvider>
                </MessageProvider>
              </InvoiceProvider>
            </CustomerProvider>
          </NavigationProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
