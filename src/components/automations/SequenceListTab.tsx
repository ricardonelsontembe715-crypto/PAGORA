import React, { useState } from 'react';
import { CollectionSequence } from '../../types/automations';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Layers,
  Plus,
  Play,
  Pause,
  Edit2,
  Copy,
  Trash2,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface SequenceListTabProps {
  sequences: CollectionSequence[];
  onOpenCreate: () => void;
  onEdit: (sequence: CollectionSequence) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const SequenceListTab: React.FC<SequenceListTabProps> = ({
  sequences,
  onOpenCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(sequences[0]?.id || null);

  const getCategoryBadge = (cat: CollectionSequence['category']) => {
    switch (cat) {
      case 'friendly':
        return <Badge variant="success">Amigável</Badge>;
      case 'professional':
        return <Badge variant="info">Profissional B2B</Badge>;
      case 'b2b':
        return <Badge variant="neutral">Grandes Contas</Badge>;
      case 'recurrent':
        return <Badge variant="warning">Recorrente</Badge>;
      case 'overdue':
        return <Badge variant="error">Atraso Crítico</Badge>;
      case 'broken_promise':
        return <Badge variant="error">Promessa Quebrada</Badge>;
      case 'preventive':
        return <Badge variant="success">Preventiva</Badge>;
      default:
        return <Badge variant="neutral">Estratégia</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Sequências Estruturadas de Cobrança
          </h3>
          <p className="text-xs text-slate-500">
            Estratégias cronológicas completas para acompanhar os clientes desde o pré-vencimento até à recuperação.
          </p>
        </div>

        <Button size="sm" onClick={onOpenCreate} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Sequência
        </Button>
      </div>

      {/* Lista de Sequências */}
      <div className="space-y-3.5">
        {sequences.map((seq) => {
          const isExpanded = expandedId === seq.id;

          return (
            <div
              key={seq.id}
              id={`sequence-card-${seq.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
            >
              {/* Topo do Card */}
              <div className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Layers className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        {seq.name}
                      </h4>
                      {getCategoryBadge(seq.category)}
                      {seq.isPreset && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Padrão PAGORA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {seq.description}
                    </p>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : seq.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    {isExpanded ? 'Ocultar Etapas' : `Ver ${seq.steps.length} Etapas`}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(seq.id)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      seq.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                    }`}
                  >
                    {seq.isActive ? 'Ativa' : 'Inativa'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(seq)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Editar sequência"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicate(seq.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Duplicar sequência"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(seq.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Eliminar sequência"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Timeline Visual Expandida */}
              {isExpanded && (
                <div className="p-4.5 border-t border-slate-100 bg-white">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Fluxo Cronológico de Mensagens e Contactos:
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {seq.steps.map((step, idx) => (
                      <div key={step.id} className="relative flex items-start gap-3 text-xs">
                        {/* Marcador do Ponto */}
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {idx + 1}
                        </div>

                        <div className="flex-1 bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {step.title}
                              </span>
                              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                                {step.offsetDays < 0
                                  ? `${Math.abs(step.offsetDays)} dias antes`
                                  : step.offsetDays === 0
                                  ? 'No dia'
                                  : `+${step.offsetDays} dias após`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="capitalize">Canal: <strong>{step.channel}</strong></span>
                              <span>•</span>
                              <span className="capitalize">Tom: <strong>{step.tone}</strong></span>
                            </div>
                          </div>

                          <p className="text-slate-600 text-xs mb-1.5">
                            {step.description}
                          </p>

                          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500" />
                            Ação sugerida: <span className="text-slate-800 font-semibold">{step.actionText}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
