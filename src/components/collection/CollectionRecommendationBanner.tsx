import React from 'react';
import { PagoraActionableAdvice } from '../../lib/collectionIntelligence';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/formatters';
import {
  Compass,
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
  MessageSquare,
  Users,
  CheckSquare,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface CollectionRecommendationBannerProps {
  advice: PagoraActionableAdvice;
  onNavigateTab: (tab: 'today' | 'critical' | 'promises' | 'preventive' | 'all') => void;
  onOpenMessageGenerator: () => void;
  onNavigateCustomers: () => void;
  onNavigateInvoices: () => void;
}

export const CollectionRecommendationBanner: React.FC<CollectionRecommendationBannerProps> = ({
  advice,
  onNavigateTab,
  onOpenMessageGenerator,
  onNavigateCustomers,
  onNavigateInvoices,
}) => {
  return (
    <div
      id="pagora-decision-center"
      className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm relative"
    >
      <div className="relative z-10 space-y-4">
        {/* Cabeçalho do Bloco de Inteligência */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                Inteligência Operacional da Pagora
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                {advice.headline}
              </h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 self-start sm:self-auto">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Diagnóstico em Tempo Real
          </span>
        </div>

        {/* Pontos de Contexto Reais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {advice.summaryPoints.map((point, index) => (
            <div
              key={index}
              className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60 flex items-start gap-2.5"
            >
              <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* Recomendação Prática e Ações Imediatas */}
        <div className="bg-slate-800/90 rounded-lg p-3.5 border border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
              Próximo Passo Recomendado
            </span>
            <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
              {advice.recommendation}
            </p>
          </div>

          {/* Barra de Ações Práticas */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {advice.criticalInvoicesCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab('critical')}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs border border-rose-500/40"
              >
                <Flame className="w-3.5 h-3.5 mr-1.5" />
                Ver Críticas ({advice.criticalInvoicesCount})
              </Button>
            )}

            {advice.brokenPromisesCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('promises')}
                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-600 text-xs font-medium"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Ver Promessas ({advice.brokenPromisesCount})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMessageGenerator}
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-600 text-xs font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Gerar Mensagens
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateCustomers}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Ver Clientes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
