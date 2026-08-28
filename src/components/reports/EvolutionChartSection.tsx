import React, { useState } from 'react';
import { formatCurrency } from '../../lib/formatters';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

interface EvolutionChartPoint {
  label: string;
  dateKey: string;
  received: number;
  invoiced: number;
  outstanding: number;
  overdue: number;
}

interface EvolutionChartSectionProps {
  data: EvolutionChartPoint[];
  periodLabel: string;
}

type SeriesKey = 'received' | 'invoiced' | 'outstanding' | 'overdue';

export const EvolutionChartSection: React.FC<EvolutionChartSectionProps> = ({
  data,
  periodLabel,
}) => {
  const [activeSeries, setActiveSeries] = useState<Record<SeriesKey, boolean>>({
    received: true,
    invoiced: true,
    outstanding: true,
    overdue: true,
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const seriesConfig: Record<
    SeriesKey,
    { label: string; color: string; stroke: string; fill: string; dot: string }
  > = {
    received: {
      label: 'Recebido',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      stroke: '#10B981',
      fill: 'rgba(16, 185, 129, 0.12)',
      dot: 'bg-emerald-500',
    },
    invoiced: {
      label: 'Cobrado',
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      stroke: '#6366F1',
      fill: 'rgba(99, 102, 241, 0.12)',
      dot: 'bg-indigo-500',
    },
    outstanding: {
      label: 'Em aberto',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      stroke: '#F59E0B',
      fill: 'rgba(245, 158, 11, 0.12)',
      dot: 'bg-amber-500',
    },
    overdue: {
      label: 'Em atraso',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      stroke: '#EF4444',
      fill: 'rgba(239, 68, 68, 0.12)',
      dot: 'bg-rose-500',
    },
  };

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevenir desativar todas as séries ao mesmo tempo
      if (!Object.values(next).some(Boolean)) {
        return prev;
      }
      return next;
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Sem dados temporais disponíveis</p>
        <p className="text-xs text-slate-400 mt-1">
          À medida que emitir cobranças e registar pagamentos, o gráfico de evolução será calculado automaticamente.
        </p>
      </div>
    );
  }

  // Cálculos para o SVG do gráfico
  const maxValue = Math.max(
    ...data.map((d) =>
      Math.max(
        activeSeries.received ? d.received : 0,
        activeSeries.invoiced ? d.invoiced : 0,
        activeSeries.outstanding ? d.outstanding : 0,
        activeSeries.overdue ? d.overdue : 0
      )
    ),
    100
  );

  const chartHeight = 240;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = 800;
  const availableWidth = graphWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingY * 2;

  const pointsCount = data.length;
  const stepX = pointsCount > 1 ? availableWidth / (pointsCount - 1) : availableWidth;

  const getY = (val: number) => {
    const ratio = val / (maxValue * 1.1);
    return chartHeight - paddingY - ratio * availableHeight;
  };

  const getPath = (key: SeriesKey) => {
    if (!activeSeries[key] || data.length === 0) return '';
    return data
      .map((d, i) => {
        const x = paddingX + i * stepX;
        const y = getY(d[key]);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const getAreaPath = (key: SeriesKey) => {
    if (!activeSeries[key] || data.length === 0) return '';
    const linePath = getPath(key);
    const lastX = paddingX + (data.length - 1) * stepX;
    const firstX = paddingX;
    const bottomY = chartHeight - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Somatório das séries ativas para resumo
  const totals = {
    received: data.reduce((acc, d) => acc + d.received, 0),
    invoiced: data.reduce((acc, d) => acc + d.invoiced, 0),
    outstanding: data.reduce((acc, d) => acc + d.outstanding, 0),
    overdue: data.reduce((acc, d) => acc + d.overdue, 0),
  };

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Header do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Evolução Temporal dos Valores
            </h3>
            <span className="text-xs text-slate-400">({periodLabel})</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a sincronização entre cobranças emitidas, recebimentos e montantes em aberto.
          </p>
        </div>

        {/* Toggles de Séries */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(seriesConfig) as SeriesKey[]).map((key) => {
            const cfg = seriesConfig[key];
            const isActive = activeSeries[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSeries(key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isActive
                    ? cfg.color
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? cfg.dot : 'bg-slate-300'
                  }`}
                />
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({formatCurrency(totals[key])})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[650px]">
          <svg
            viewBox={`0 0 ${graphWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Linhas de Grelha Horizontais */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight - paddingY - ratio * availableHeight;
              const val = maxValue * 1.1 * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={graphWidth - paddingX}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-sans"
                  >
                    {Math.round(val).toLocaleString('pt-PT')} €
                  </text>
                </g>
              );
            })}

            {/* Áreas Sombreadas */}
            {(Object.keys(seriesConfig) as SeriesKey[]).map((key) =>
              activeSeries[key] ? (
                <path
                  key={`area_${key}`}
                  d={getAreaPath(key)}
                  fill={seriesConfig[key].fill}
                  className="transition-all duration-300"
                />
              ) : null
            )}

            {/* Linhas Principais */}
            {(Object.keys(seriesConfig) as SeriesKey[]).map((key) =>
              activeSeries[key] ? (
                <path
                  key={`line_${key}`}
                  d={getPath(key)}
                  fill="none"
                  stroke={seriesConfig[key].stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              ) : null
            )}

            {/* Pontos Interativos e Linha de Cursor */}
            {data.map((d, i) => {
              const x = paddingX + i * stepX;
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={`col_${d.dateKey}_${i}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Linha vertical de foco */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={chartHeight - paddingY}
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Pontos nas linhas ativas */}
                  {(Object.keys(seriesConfig) as SeriesKey[]).map((key) => {
                    if (!activeSeries[key]) return null;
                    const y = getY(d[key]);
                    return (
                      <circle
                        key={`pt_${key}_${i}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#FFFFFF"
                        stroke={seriesConfig[key].stroke}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />
                    );
                  })}

                  {/* Rótulo de Eixo X */}
                  <text
                    x={x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    className={`text-[11px] font-sans ${
                      isHovered
                        ? 'fill-indigo-600 font-bold'
                        : 'fill-slate-500 font-medium'
                    }`}
                  >
                    {d.label}
                  </text>

                  {/* Área invisível ampla para facilitar o clique/hover */}
                  <rect
                    x={x - stepX / 2}
                    y={paddingY}
                    width={stepX}
                    height={availableHeight}
                    fill="transparent"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip Dinâmico Flutuante */}
        {hoveredData && (
          <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="font-bold text-slate-100">Período: {hoveredData.label}</span>
              <span className="text-slate-400 text-[11px]">({hoveredData.dateKey})</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {activeSeries.invoiced && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-300">Cobrado:</span>
                  <strong className="text-white">{formatCurrency(hoveredData.invoiced)}</strong>
                </div>
              )}
              {activeSeries.received && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Recebido:</span>
                  <strong className="text-emerald-300">{formatCurrency(hoveredData.received)}</strong>
                </div>
              )}
              {activeSeries.outstanding && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Em aberto:</span>
                  <strong className="text-amber-300">{formatCurrency(hoveredData.outstanding)}</strong>
                </div>
              )}
              {activeSeries.overdue && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-slate-300">Em atraso:</span>
                  <strong className="text-rose-300">{formatCurrency(hoveredData.overdue)}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
