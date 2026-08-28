import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ChartDataPoint } from '../../lib/dashboardAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, Info } from 'lucide-react';

interface RevenuePerformanceChartProps {
  chartData: ChartDataPoint[];
  collectionRate: number | null;
  recoveredAmount: number;
  invoicedInPeriod: number;
  paidInPeriod: number;
  periodLabel: string;
}

export const RevenuePerformanceChart: React.FC<RevenuePerformanceChartProps> = ({
  chartData,
  collectionRate,
  recoveredAmount,
  invoicedInPeriod,
  paidInPeriod,
  periodLabel,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Determinar valor máximo para normalização das barras (com mínimo de segurança para evitar divisão por zero)
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.invoiced, d.received, d.overdue)),
    100
  );

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Desempenho de Recebimentos</CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              Evolução temporal de cobranças emitidas vs valores liquidados ({periodLabel})
            </CardDescription>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-600 font-medium">Recebido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-indigo-500" />
              <span className="text-slate-600 font-medium">Faturado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-amber-400" />
              <span className="text-slate-600 font-medium">Em atraso</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Painel Superior de Indicadores de Eficiência */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
          {/* Taxa de Recebimento */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Taxa de Liquidação
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {collectionRate !== null ? `${collectionRate}%` : '100%'}
              </div>
            </div>
          </div>

          {/* Valor Recuperado (Pós-Vencimento) */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Valor Recuperado
              </div>
              <div className="text-lg font-extrabold text-indigo-900">
                {formatCurrency(recoveredAmount)}
              </div>
            </div>
          </div>

          {/* Faturado no Período */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Faturado ({periodLabel})
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {formatCurrency(invoicedInPeriod)}
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras Responsivo */}
        <div className="pt-2">
          {chartData.length > 0 ? (
            <div className="relative">
              {/* Tooltip Dinâmico */}
              {hoveredPoint && (
                <div className="absolute top-0 right-0 z-10 p-2.5 bg-slate-900 text-white rounded-lg shadow-lg text-xs space-y-1 pointer-events-none">
                  <div className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                    {hoveredPoint.label}
                  </div>
                  <div className="flex items-center justify-between gap-4 text-emerald-400">
                    <span>Recebido:</span>
                    <strong>{formatCurrency(hoveredPoint.received)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-indigo-300">
                    <span>Faturado:</span>
                    <strong>{formatCurrency(hoveredPoint.invoiced)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-amber-300">
                    <span>Em atraso:</span>
                    <strong>{formatCurrency(hoveredPoint.overdue)}</strong>
                  </div>
                </div>
              )}

              {/* Área do Gráfico */}
              <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-6 border-b border-slate-200 px-1">
                {chartData.map((item, idx) => {
                  const receivedHeight = Math.min(100, Math.round((item.received / maxVal) * 100));
                  const invoicedHeight = Math.min(100, Math.round((item.invoiced / maxVal) * 100));
                  const overdueHeight = Math.min(100, Math.round((item.overdue / maxVal) * 100));

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(item)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Grupo de Barras */}
                      <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1.5 h-full max-w-[48px]">
                        {/* Barra Recebido */}
                        <div
                          className="w-full bg-emerald-500 rounded-t-xs transition-all duration-300 group-hover:bg-emerald-600"
                          style={{ height: `${Math.max(receivedHeight, 4)}%` }}
                        />
                        {/* Barra Faturado */}
                        <div
                          className="w-full bg-indigo-500 rounded-t-xs transition-all duration-300 group-hover:bg-indigo-600"
                          style={{ height: `${Math.max(invoicedHeight, 4)}%` }}
                        />
                        {/* Barra Atraso */}
                        <div
                          className="w-full bg-amber-400 rounded-t-xs transition-all duration-300 group-hover:bg-amber-500"
                          style={{ height: `${Math.max(overdueHeight, 4)}%` }}
                        />
                      </div>

                      {/* Rótulo de Data no Eixo X */}
                      <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-slate-500 text-center truncate max-w-full group-hover:text-slate-900 group-hover:font-semibold">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              Dados insuficientes para gerar a curva temporal.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
