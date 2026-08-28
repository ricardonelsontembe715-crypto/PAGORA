import React, { useState } from 'react';
import { CustomerReportItem } from '../../lib/reportsAnalytics';
import { formatCurrency } from '../../lib/formatters';
import { useNavigation } from '../../context/NavigationContext';
import {
  Users,
  Search,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Award,
} from 'lucide-react';

interface CustomerBehaviorSectionProps {
  customerReports: CustomerReportItem[];
  topExposedCustomers: CustomerReportItem[];
  topConsistentCustomers: CustomerReportItem[];
}

type SortField = 'overdue' | 'outstanding' | 'received' | 'invoiced' | 'invoices_count' | 'dso';

export const CustomerBehaviorSection: React.FC<CustomerBehaviorSectionProps> = ({
  customerReports,
  topExposedCustomers,
  topConsistentCustomers,
}) => {
  const { navigateToCustomer } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('overdue');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredCustomers = customerReports
    .filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.customer.name.toLowerCase().includes(q) ||
        (item.customer.taxId && item.customer.taxId.toLowerCase().includes(q)) ||
        (item.customer.email && item.customer.email.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case 'overdue':
          diff = a.totalOverdue - b.totalOverdue;
          break;
        case 'outstanding':
          diff = a.totalOutstanding - b.totalOutstanding;
          break;
        case 'received':
          diff = a.totalReceived - b.totalReceived;
          break;
        case 'invoiced':
          diff = a.totalInvoiced - b.totalInvoiced;
          break;
        case 'invoices_count':
          diff = a.invoicesCount - b.invoicesCount;
          break;
        case 'dso':
          diff = (a.averagePaymentDays || 0) - (b.averagePaymentDays || 0);
          break;
      }
      return sortAsc ? diff : -diff;
    });

  const getRiskBadge = (score: CustomerReportItem['riskScore']) => {
    switch (score) {
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            Baixo Risco
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
            Moderado
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
            Alto Risco
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
            Crítico
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 2 Cards de Destaque: Maior Exposição de Risco vs Melhores Pagadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Maior Exposição de Risco */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Clientes com Maior Exposição em Atraso
                </h4>
                <p className="text-[11px] text-slate-500">
                  Concentração dos maiores saldos vencidos na carteira.
                </p>
              </div>
            </div>
          </div>

          {topExposedCustomers.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Sem clientes com valores em atraso.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topExposedCustomers.slice(0, 3).map((item) => (
                <div
                  key={item.customer.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigateToCustomer(item.customer.id)}
                      className="font-bold text-slate-800 hover:text-indigo-600 truncate text-left block"
                    >
                      {item.customer.name}
                    </button>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.invoicesCount} fatura{item.invoicesCount !== 1 ? 's' : ''} • {item.percentageOfOverduePortfolio}% do total em atraso
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-rose-600">
                      {formatCurrency(item.totalOverdue)}
                    </div>
                    {getRiskBadge(item.riskScore)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Clientes Mais Consistentes */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Melhores Pagadores (Liquidação Pontual)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Clientes com 100% de cumprimento e histórico exemplar.
                </p>
              </div>
            </div>
          </div>

          {topConsistentCustomers.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Sem dados suficientes de pagamentos liquidados.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topConsistentCustomers.slice(0, 3).map((item) => (
                <div
                  key={item.customer.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigateToCustomer(item.customer.id)}
                      className="font-bold text-slate-800 hover:text-indigo-600 truncate text-left block"
                    >
                      {item.customer.name}
                    </button>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.paidInvoicesCount} fatura{item.paidInvoicesCount !== 1 ? 's' : ''} liquidada{item.paidInvoicesCount !== 1 ? 's' : ''} no prazo
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-600">
                      {formatCurrency(item.totalReceived)}
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Pontual
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabela Principal de Comportamento dos Clientes */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Matriz de Comportamento e Histórico por Cliente
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Análise comparativa de volume faturado, recebido, saldos pendentes e prazos médios.
            </p>
          </div>

          {/* Campo de Pesquisa Rápida */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar cliente ou NIF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-2.5 px-3">Cliente</th>
                <th
                  onClick={() => handleSort('invoiced')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Cobrado</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('received')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Recebido</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('outstanding')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Em Aberto</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('overdue')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Em Atraso</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dso')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-slate-900"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Prazo Médio</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Classificação</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    Nenhum cliente encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((item) => (
                  <tr
                    key={item.customer.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <div>
                        <span>{item.customer.name}</span>
                        {item.customer.taxId && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            NIF: {item.customer.taxId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                      {formatCurrency(item.totalInvoiced)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(item.totalReceived)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-amber-600">
                      {formatCurrency(item.totalOutstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {formatCurrency(item.totalOverdue)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                      {item.averagePaymentDays !== null ? `${item.averagePaymentDays} d` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {getRiskBadge(item.riskScore)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigateToCustomer(item.customer.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline p-1"
                        title="Ver ficha completa do cliente"
                      >
                        <span>Ver</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
