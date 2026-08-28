import React, { useState } from 'react';
import { PRESET_AUTOMATIONS } from '../../data/defaultAutomations';
import { Automation } from '../../types/automations';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  X,
  Zap,
  Check,
  Plus,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
} from 'lucide-react';

interface AutomationTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: typeof PRESET_AUTOMATIONS[0]) => void;
}

export const AutomationTemplatesModal: React.FC<AutomationTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Todas as receitas' },
    { id: 'preventive', label: 'Preventivas' },
    { id: 'due_date', label: 'No Vencimento' },
    { id: 'overdue', label: 'Em Atraso' },
    { id: 'promises', label: 'Promessas' },
    { id: 'customers', label: 'Alto Risco' },
  ];

  const filteredPresets = PRESET_AUTOMATIONS.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="automation-templates-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Biblioteca de Automações Prontas
              </h2>
              <p className="text-xs text-slate-500">
                Escolha uma estratégia testada e ative-a na sua conta com 1 clique.
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

        {/* Filtro de Categorias */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Modelos */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className="bg-white rounded-xl border border-slate-200/90 p-4.5 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">
                    {preset.name}
                  </h3>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {preset.description}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Gatilho: {preset.trigger.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Ação: Criar Lembrete & Sugerir Mensagem
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  size="sm"
                  onClick={() => {
                    onSelectTemplate(preset);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ativar Regra
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
