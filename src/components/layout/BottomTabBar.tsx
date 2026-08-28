import React from 'react';
import { useNavigation, AppView } from '../../context/NavigationContext';
import { useAutomations } from '../../context/AutomationContext';
import {
  LayoutDashboard,
  Receipt,
  Compass,
  Users,
  Menu,
} from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  const { currentView, navigate, toggleSidebar, isSidebarOpen } = useNavigation();
  const { metrics } = useAutomations();

  const isOverview = currentView === 'dashboard_overview';
  const isInvoices = currentView === 'dashboard_invoices' || currentView === 'dashboard_invoice_detail';
  const isCollection = currentView === 'dashboard_collection_center';
  const isCustomers = currentView === 'dashboard_customers' || currentView === 'dashboard_customer_detail';

  return (
    <nav
      id="mobile-bottom-tab-bar"
      aria-label="Navegação rápida móvel"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around lg:hidden safe-area-bottom shadow-lg"
    >
      {/* 1. Visão Geral */}
      <button
        type="button"
        id="tab-btn-overview"
        onClick={() => navigate('dashboard_overview')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 px-1 rounded-xl transition-all ${
          isOverview
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 mb-0.5 ${isOverview ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight leading-none">Início</span>
      </button>

      {/* 2. Cobranças */}
      <button
        type="button"
        id="tab-btn-invoices"
        onClick={() => navigate('dashboard_invoices')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 px-1 rounded-xl transition-all ${
          isInvoices
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Receipt className={`w-5 h-5 mb-0.5 ${isInvoices ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight leading-none">Cobranças</span>
      </button>

      {/* 3. Centro de Cobrança (Destaque Central) */}
      <button
        type="button"
        id="tab-btn-collection"
        onClick={() => navigate('dashboard_collection_center')}
        className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 px-1 rounded-xl transition-all relative"
      >
        <div
          className={`w-9 h-9 -mt-3 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
            isCollection
              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
              : 'bg-slate-900 text-white hover:bg-indigo-700'
          }`}
        >
          <Compass className="w-5 h-5" />
        </div>
        <span
          className={`text-[10px] tracking-tight leading-none mt-0.5 ${
            isCollection ? 'text-indigo-600 font-bold' : 'text-slate-600 font-medium'
          }`}
        >
          Centro
        </span>
        {metrics.todayReminders > 0 && (
          <span className="absolute top-0 right-3.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
            {metrics.todayReminders > 9 ? '9+' : metrics.todayReminders}
          </span>
        )}
      </button>

      {/* 4. Clientes */}
      <button
        type="button"
        id="tab-btn-customers"
        onClick={() => navigate('dashboard_customers')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 px-1 rounded-xl transition-all ${
          isCustomers
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Users className={`w-5 h-5 mb-0.5 ${isCustomers ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight leading-none">Clientes</span>
      </button>

      {/* 5. Menu / Mais */}
      <button
        type="button"
        id="tab-btn-menu"
        onClick={toggleSidebar}
        className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 px-1 rounded-xl transition-all ${
          isSidebarOpen
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Menu className={`w-5 h-5 mb-0.5 ${isSidebarOpen ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight leading-none">Menu</span>
      </button>
    </nav>
  );
};
