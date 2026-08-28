import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import {
  Menu,
  Bell,
  Building2,
  Check,
  User as UserIcon,
  Settings,
  ShieldAlert,
  LogOut,
  CreditCard,
  PlusCircle,
  Search,
} from 'lucide-react';

export const AppNavbar: React.FC = () => {
  const { user, account, accounts, switchAccount, signOut, isAdmin } = useAuth();
  const { navigate, toggleSidebar } = useNavigation();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Tecla de atalho global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const planBadgeVariants = {
    free: 'neutral' as const,
    plus: 'primary' as const,
    pro: 'success' as const,
  };

  const accountDropdownItems = [
    ...accounts.map((acc) => ({
      id: acc.id,
      label: acc.name,
      icon: acc.id === account?.id ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Building2 className="w-3.5 h-3.5 text-slate-400" />,
      onClick: () => switchAccount(acc.id),
    })),
    {
      id: 'divider-1',
      label: '',
      divider: true,
      onClick: () => {},
    },
    {
      id: 'create-new-workspace',
      label: '+ Criar novo espaço de trabalho',
      icon: <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />,
      onClick: () => navigate('dashboard_settings'),
    },
    {
      id: 'manage-plans',
      label: 'Gerir planos e subscrições',
      icon: <CreditCard className="w-3.5 h-3.5 text-slate-500" />,
      onClick: () => navigate('dashboard_plans'),
    },
  ];

  const userDropdownItems = [
    {
      id: 'settings',
      label: 'Definições da conta',
      icon: <Settings className="w-3.5 h-3.5 text-slate-500" />,
      onClick: () => navigate('dashboard_settings'),
    },
    {
      id: 'plans',
      label: 'Plano e faturação',
      icon: <CreditCard className="w-3.5 h-3.5 text-slate-500" />,
      onClick: () => navigate('dashboard_plans'),
    },
    ...(isAdmin
      ? [
          {
            id: 'admin_portal',
            label: 'Painel de Administração',
            icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />,
            onClick: () => navigate('admin_portal'),
          },
        ]
      : []),
    {
      id: 'divider-user',
      label: '',
      divider: true,
      onClick: () => {},
    },
    {
      id: 'signout',
      label: 'Terminar sessão',
      icon: <LogOut className="w-3.5 h-3.5 text-red-600" />,
      danger: true,
      onClick: () => {
        signOut();
        navigate('landing');
      },
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 h-16 flex items-center px-4 sm:px-6 justify-between">
      {/* Esquerda: Menu toggle mobile + Logo + Conta Ativa */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => navigate('dashboard_overview')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            P
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 hidden sm:inline">
            PAGORA
          </span>
        </div>

        {/* Seletor de Conta / Tenant */}
        {account && (
          <div className="hidden md:flex items-center pl-3 border-l border-slate-200">
            <Dropdown
              align="left"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 transition-colors text-left"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 leading-tight max-w-[140px] truncate">
                      {account.name}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {account.taxId || 'Sem NIF'}
                    </span>
                  </div>
                </button>
              }
              items={accountDropdownItems}
            />
          </div>
        )}
      </div>

      {/* Centro: Pesquisa Global Rápida */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs text-slate-500 transition-colors shadow-2xs group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="truncate">Pesquisar clientes, cobranças, mensagens...</span>
          </span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Direita: Plano, Notificações, Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botão de Pesquisa Mobile */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Pesquisar"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Indicador do Plano Ativo */}
        {account && (
          <div
            onClick={() => navigate('dashboard_plans')}
            className="cursor-pointer"
            title="Clique para gerir o plano"
          >
            <Badge
              variant={planBadgeVariants[account.plan] || 'neutral'}
              size="sm"
              className="uppercase tracking-wider cursor-pointer hover:opacity-90"
            >
              Plano {account.plan}
            </Badge>
          </div>
        )}

        {/* Notificações */}
        <button
          type="button"
          onClick={() => navigate('dashboard_notifications')}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Ver notificações"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
          )}
        </button>

        {/* Dropdown do Utilizador */}
        {user && (
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-700 hidden lg:inline max-w-[120px] truncate">
                  {user.name}
                </span>
              </button>
            }
            items={userDropdownItems}
          />
        )}
      </div>

      {/* Modal de Pesquisa Global */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};
