import React, { useState } from 'react';
import { useAutomations } from '../../context/AutomationContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AutomationCard } from '../automations/AutomationCard';
import { AutomationModal } from '../automations/AutomationModal';
import { AutomationTemplatesModal } from '../automations/AutomationTemplatesModal';
import { SequenceBuilderModal } from '../automations/SequenceBuilderModal';
import { SequenceListTab } from '../automations/SequenceListTab';
import { ExecutionLogsTab } from '../automations/ExecutionLogsTab';
import { ConfirmModal } from '../common/ConfirmModal';
import { Automation, CollectionSequence } from '../../types/automations';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Zap,
  Plus,
  Sparkles,
  Layers,
  Clock,
  History,
  RotateCw,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AutomationsView: React.FC = () => {
  const {
    automations,
    sequences,
    executionLogs,
    metrics,
    createAutomation,
    updateAutomation,
    toggleAutomationStatus,
    duplicateAutomation,
    deleteAutomation,
    createSequence,
    updateSequence,
    toggleSequenceStatus,
    duplicateSequence,
    deleteSequence,
    runEngineManually,
  } = useAutomations();

  const { account } = useAuth();
  const { showToast } = useNotifications();

  // Abas de navegação interna
  const [activeTab, setActiveTab] = useState<'rules' | 'sequences' | 'logs' | 'settings'>('rules');

  // Filtros de regras
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Modais
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | undefined>(undefined);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const [isSeqBuilderOpen, setIsSeqBuilderOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<CollectionSequence | undefined>(undefined);

  // Estados de eliminação com confirmação
  const [ruleToDelete, setRuleToDelete] = useState<Automation | null>(null);
  const [seqToDelete, setSeqToDelete] = useState<CollectionSequence | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtragem de regras
  const filteredAutomations = automations.filter((auto) => {
    if (statusFilter !== 'all' && auto.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && auto.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = auto.name.toLowerCase().includes(term);
      const matchDesc = auto.description.toLowerCase().includes(term);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const handleOpenCreateRule = () => {
    setEditingAutomation(undefined);
    setIsBuilderOpen(true);
  };

  const handleOpenEditRule = (auto: Automation) => {
    setEditingAutomation(auto);
    setIsBuilderOpen(true);
  };

  const handleSaveRule = async (data: Omit<Automation, 'id' | 'accountId' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failedCount'>) => {
    if (editingAutomation) {
      await updateAutomation(editingAutomation.id, data);
    } else {
      await createAutomation(data);
    }
  };

  const handleSelectTemplate = async (preset: any) => {
    await createAutomation({
      name: preset.name,
      description: preset.description,
      status: 'active',
      category: preset.category,
      trigger: preset.trigger,
      conditions: preset.conditions,
      conditionLogic: preset.conditionLogic,
      actions: preset.actions,
      settings: preset.settings,
    });
  };

  const handleOpenCreateSeq = () => {
    setEditingSequence(undefined);
    setIsSeqBuilderOpen(true);
  };

  const handleOpenEditSeq = (seq: CollectionSequence) => {
    setEditingSequence(seq);
    setIsSeqBuilderOpen(true);
  };

  const handleSaveSeq = async (data: Omit<CollectionSequence, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => {
    if (editingSequence) {
      await updateSequence(editingSequence.id, data);
    } else {
      await createSequence(data);
    }
  };

  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    await deleteAutomation(ruleToDelete.id);
    setIsDeleting(false);
    setRuleToDelete(null);
    showToast('Regra de automação eliminada com sucesso.', 'info');
  };

  const handleConfirmDeleteSeq = async () => {
    if (!seqToDelete) return;
    setIsDeleting(true);
    await deleteSequence(seqToDelete.id);
    setIsDeleting(false);
    setSeqToDelete(null);
    showToast('Sequência de cobrança eliminada com sucesso.', 'info');
  };

  return (
    <div id="automations-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Automações & Regras de Cobrança
              </h1>
              <p className="text-xs text-slate-500">
                Configure gatilhos inteligentes para monitorizar vencimentos, atrasos e promessas sem esforço manual.
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
            Sincronizar Carteira
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplatesOpen(true)}
            className="text-xs font-semibold text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Biblioteca Pronta
          </Button>

          <Button size="sm" onClick={handleOpenCreateRule} className="text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Cartões de Indicadores Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Regras Ativas
          </span>
          <div className="text-2xl font-bold text-indigo-600">
            {metrics.activeAutomations}
            <span className="text-xs font-normal text-slate-400 ml-2">de {metrics.totalAutomations} totais</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Lembretes Pendentes
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.pendingReminders}
            <span className="text-xs font-normal text-slate-400 ml-2">({metrics.todayReminders} para hoje)</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Ações Executadas
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            {metrics.successfulActions}
            <span className="text-xs font-normal text-slate-400 ml-2">com sucesso</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Clientes em Acompanhamento
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.customersInFollowup}
            <span className="text-xs font-normal text-slate-400 ml-2">contas ativas</span>
          </div>
        </div>
      </div>

      {/* Abas Principais */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Regras de Automação ({automations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sequences')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'sequences'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sequências Inteligentes ({sequences.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico & Auditoria ({executionLogs.length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Regras de Automação */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Pesquisa */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar regras por nome ou descrição..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
              >
                <option value="all">Todas as categorias</option>
                <option value="preventive">Preventivas</option>
                <option value="due_date">No Vencimento</option>
                <option value="overdue">Em Atraso</option>
                <option value="promises">Promessas</option>
                <option value="customers">Alto Risco</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Estado:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    statusFilter === 'active' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Ativas
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('paused')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    statusFilter === 'paused' ? 'bg-white text-amber-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Em Pausa
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Regras */}
          {filteredAutomations.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
              <Zap className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                Nenhuma regra de automação encontrada
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Experimente ajustar os filtros ou ative uma das regras pré-configuradas da biblioteca oficial.
              </p>
              <Button size="sm" onClick={() => setIsTemplatesOpen(true)}>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Explorar Biblioteca Pronta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAutomations.map((auto) => (
                <AutomationCard
                  key={auto.id}
                  automation={auto}
                  onToggleStatus={toggleAutomationStatus}
                  onEdit={handleOpenEditRule}
                  onDuplicate={duplicateAutomation}
                  onDelete={() => setRuleToDelete(auto)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Sequências Inteligentes */}
      {activeTab === 'sequences' && (
        <SequenceListTab
          sequences={sequences}
          onOpenCreate={handleOpenCreateSeq}
          onEdit={handleOpenEditSeq}
          onDuplicate={duplicateSequence}
          onDelete={(id) => {
            const s = sequences.find((item) => item.id === id);
            if (s) setSeqToDelete(s);
          }}
          onToggleStatus={toggleSequenceStatus}
        />
      )}

      {/* Conteúdo da Aba 3: Histórico e Auditoria */}
      {activeTab === 'logs' && <ExecutionLogsTab logs={executionLogs} />}

      {/* Modais Integrados */}
      <AutomationModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleSaveRule}
        initialData={editingAutomation}
      />

      <AutomationTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <SequenceBuilderModal
        isOpen={isSeqBuilderOpen}
        onClose={() => setIsSeqBuilderOpen(false)}
        onSave={handleSaveSeq}
        initialData={editingSequence}
      />

      {/* Modal de Confirmação de Eliminação de Regra */}
      {ruleToDelete && (
        <ConfirmModal
          isOpen={!!ruleToDelete}
          onClose={() => setRuleToDelete(null)}
          onConfirm={handleConfirmDeleteRule}
          isLoading={isDeleting}
          title={`Eliminar regra "${ruleToDelete.name}"?`}
          description="A automação deixará de ser avaliada nos ciclos de sincronização e monitorização da carteira."
          confirmLabel="Sim, eliminar regra"
          cancelLabel="Cancelar"
          variant="danger"
          details={{
            willDelete: [
              `Regra de automação: ${ruleToDelete.name}`,
              'Configurações de gatilhos, condições e ações desta regra',
            ],
            willKeep: [
              'Lembretes e alertas já criados em execuções anteriores',
              'Histórico de auditoria e registos de execução nos logs',
            ],
            isIrreversible: true,
          }}
        />
      )}

      {/* Modal de Confirmação de Eliminação de Sequência */}
      {seqToDelete && (
        <ConfirmModal
          isOpen={!!seqToDelete}
          onClose={() => setSeqToDelete(null)}
          onConfirm={handleConfirmDeleteSeq}
          isLoading={isDeleting}
          title={`Eliminar sequência "${seqToDelete.name}"?`}
          description="Tem a certeza de que pretende remover esta régua cronológica de cobrança?"
          confirmLabel="Sim, eliminar sequência"
          cancelLabel="Cancelar"
          variant="danger"
          details={{
            willDelete: [
              `Sequência: ${seqToDelete.name}`,
              `Todas as ${seqToDelete.steps.length} etapas cronológicas associadas`,
            ],
            willKeep: [
              'Cobranças e clientes associados mantêm os seus estados',
              'Comunicações e mensagens já geradas anteriormente',
            ],
            isIrreversible: true,
          }}
        />
      )}
    </div>
  );
};
