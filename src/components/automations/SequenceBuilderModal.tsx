import React, { useState } from 'react';
import { CollectionSequence, SequenceStep, SequenceCategory, ReminderPriority } from '../../types/automations';
import { MessageChannel, MessageTone, MessageCategory } from '../../types/database';
import { Button } from '../ui/Button';
import {
  X,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SequenceBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CollectionSequence, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: CollectionSequence;
}

export const SequenceBuilderModal: React.FC<SequenceBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<SequenceCategory>(initialData?.category || 'professional');
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);

  const [steps, setSteps] = useState<SequenceStep[]>(
    initialData?.steps || [
      {
        id: 'step_1',
        stepNumber: 1,
        offsetDays: -3,
        title: 'Aviso Preventivo',
        description: 'Lembrete cordial antes do vencimento.',
        tone: 'cordial',
        channel: 'whatsapp',
        priority: 'low',
        actionText: 'Enviar lembrete preventivo',
        category: 'before_due',
      },
      {
        id: 'step_2',
        stepNumber: 2,
        offsetDays: 0,
        title: 'Confirmação no Dia',
        description: 'Lembrete no dia do vencimento.',
        tone: 'professional',
        channel: 'whatsapp',
        priority: 'medium',
        actionText: 'Confirmar vencimento na data',
        category: 'due_date',
      },
      {
        id: 'step_3',
        stepNumber: 3,
        offsetDays: 3,
        title: 'Primeiro Acompanhamento de Atraso',
        description: 'Contacto inicial após passar o prazo.',
        tone: 'direct',
        channel: 'whatsapp',
        priority: 'high',
        actionText: 'Solicitar confirmação de liquidação',
        category: 'overdue_first',
      },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddStep = () => {
    const lastStep = steps[steps.length - 1];
    const nextOffset = lastStep ? (lastStep.offsetDays < 0 ? 0 : lastStep.offsetDays + 7) : 0;

    const newStep: SequenceStep = {
      id: `step_${Date.now()}`,
      stepNumber: steps.length + 1,
      offsetDays: nextOffset,
      title: `Etapa ${steps.length + 1} de Cobrança`,
      description: 'Acompanhamento progressivo de regularização.',
      tone: 'formal',
      channel: 'email',
      priority: 'high',
      actionText: 'Enviar comunicação formal',
      category: 'professional_collection',
    };

    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    if (steps.length <= 1) {
      setError('A sequência deve conter pelo menos 1 etapa.');
      return;
    }
    const filtered = steps.filter((s) => s.id !== id);
    // Reordena
    const reordered = filtered.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
    }));
    setSteps(reordered);
  };

  const handleUpdateStep = (id: string, updates: Partial<SequenceStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Indique o nome da sequência.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Ordena as etapas por offsetDays crescente
      const sortedSteps = [...steps].sort((a, b) => a.offsetDays - b.offsetDays);
      const indexedSteps = sortedSteps.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
      }));

      await onSave({
        name,
        description: description || 'Sequência estruturada de cobrança.',
        category,
        isActive,
        isPreset: initialData?.isPreset ?? false,
        steps: indexedSteps,
        assignedCustomersCount: initialData?.assignedCustomersCount || 0,
        assignedInvoicesCount: initialData?.assignedInvoicesCount || 0,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar sequência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="sequence-builder-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialData ? 'Editar Sequência de Cobrança' : 'Criar Nova Sequência de Cobrança'}
              </h2>
              <p className="text-xs text-slate-500">
                Defina a cronologia de ações antes e após o vencimento das faturas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nome da Sequência <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sequência Corporativa B2B"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estratégia / Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SequenceCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
              >
                <option value="friendly">Amigável (Clientes Regulares & Parceiros)</option>
                <option value="professional">Profissional (Padrão Corporativo B2B)</option>
                <option value="b2b">Grandes Contas & Multinacionais</option>
                <option value="recurrent">Clientes Recorrentes / Avenças</option>
                <option value="overdue">Atraso Crítico / Firme</option>
                <option value="broken_promise">Promessa Não Cumprida</option>
                <option value="preventive">100% Preventiva</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Estratégia progressiva de lembretes e cobranças estruturadas."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Timeline Visual das Etapas */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Linha Temporal de Etapas ({steps.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStep}
                className="text-xs py-1"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 relative group transition-all hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-xs">
                        {step.offsetDays < 0
                          ? `${Math.abs(step.offsetDays)} dias ANTES do vencimento`
                          : step.offsetDays === 0
                          ? 'No DIA do vencimento'
                          : `${step.offsetDays} dias APÓS o vencimento`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStep(step.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remover esta etapa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Momento (Dias de Offset)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={step.offsetDays}
                          onChange={(e) => handleUpdateStep(step.id, { offsetDays: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-bold text-slate-900 text-xs text-center"
                        />
                        <span className="text-[10px] text-slate-400 shrink-0">dias (- antes, + após)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Título da Etapa
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Canal Recomendado
                      </label>
                      <select
                        value={step.channel}
                        onChange={(e) => handleUpdateStep(step.id, { channel: e.target.value as MessageChannel })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">E-mail</option>
                        <option value="sms">SMS</option>
                        <option value="in_person">Contacto Telefónico</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Tom da Mensagem
                      </label>
                      <select
                        value={step.tone}
                        onChange={(e) => handleUpdateStep(step.id, { tone: e.target.value as MessageTone })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      >
                        <option value="cordial">Cordial (Amigável)</option>
                        <option value="professional">Profissional (Padrão)</option>
                        <option value="direct">Direto (Objetivo)</option>
                        <option value="formal">Formal (Firme)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Ação Sugerida
                      </label>
                      <input
                        type="text"
                        value={step.actionText}
                        onChange={(e) => handleUpdateStep(step.id, { actionText: e.target.value })}
                        placeholder="Ex: Enviar lembrete com IBAN"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : initialData ? 'Guardar Alterações' : 'Criar Sequência'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
