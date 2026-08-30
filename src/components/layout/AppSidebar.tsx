import React from 'react';
import { useNavigation, AppView } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useAutomations } from '../../context/AutomationContext';
import { hasFeature } from '../../lib/permissions';
import {
  LayoutDashboard,
  Compass,
  Calendar,
  Users,
  Receipt,
  MessageSquare,
  FileText,
  Zap,
  BarChart3,
  Bell,
  CreditCard,
  Settings,
  ShieldCheck,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AppSidebar: React.FC = () => {
  const { currentView, navigate, isSidebarOpen, setSidebarOpen } = useNavigation();
  const { account, isAdmin } = useAuth();
  const { metrics } = useAutomations();

  interface NavItem {
    id: AppView;
    label: string;
    icon: React.ReactNode;
    featureKey?: import('../../config/plans').FeatureKey;
    badge?: string;
    requiredPlan?: 'plus' | 'pro';
  }

  const overviewItems: NavItem[] = [
    {
      id: 'dashboard_overview',
      label: 'Visão geral',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
  ];

  const operationItems: NavItem[] = [
    {
      id: 'dashboard_collection_center',
      label: 'Centro de cobrança',
      icon: <Compass className="w-4 h-4 text-indigo-500" />,
      badge: metrics.todayReminders > 0 ? `${metrics.todayReminders}` : undefined,
    },
    {
      id: 'dashboard_customers',
      label: 'Clientes',
      icon: <Users className="w-4 h-4" />,
      featureKey: 'feature.customer_management',
    },
    {
      id: 'dashboard_invoices',
      label: 'Cobranças',
      icon: <Receipt className="w-4 h-4" />,
      featureKey: 'feature.invoice_management',
    },
    {
      id: 'dashboard_reminders',
      label: 'Lembretes',
      icon: <Calendar className="w-4 h-4 text-amber-500" />,
      badge: metrics.pendingReminders > 0 ? `${metrics.pendingReminders}` : undefined,
    },
    {
      id: 'dashboard_automations',
      label: 'Automações',
      icon: <Zap className="w-4 h-4 text-indigo-500" />,
      featureKey: 'feature.automated_reminders',
      requiredPlan: 'pro',
    },
  ];

  const communicationItems: NavItem[] = [
    {
      id: 'dashboard_messages',
      label: 'Mensagens',
      icon: <MessageSquare className="w-4 h-4" />,
      featureKey: 'feature.message_generator_basic',
    },
    {
      id: 'dashboard_templates',
      label: 'Modelos',
      icon: <FileText className="w-4 h-4" />,
      featureKey: 'feature.custom_templates',
      requiredPlan: 'plus',
    },
  ];

  const analyticsItems: NavItem[] = [
    {
      id: 'dashboard_reports',
      label: 'Relatórios',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  const accountItems: NavItem[] = [
    {
      id: 'dashboard_plans',
      label: 'Plano e faturação',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'dashboard_settings',
      label: 'Definições',
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: 'dashboard_notifications',
      label: 'Notificações',
      icon: <Bell className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [
          {
            id: 'admin_portal' as AppView,
            label: 'Área de Administração',
            icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
            badge: 'Admin',
          },
        ]
      : []),
  ];

  const renderNavLinks = (items: NavItem[]) => {
    return items.map((item) => {
      const isActive = currentView === item.id;
      const isLocked = item.featureKey ? !hasFeature(account, item.featureKey) : false;

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            navigate(item.id);
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            isActive
              ? 'bg-indigo-50/90 text-indigo-800 font-semibold shadow-[inset_3px_0_0_#4F46E5]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </div>

          {item.badge && (
            <Badge variant="warning" size="sm">
              {item.badge}
            </Badge>
          )}

          {isLocked && item.requiredPlan && !item.badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {item.requiredPlan}
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <>
      {/* Backdrop para mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header do Sidebar (Mobile apenas) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              P
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900">PAGORA</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links de navegação com scroll suave */}
        <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Visão Geral
            </div>
            <div className="space-y-0.5">{renderNavLinks(overviewItems)}</div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operação
            </div>
            <div className="space-y-0.5">{renderNavLinks(operationItems)}</div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Comunicação
            </div>
            <div className="space-y-0.5">{renderNavLinks(communicationItems)}</div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Análise
            </div>
            <div className="space-y-0.5">{renderNavLinks(analyticsItems)}</div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Conta & Definições
            </div>
            <div className="space-y-0.5">{renderNavLinks(accountItems)}</div>
          </div>
        </div>

        {/* Banner do Plano no fundo da sidebar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-800">
                Plano {account?.plan ? account.plan.toUpperCase() : 'FREE'}
              </span>
              <Badge variant={account?.plan === 'pro' ? 'success' : 'primary'} size="sm">
                Ativo
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-tight">
              {account?.plan === 'pro'
                ? 'Acesso total a todas as funcionalidades.'
                : 'Faça upgrade para desbloquear mais automações e modelos.'}
            </p>
            {account?.plan !== 'pro' && (
              <button
                type="button"
                onClick={() => {
                  navigate('dashboard_plans');
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors"
              >
                <span>Mudar de plano</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
