import React, { useState } from 'react';
import { Customer, Invoice, PaymentPromise } from '../../types/database';
import { CollectionReminder } from '../../types/automations';
import {
  askPagoraAssistant,
  AIAssistantResponse,
  AIAssistantRecommendation,
} from '../../lib/aiAssistantService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Bot,
  Sparkles,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface IntelligentAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  invoices: Invoice[];
  promises: PaymentPromise[];
  reminders: CollectionReminder[];
  onSelectAction?: (action: AIAssistantRecommendation['suggestedAction']) => void;
}

export const IntelligentAssistantDrawer: React.FC<IntelligentAssistantDrawerProps> = ({
  isOpen,
  onClose,
  customers,
  invoices,
  promises,
  reminders,
  onSelectAction,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIAssistantResponse | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    try {
      const resp = await askPagoraAssistant(q, {
        customers,
        invoices,
        promises,
        reminders,
      });
      setResult(resp);
    } catch {
      // Handled inside service with deterministic fallback
    } finally {
      setIsLoading(false);
    }
  };

  const quickQueries = [
    'Quem devo contactar hoje com maior urgência?',
    'Qual é o montante total em atraso e quais as faturas em risco?',
    'Existem promessas de pagamento por cumprir?',
    'Como posso otimizar a cobrança da minha carteira?',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">Assistente de Cobrança PAGORA</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {result?.isLiveAi ? 'IA Conectada' : 'Motor Analítico'}
                </span>
              </div>
              <p className="text-xs text-slate-300">Análise contextual da sua carteira em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Prompts */}
          {!result && (
            <div className="space-y-3">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Sugestões Rápidas de Análise
                </p>
                <p className="text-[11px] text-indigo-700">
                  Faça perguntas em linguagem natural sobre clientes, prioridades de cobrança e previsão de recebimentos.
                </p>
              </div>

              <div className="space-y-2">
                {quickQueries.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestion(q);
                      handleAsk(q);
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-xs text-slate-700 font-medium flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {/* Answer card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Resposta & Diagnóstico
                  </span>
                  <span className="text-[10px] text-slate-500">PT-PT</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {result.answer}
                </div>
              </div>

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Ações Sugeridas ({result.recommendations.length})
                  </h4>

                  {result.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              rec.category === 'URGENT'
                                ? 'bg-rose-500'
                                : rec.category === 'BROKEN_PROMISE'
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                          />
                          <h5 className="text-xs font-bold text-slate-900">{rec.title}</h5>
                        </div>
                        <Badge
                          variant={
                            rec.category === 'URGENT'
                              ? 'danger'
                              : rec.category === 'BROKEN_PROMISE'
                              ? 'warning'
                              : 'info'
                          }
                          size="sm"
                        >
                          {rec.category === 'URGENT'
                            ? 'Crítico'
                            : rec.category === 'BROKEN_PROMISE'
                            ? 'Promessa Quebrada'
                            : 'Preventivo'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600">{rec.recommendation}</p>

                      <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 space-y-1">
                        <span className="font-semibold text-slate-700 block">Dados Grounded:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                          {rec.dataUsed.map((d, dIdx) => (
                            <li key={dIdx}>{d}</li>
                          ))}
                        </ul>
                      </div>

                      {rec.suggestedAction && onSelectAction && (
                        <div className="pt-1 flex justify-end">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              onSelectAction(rec.suggestedAction);
                              onClose();
                            }}
                          >
                            <span>{rec.suggestedAction.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Input Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Quais clientes têm faturas com mais de 15 dias de atraso?"
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={!question.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
