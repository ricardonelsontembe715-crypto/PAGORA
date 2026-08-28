import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemNotification, NotificationCategory, NotificationPriority } from '../types/database';
import { storage } from '../lib/storage';
import { useAuth } from './AuthContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toastVariants } from '../lib/motionTokens';

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<SystemNotification, 'id' | 'accountId' | 'userId' | 'createdAt' | 'isRead'>) => void;
  toasts: Toast[];
  showToast: (toastOrMessage: Omit<Toast, 'id'> | string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    return storage.getTenantData<SystemNotification[]>(
      account?.id || 'default',
      'notifications',
      []
    );
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sincroniza notificações com o tenant ativo
  useEffect(() => {
    if (account?.id) {
      const tenantNotifs = storage.getTenantData<SystemNotification[]>(
        account.id,
        'notifications',
        []
      );
      setNotifications(tenantNotifs);
    }
  }, [account?.id]);

  useEffect(() => {
    if (account?.id) {
      storage.setTenantData(account.id, 'notifications', notifications);
    }
  }, [notifications, account?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (
    notif: Omit<SystemNotification, 'id' | 'accountId' | 'userId' | 'createdAt' | 'isRead'>
  ) => {
    if (!account || !user) return;
    const newNotification: SystemNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      accountId: account.id,
      userId: user.id,
      category: notif.category || 'system',
      priority: notif.priority || 'medium',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const showToast = (toastOrMessage: Omit<Toast, 'id'> | string, type: Toast['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: Toast =
      typeof toastOrMessage === 'string'
        ? { id, message: toastOrMessage, type }
        : { ...toastOrMessage, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}

      {/* Container de Toasts Globais */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
              error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
              warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
              info: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
            };

            const bgClasses = {
              success: 'bg-white border-emerald-200 text-slate-800',
              error: 'bg-white border-red-200 text-slate-800',
              warning: 'bg-white border-amber-200 text-slate-800',
              info: 'bg-white border-blue-200 text-slate-800',
            };

            return (
              <motion.div
                key={toast.id}
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${bgClasses[toast.type]}`}
              >
                {icons[toast.type]}
                <div className="flex-1 text-xs">
                  {toast.title && <div className="font-semibold text-slate-900 mb-0.5">{toast.title}</div>}
                  <div className="text-slate-600 leading-relaxed">{toast.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser utilizado dentro de um NotificationProvider');
  }
  return context;
};
