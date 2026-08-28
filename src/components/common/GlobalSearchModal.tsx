import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useMessages } from '../../context/MessageContext';
import { useAutomations } from '../../context/AutomationContext';
import { useNavigation } from '../../context/NavigationContext';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  Search,
  Users,
  Receipt,
  MessageSquare,
  FileText,
  Calendar,
  HandCoins,
  ArrowRight,
  CornerDownLeft,
  X,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  category: 'customers' | 'invoices' | 'messages' | 'templates' | 'reminders' | 'promises';
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  icon: React.ReactNode;
  onClick: () => void;
}

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { account } = useAuth();
  const { customers } = useCustomers();
  const { invoices, promises } = useInvoices();
  const { messages, templates } = useMessages();
  const { reminders } = useAutomations();
  const { navigate, navigateToCustomer, navigateToInvoice } = useNavigation();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Pesquisa multi-tenant rigorosa (apenas dados do account ativo)
  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Sugestões padrão quando vazio
      const recentCustomers = customers.slice(0, 3).map((c) => ({
        id: `c_${c.id}`,
        category: 'customers' as const,
        categoryLabel: 'Clientes Recentes',
        title: c.name,
        subtitle: c.email || c.phone || (c.taxId ? `NIF ${c.taxId}` : 'Sem contacto'),
        icon: <Users className="w-4 h-4 text-indigo-600" />,
        onClick: () => {
          navigateToCustomer(c.id);
          onClose();
        },
      }));

      const recentInvoices = invoices.slice(0, 3).map((inv) => ({
        id: `i_${inv.id}`,
        category: 'invoices' as const,
        categoryLabel: 'Cobranças Recentes',
        title: `${inv.invoiceNumber} • ${formatCurrency(inv.amount)}`,
        subtitle: inv.description || `Vencimento em ${formatDate(inv.dueDate)}`,
        badge: inv.status === 'overdue' ? 'Em atraso' : inv.status === 'paid' ? 'Pago' : 'Pendente',
        badgeVariant: (inv.status === 'overdue' ? 'danger' : inv.status === 'paid' ? 'success' : 'warning') as any,
        icon: <Receipt className="w-4 h-4 text-emerald-600" />,
        onClick: () => {
          navigateToInvoice(inv.id);
          onClose();
        },
      }));

      return [...recentCustomers, ...recentInvoices];
    }

    const matched: SearchResultItem[] = [];

    // 1. Clientes
    customers.forEach((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchTaxId = c.taxId?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchNotes = c.notes?.toLowerCase().includes(q);

      if (matchName || matchEmail || matchTaxId || matchPhone || matchNotes) {
        matched.push({
          id: `cus_${c.id}`,
          category: 'customers',
          categoryLabel: 'Clientes',
          title: c.name,
          subtitle: `${c.type === 'company' ? 'Empresa' : 'Particular'} • ${c.email || c.phone || 'Sem e-mail'} ${c.taxId ? `• NIF ${c.taxId}` : ''}`,
          badge: c.status === 'active' ? 'Ativo' : 'Arquivado',
          badgeVariant: c.status === 'active' ? 'success' : 'neutral',
          icon: <Users className="w-4 h-4 text-indigo-600" />,
          onClick: () => {
            navigateToCustomer(c.id);
            onClose();
          },
        });
      }
    });

    // 2. Cobranças / Faturas
    invoices.forEach((inv) => {
      const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchDesc = inv.description?.toLowerCase().includes(q);
      const matchNotes = inv.notes?.toLowerCase().includes(q);
      const customer = customers.find((c) => c.id === inv.customerId);
      const matchCust = customer?.name?.toLowerCase().includes(q);

      if (matchNum || matchDesc || matchNotes || matchCust) {
        matched.push({
          id: `inv_${inv.id}`,
          category: 'invoices',
          categoryLabel: 'Cobranças',
          title: `${inv.invoiceNumber} — ${formatCurrency(inv.amount)}`,
          subtitle: `${customer?.name || 'Cliente'} • Venc: ${formatDate(inv.dueDate)} ${inv.description ? `• ${inv.description}` : ''}`,
          badge: inv.status === 'overdue' ? 'Em atraso' : inv.status === 'paid' ? 'Liquidada' : 'Pendente',
          badgeVariant: (inv.status === 'overdue' ? 'danger' : inv.status === 'paid' ? 'success' : 'warning') as any,
          icon: <Receipt className="w-4 h-4 text-emerald-600" />,
          onClick: () => {
            navigateToInvoice(inv.id);
            onClose();
          },
        });
      }
    });

    // 3. Promessas de Pagamento
    promises.forEach((prom) => {
      const matchNotes = prom.notes?.toLowerCase().includes(q);
      const customer = customers.find((c) => c.id === prom.customerId);
      const matchCust = customer?.name?.toLowerCase().includes(q);

      if (matchNotes || matchCust || q.includes('promessa')) {
        matched.push({
          id: `prom_${prom.id}`,
          category: 'promises',
          categoryLabel: 'Promessas de Pagamento',
          title: `Promessa de ${formatCurrency(prom.amount)} • ${customer?.name || 'Cliente'}`,
          subtitle: `Data combinada: ${formatDate(prom.promisedDate)} ${prom.notes ? `• "${prom.notes}"` : ''}`,
          badge: prom.status === 'kept' ? 'Cumprida' : prom.status === 'broken' ? 'Incumprida' : 'Pendente',
          badgeVariant: (prom.status === 'kept' ? 'success' : prom.status === 'broken' ? 'danger' : 'warning') as any,
          icon: <HandCoins className="w-4 h-4 text-amber-600" />,
          onClick: () => {
            navigate('dashboard_collection_center');
            onClose();
          },
        });
      }
    });

    // 4. Mensagens
    messages.forEach((msg) => {
      const customer = customers.find((c) => c.id === msg.customerId);
      const matchText = msg.body?.toLowerCase().includes(q);
      const matchSubject = msg.subject?.toLowerCase().includes(q);
      const matchCust = customer?.name?.toLowerCase().includes(q);

      if (matchText || matchSubject || matchCust) {
        matched.push({
          id: `msg_${msg.id}`,
          category: 'messages',
          categoryLabel: 'Mensagens de Cobrança',
          title: msg.subject || `Mensagem para ${customer?.name || 'Cliente'}`,
          subtitle: `Canal: ${msg.channel.toUpperCase()} • Tom: ${msg.tone} • ${(msg.body || '').substring(0, 60)}...`,
          badge: msg.status === 'sent_manually' ? 'Enviada' : 'Gerada',
          badgeVariant: msg.status === 'sent_manually' ? 'success' : 'neutral',
          icon: <MessageSquare className="w-4 h-4 text-violet-600" />,
          onClick: () => {
            navigate('dashboard_messages');
            onClose();
          },
        });
      }
    });

    // 5. Modelos de Mensagem
    templates.forEach((tpl) => {
      const matchTitle = tpl.title?.toLowerCase().includes(q);
      const matchContent = tpl.content?.toLowerCase().includes(q);
      const matchSubject = tpl.subject?.toLowerCase().includes(q);

      if (matchTitle || matchContent || matchSubject) {
        matched.push({
          id: `tpl_${tpl.id}`,
          category: 'templates',
          categoryLabel: 'Modelos de Mensagem',
          title: tpl.title,
          subtitle: `${tpl.subject || 'Modelo de comunicação'} • Canal: ${tpl.channel} • Tom: ${tpl.tone}`,
          badge: tpl.isDefault ? 'Padrão' : 'Personalizado',
          badgeVariant: tpl.isDefault ? 'neutral' : 'primary',
          icon: <FileText className="w-4 h-4 text-blue-600" />,
          onClick: () => {
            navigate('dashboard_templates');
            onClose();
          },
        });
      }
    });

    // 6. Lembretes Operacionais
    reminders.forEach((rem) => {
      const matchTitle = rem.title?.toLowerCase().includes(q);
      const matchNotes = rem.notes?.toLowerCase().includes(q);
      const customer = customers.find((c) => c.id === rem.customerId);
      const matchCust = customer?.name?.toLowerCase().includes(q);

      if (matchTitle || matchNotes || matchCust) {
        matched.push({
          id: `rem_${rem.id}`,
          category: 'reminders',
          categoryLabel: 'Lembretes & Tarefas',
          title: rem.title,
          subtitle: `Agendado para ${formatDate(rem.scheduledDate)} • ${customer?.name || 'Cliente'}`,
          badge: rem.status === 'completed' ? 'Concluído' : rem.priority === 'urgent' ? 'Urgente' : 'Pendente',
          badgeVariant: rem.status === 'completed' ? 'success' : rem.priority === 'urgent' ? 'danger' : 'warning',
          icon: <Calendar className="w-4 h-4 text-amber-500" />,
          onClick: () => {
            navigate('dashboard_reminders');
            onClose();
          },
        });
      }
    });

    return matched;
  }, [query, customers, invoices, promises, messages, templates, reminders, navigate, navigateToCustomer, navigateToInvoice, onClose]);

  // Teclado (Up, Down, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].onClick();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Agrupamento por Categoria
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: SearchResultItem[] } = {};
    results.forEach((item) => {
      if (!groups[item.categoryLabel]) {
        groups[item.categoryLabel] = [];
      }
      groups[item.categoryLabel].push(item);
    });
    return groups;
  }, [results]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[80vh] overflow-hidden" onKeyDown={handleKeyDown}>
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Pesquisar clientes, faturas, referências, mensagens, modelos, promessas..."
            className="flex-1 text-sm bg-transparent border-0 focus:outline-hidden text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            ESC
          </span>
        </div>

        {/* Lista de Resultados Agrupados */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[420px]">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum resultado encontrado</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Não encontramos registos correspondentes a <span className="font-semibold text-slate-800">"{query}"</span> no espaço de trabalho <span className="font-semibold text-slate-800">{account?.name}</span>.
              </p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([catLabel, items]) => (
              <div key={catLabel} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{catLabel}</span>
                  <span className="text-slate-400 font-medium">({items.length})</span>
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const itemGlobalIndex = results.findIndex((r) => r.id === item.id);
                    const isSelected = itemGlobalIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-950'
                            : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {item.title}
                              </span>
                              {item.badge && (
                                <Badge variant={item.badgeVariant || 'neutral'} size="sm">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium ml-2 shrink-0">
                            <span>Abrir</span>
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Dicas de Atalhos */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs">↵</kbd>
              <span>Selecionar</span>
            </span>
          </div>
          <span className="text-slate-400">
            Espaço: <span className="font-semibold text-slate-600">{account?.name || 'PAGORA'}</span>
          </span>
        </div>
      </div>
    </Modal>
  );
};
