import React, { useState, useMemo } from 'react';
import { useAutomations } from '../../context/AutomationContext';
import { useCustomers } from '../../context/CustomerContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useNavigation } from '../../context/NavigationContext';
import { CollectionReminder, ReminderPriority } from '../../types/automations';
import { ReminderCard } from '../reminders/ReminderCard';
import { ReminderModal } from '../reminders/ReminderModal';
import { SnoozeModal } from '../reminders/SnoozeModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Sparkles,
  RotateCw,
  Layers,
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const {
    reminders,
    resolveReminder,
    snoozeReminder,
    createReminder,
    updateReminder,
    deleteReminder,
    runEngineManually,
    metrics,
  } = useAutomations();

  const { customers } = useCustomers();
  const { invoices } = useInvoices();
  const { navigate } = useNavigation();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'today' | 'overdue' | 'completed' | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<ReminderPriority | 'all'>('all');

  // Modais
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CollectionReminder | undefined>(undefined);
  const [snoozeTarget, setSnoozeTarget] = useState<CollectionReminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<CollectionReminder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Lista filtrada
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      // Filtro de estado
      if (statusFilter === 'pending' && rem.status !== 'pending') return false;
      if (statusFilter === 'today' && (rem.status !== 'pending' || rem.scheduledDate !== todayStr)) return false;
      if (statusFilter === 'overdue' && (rem.status !== 'pending' || rem.scheduledDate >= todayStr)) return false;
      if (statusFilter === 'completed' && rem.status !== 'completed') return false;

      // Filtro de prioridade
      if (priorityFilter !== 'all' && rem.priority !== priorityFilter) return false;

      // Pesquisa
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = rem.title.toLowerCase().includes(term);
        const matchCustomer = rem.customerName.toLowerCase().includes(term);
        const matchInvoice = rem.invoiceNumber?.toLowerCase().includes(term);
        const matchReason = rem.reason.toLowerCase().includes(term);
        if (!matchTitle && !matchCustomer && !matchInvoice && !matchReason) return false;
      }

      return true;
    });
  }, [reminders, statusFilter, priorityFilter, searchTerm, todayStr]);

  const handleOpenCreate = () => {
    setEditingReminder(undefined);
    setIsReminderModalOpen(true);
  };

  const handleOpenEdit = (rem: CollectionReminder) => {
    setEditingReminder(rem);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = async (data: Omit<CollectionReminder, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (editingReminder) {
      await updateReminder(editingReminder.id, data);
    } else {
      await createReminder(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!reminderToDelete) return;
    setIsDeleting(true);
    await deleteReminder(reminderToDelete.id);
    setIsDeleting(false);
    setReminderToDelete(null);
  };

  const handleGenerateMessage = (rem: CollectionReminder) => {
    navigate('dashboard_messages', {
      customerId: rem.customerId,
      invoiceId: rem.invoiceId,
    });
  };

  return (
    <div id="reminders-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Lembretes & Tarefas de Acompanhamento
              </h1>
              <p className="text-xs text-slate-500">
                Acompanhe os prazos operacionais, tarefas de cobrança e contactos agendados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={runEngineManually}
            className="text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Atualizar Tarefas
          </Button>

          <Button size="sm" onClick={handleOpenCreate} className="text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Lembrete
          </Button>
        </div>
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('today')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all shadow-2xs ${
            statusFilter === 'today' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Para Hoje
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.todayReminders}
            <span className="text-xs font-normal text-slate-400 ml-2">ações imediatas</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('overdue')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all shadow-2xs ${
            statusFilter === 'overdue' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Ações Atrasadas
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.overdueReminders}
            <span className="text-xs font-normal text-slate-400 ml-2">pendentes anteriores</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all shadow-2xs ${
            statusFilter === 'pending' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Total Pendentes
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.pendingReminders}
            <span className="text-xs font-normal text-slate-400 ml-2">por concluir</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('completed')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all shadow-2xs ${
            statusFilter === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Resolvidos
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.completedReminders}
            <span className="text-xs font-normal text-slate-400 ml-2">concluídos</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar lembretes por cliente, fatura ou título..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="all">Todas as prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        {/* Filtro Rápido de Estado */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'pending' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Pendentes ({metrics.pendingReminders})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('today')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'today' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Hoje ({metrics.todayReminders})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'overdue' ? 'bg-white text-amber-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Atrasados ({metrics.overdueReminders})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'completed' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Resolvidos ({metrics.completedReminders})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Todos ({reminders.length})
          </button>
        </div>
      </div>

      {/* Lista de Lembretes */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            Nenhum lembrete nesta vista
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não existem tarefas pendentes com os filtros atuais. Pode criar um novo lembrete manual ou sincronizar a carteira.
          </p>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Criar Lembrete Manual
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map((rem) => (
            <ReminderCard
              key={rem.id}
              reminder={rem}
              onResolve={resolveReminder}
              onSnooze={(r) => setSnoozeTarget(r)}
              onGenerateMessage={handleGenerateMessage}
              onEdit={handleOpenEdit}
              onDelete={() => setReminderToDelete(rem)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        customers={customers}
        invoices={invoices}
        onSave={handleSaveReminder}
        initialData={editingReminder}
      />

      <SnoozeModal
        isOpen={!!snoozeTarget}
        onClose={() => setSnoozeTarget(null)}
        reminder={snoozeTarget}
        onSnooze={snoozeReminder}
      />

      {/* Modal de Confirmação de Eliminação */}
      {reminderToDelete && (
        <ConfirmModal
          isOpen={!!reminderToDelete}
          onClose={() => setReminderToDelete(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title={`Eliminar lembrete "${reminderToDelete.title}"?`}
          description="Tem a certeza de que pretende remover esta tarefa operacional da sua lista de acompanhamento?"
          confirmLabel="Sim, eliminar lembrete"
          cancelLabel="Cancelar"
          variant="danger"
          details={{
            willDelete: [
              `Lembrete: ${reminderToDelete.title}`,
              `Agendamento para ${reminderToDelete.scheduledDate}`,
            ],
            willKeep: [
              'Cobrança associada e estado financeiro inalterados',
              'Histórico de comunicações e notas do cliente',
            ],
            isIrreversible: true,
          }}
        />
      )}
    </div>
  );
};
