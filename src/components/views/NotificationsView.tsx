import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigation } from '../../context/NavigationContext';
import { NotificationCategory, SystemNotification } from '../../types/database';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  Receipt,
  Users,
  ShieldCheck,
  CreditCard,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const { navigate } = useNavigation();

  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'unread'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  const categories: { id: NotificationCategory | 'unread'; label: string; count?: number }[] = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'unread', label: 'Não lidas', count: unreadCount },
    { id: 'billing', label: 'Cobranças' },
    { id: 'payment', label: 'Pagamentos' },
    { id: 'promise', label: 'Promessas' },
    { id: 'automation', label: 'Automações' },
    { id: 'plan', label: 'Plano & Faturação' },
    { id: 'system', label: 'Sistema' },
  ];

  const filteredNotifications = notifications.filter((notif) => {
    // Filtro por Categoria ou Não Lidas
    if (selectedCategory === 'unread') {
      if (notif.isRead) return false;
    } else if (selectedCategory !== 'all') {
      if (notif.category !== selectedCategory) return false;
    }

    // Filtro por Prioridade
    if (filterPriority !== 'all' && notif.priority !== filterPriority) {
      return false;
    }

    return true;
  });

  const getNotificationIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-indigo-600 shrink-0" />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="danger" size="sm">Urgente</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">Alta Prioridade</Badge>;
      case 'medium':
        return <Badge variant="neutral" size="sm">Média</Badge>;
      case 'low':
        return <Badge variant="neutral" size="sm">Informativa</Badge>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (cat?: NotificationCategory) => {
    switch (cat) {
      case 'billing':
        return 'Cobrança';
      case 'payment':
        return 'Pagamento';
      case 'promise':
        return 'Promessa';
      case 'automation':
        return 'Automação';
      case 'plan':
        return 'Plano';
      case 'account':
        return 'Conta';
      default:
        return 'Sistema';
    }
  };

  const handleActionClick = (notif: SystemNotification) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl as any);
    } else if (notif.category === 'billing') {
      navigate('dashboard_invoices');
    } else if (notif.category === 'promise' || notif.category === 'payment') {
      navigate('dashboard_collection_center');
    } else if (notif.category === 'plan') {
      navigate('dashboard_plans');
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Centro de Notificações
            </h1>
            {unreadCount > 0 && (
              <Badge variant="primary" size="md">
                {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe alertas operacionais, cobranças em atraso, pagamentos recebidos e atualizações do sistema.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              className="gap-1.5 flex-1 sm:flex-initial justify-center text-xs h-9 sm:h-8"
            >
              <CheckCheck className="w-4 h-4 text-indigo-600" />
              Marcar lidas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsClearAllConfirmOpen(true)}
              className="text-slate-500 hover:text-red-600 gap-1.5 flex-1 sm:flex-initial justify-center text-xs h-9 sm:h-8"
            >
              <Trash2 className="w-4 h-4" />
              Limpar todas
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Filtros por Categoria */}
      <Card className="p-2 sm:p-3 bg-white border-slate-200">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
                {cat.count !== undefined && cat.count > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      selectedCategory === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filtro de Prioridade */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Todas as prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Notificações */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            Nenhuma notificação encontrada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedCategory === 'unread'
              ? 'Excelente trabalho! Tem todas as notificações em dia e sem pendências não lidas.'
              : 'Não existem notificações para a categoria ou filtro de prioridade selecionado.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className={`p-4 transition-all hover:shadow-xs border ${
                    notif.isRead
                      ? 'bg-white/80 border-slate-200/90 text-slate-700'
                      : 'bg-indigo-50/20 border-indigo-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Ícone de Tipo */}
                    <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>

                    {/* Conteúdo Central */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-sm text-slate-900 leading-snug">
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shrink-0" title="Não lida" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getPriorityBadge(notif.priority)}
                          <Badge variant="neutral" size="sm">
                            {getCategoryLabel(notif.category)}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {notif.message}
                      </p>

                      {/* Rodapé do Item: Ações & Data */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatRelativeTime(notif.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          {/* Botão de Ação Direta Contextual */}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleActionClick(notif)}
                            className="text-xs h-8 sm:h-7 gap-1 px-3 flex-1 sm:flex-initial justify-center font-semibold"
                          >
                            {notif.actionLabel || 'Ver detalhes'}
                            <ArrowRight className="w-3 h-3" />
                          </Button>

                          {!notif.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs h-8 sm:h-7 text-slate-500 hover:text-slate-800 px-2 flex-1 sm:flex-initial justify-center"
                            >
                              Marcar lida
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteNotification(notif.id)}
                            className="text-slate-400 hover:text-red-600 p-2 sm:p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                            title="Eliminar notificação"
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de Confirmação para Limpeza de Notificações */}
      <ConfirmModal
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={() => {
          clearAllNotifications();
          setIsClearAllConfirmOpen(false);
        }}
        title="Limpar todas as notificações?"
        description="Esta ação irá remover permanentemente todas as notificações e alertas registados na sua conta. Tem a certeza de que deseja continuar?"
        confirmLabel="Sim, limpar todas"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
