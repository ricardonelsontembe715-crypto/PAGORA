import React, { useState } from 'react';
import { AutomationExecutionLog } from '../../types/automations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { formatDate } from '../../lib/formatters';

interface ExecutionLogsTabProps {
  logs: AutomationExecutionLog[];
}

export const ExecutionLogsTab: React.FC<ExecutionLogsTabProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failed' | 'skipped'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (resultFilter !== 'all' && log.result !== resultFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = log.automationName.toLowerCase().includes(term);
      const matchCustomer = log.customerName?.toLowerCase().includes(term);
      const matchInvoice = log.invoiceNumber?.toLowerCase().includes(term);
      if (!matchName && !matchCustomer && !matchInvoice) return false;
    }
    return true;
  });

  const getResultBadge = (res: AutomationExecutionLog['result']) => {
    switch (res) {
      case 'success':
        return <Badge variant="success">Executado</Badge>;
      case 'failed':
        return <Badge variant="error">Falhou</Badge>;
      case 'skipped':
        return <Badge variant="neutral">Condição Não Cumprida</Badge>;
      default:
        return <Badge variant="neutral">{res}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por regra, cliente ou fatura..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as typeof resultFilter)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700"
          >
            <option value="all">Todos os resultados</option>
            <option value="success">Sucessos</option>
            <option value="skipped">Não aplicáveis</option>
            <option value="failed">Falhas</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total registado: <strong>{filteredLogs.length}</strong> eventos
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Nenhum registo de execução encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Regra de Automação</th>
                  <th className="px-4 py-3">Cliente / Cobrança</th>
                  <th className="px-4 py-3">Gatilho Disparado</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDate(log.executedAt)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {log.automationName}
                        </td>
                        <td className="px-4 py-3">
                          {log.customerName ? (
                            <div>
                              <span className="font-semibold text-slate-800">{log.customerName}</span>
                              {log.invoiceNumber && (
                                <span className="block text-[11px] text-slate-400">
                                  {log.invoiceNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Geral</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <code className="text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                            {log.triggerType}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          {getResultBadge(log.result)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            {isExpanded ? 'Ocultar' : 'Ver'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={6} className="px-6 py-3 border-t border-slate-100 text-xs">
                            <div className="space-y-2">
                              <p className="text-slate-700">
                                <strong>Detalhe da Operação:</strong> {log.details}
                              </p>
                              {log.actionExecuted && (
                                <p className="text-slate-600">
                                  <strong>Ação realizada:</strong> {log.actionExecuted}
                                </p>
                              )}
                              {log.conditionsEvaluated && log.conditionsEvaluated.length > 0 && (
                                <div>
                                  <span className="font-semibold text-slate-700">Condições avaliadas:</span>
                                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                                    {log.conditionsEvaluated.map((c, i) => (
                                      <li key={i}>
                                        <code>{c.condition}</code>: {c.matched ? 'Verdadeiro (Válido)' : 'Falso'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
