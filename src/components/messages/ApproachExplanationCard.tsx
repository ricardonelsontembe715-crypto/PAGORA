import React from 'react';
import { ApproachExplanation } from '../../lib/collectionIntelligence';
import { Badge } from '../ui/Badge';
import {
  Compass,
  Clock,
  Send,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ApproachExplanationCardProps {
  explanation: ApproachExplanation;
}

export const ApproachExplanationCard: React.FC<ApproachExplanationCardProps> = ({
  explanation,
}) => {
  return (
    <div
      id="approach-explanation-card"
      className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 space-y-3 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              Sugestão de Abordagem da Pagora
            </span>
            <h4 className="text-xs font-bold text-slate-900">
              {explanation.headline}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-indigo-200/60">
            Tom: <strong className="text-indigo-900 capitalize">{explanation.recommendedToneLabel}</strong>
          </span>
          <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-indigo-200/60">
            Canal: <strong className="text-indigo-900 capitalize">{explanation.recommendedChannel}</strong>
          </span>
        </div>
      </div>

      {/* Bloco "Porquê esta abordagem?" */}
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-bold text-indigo-950 block mb-0.5">
            Porquê esta abordagem?
          </span>
          <p className="text-slate-700 leading-relaxed font-medium">
            {explanation.explanation}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="bg-white/80 rounded-lg p-2.5 border border-indigo-100 flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Momento Recomendado
              </span>
              <span className="text-xs text-slate-800 font-medium">
                {explanation.timingAdvice}
              </span>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg p-2.5 border border-indigo-100 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Objetivo do Contacto
              </span>
              <span className="text-xs text-slate-800 font-medium truncate block">
                {explanation.suggestedAction}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
