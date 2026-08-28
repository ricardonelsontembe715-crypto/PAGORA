import React from 'react';
import { CommunicationStats, EfficiencyMetrics } from '../../lib/reportsAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { MessageSquare, Send, Copy, Clock, Zap, Gauge, CheckSquare } from 'lucide-react';

interface CommunicationEfficiencySectionProps {
  communication: CommunicationStats;
  efficiency: EfficiencyMetrics;
}

export const CommunicationEfficiencySection: React.FC<CommunicationEfficiencySectionProps> = ({
  communication,
  efficiency,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Eficácia e Volume de Comunicação */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Atividade de Comunicação e Contactos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Registo de mensagens profissionais preparadas, copiadas e emitidas.
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Geradas</span>
            <span className="text-base font-extrabold text-slate-900">{communication.totalGenerated}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Copiadas</span>
            <span className="text-base font-extrabold text-indigo-600">{communication.totalCopied}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Enviadas</span>
            <span className="text-base font-extrabold text-emerald-600">{communication.totalManuallySent}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Canais</span>
            <span className="text-xs font-semibold text-slate-600 mt-1 block">
              {communication.whatsappCount}W • {communication.emailCount}E • {communication.smsCount}S
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
          Todas as comunicações respeitam os canais preferenciais dos clientes (WhatsApp, E-mail ou SMS).
        </div>
      </div>

      {/* 2. Scorecard de Eficiência Operacional */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Indicadores de Eficiência Financeira (DSO & Liquidez)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rácio de tempo médio de liquidação e saúde da carteira a receber.
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-600">
            <Gauge className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-3">
          {/* Prazo Médio de Liquidação (DSO) */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Prazo Médio de Recebimento (DSO)
              </span>
              <span className="text-[11px] text-slate-500">
                Tempo decorrido entre a emissão da cobrança e a sua liquidação.
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-indigo-600">
                {efficiency.averagePaymentDays !== null ? `${efficiency.averagePaymentDays} dias` : '—'}
              </span>
            </div>
          </div>

          {/* Peso da Carteira em Atraso */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Percentagem de Valores em Atraso
              </span>
              <span className="text-[11px] text-slate-500">
                Proporção do saldo vencido face ao total da carteira em aberto.
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-sm font-extrabold ${
                (efficiency.overduePortfolioPercentage || 0) > 30 ? 'text-rose-600' : 'text-slate-800'
              }`}>
                {efficiency.overduePortfolioPercentage !== null ? `${efficiency.overduePortfolioPercentage}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
