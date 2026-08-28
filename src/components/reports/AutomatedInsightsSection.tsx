import React from 'react';
import { AutomatedInsight, ActionableRecommendation } from '../../lib/reportsAnalytics';
import { useNavigation } from '../../context/NavigationContext';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';

interface AutomatedInsightsSectionProps {
  insights: AutomatedInsight[];
  recommendations: ActionableRecommendation[];
  onActionClick?: (rec: ActionableRecommendation) => void;
}

export const AutomatedInsightsSection: React.FC<AutomatedInsightsSectionProps> = ({
  insights,
  recommendations,
  onActionClick,
}) => {
  const { navigate, navigateToCustomer } = useNavigation();

  const getInsightIcon = (type: AutomatedInsight['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'critical':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'neutral':
      default:
        return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getInsightBg = (type: AutomatedInsight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-50/60 border-emerald-100 text-emerald-950';
      case 'warning':
        return 'bg-amber-50/60 border-amber-100 text-amber-950';
      case 'critical':
        return 'bg-rose-50/60 border-rose-100 text-rose-950';
      case 'neutral':
      default:
        return 'bg-indigo-50/60 border-indigo-100 text-indigo-950';
    }
  };

  const handleRecommendationAction = (rec: ActionableRecommendation) => {
    if (onActionClick) {
      onActionClick(rec);
      return;
    }

    switch (rec.actionType) {
      case 'view_invoices':
        navigate('dashboard_invoices');
        break;
      case 'view_customers':
        if (rec.targetCustomerId) {
          navigateToCustomer(rec.targetCustomerId);
        } else {
          navigate('dashboard_customers');
        }
        break;
      case 'generate_message':
        navigate('dashboard_messages');
        break;
      case 'view_promises':
        navigate('dashboard_overview');
        break;
      default:
        navigate('dashboard_invoices');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Insights Automáticos Baseados em Dados Reais */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Insights da sua Cobrança
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Observações deduzidas automaticamente a partir do comportamento da sua carteira.
              </p>
            </div>
          </div>
        </div>

        {insights.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Sem dados suficientes para gerar insights automatizados no período atual.
          </p>
        ) : (
          <div className="space-y-2.5">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${getInsightBg(
                  ins.type
                )}`}
              >
                <div className="p-1 bg-white/80 rounded-md shrink-0 shadow-2xs mt-0.5">
                  {getInsightIcon(ins.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{ins.title}</span>
                    {ins.metricValue && (
                      <span className="text-[11px] font-extrabold px-1.5 py-0.2 rounded bg-white/90 text-slate-800 shadow-2xs">
                        {ins.metricValue}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                    {ins.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Recomendações Práticas Acionáveis */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recomendações Práticas de Ação
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Passos sugeridos para melhorar a liquidez e mitigar riscos imediatos.
              </p>
            </div>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-600">
              Tudo em dia! Nenhuma ação corretiva prioritária pendente.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        rec.priority === 'critical'
                          ? 'bg-rose-500'
                          : rec.priority === 'high'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {rec.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {rec.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRecommendationAction(rec)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <span>{rec.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
