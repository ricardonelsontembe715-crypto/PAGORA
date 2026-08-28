import React from 'react';
import { Invoice, Customer } from '../../types/database';
import { formatCurrency, formatDate, getDaysOverdue } from '../../lib/formatters';
import { useNavigation } from '../../context/NavigationContext';
import { X, ExternalLink, Receipt, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ReportsDetailModalProps {
  title: string;
  subtitle?: string;
  invoices: Invoice[];
  customers: Customer[];
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsDetailModal: React.FC<ReportsDetailModalProps> = ({
  title,
  subtitle,
  invoices,
  customers,
  isOpen,
  onClose,
}) => {
  const { navigateToInvoice } = useNavigation();

  if (!isOpen) return null;

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const totalAmount = invoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.amount - (inv.paidAmount || 0)),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total do Grupo</span>
              <span className="text-sm font-extrabold text-indigo-600">{formatCurrency(totalAmount)}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Listagem de Faturas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Nenhuma fatura encontrada neste segmento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                    <th className="py-2.5 px-3">N.º Fatura</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Emissão</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3 text-right">Montante</th>
                    <th className="py-2.5 px-3 text-right">Pendente</th>
                    <th className="py-2.5 px-3 text-center">Atraso</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const cust = customerMap.get(inv.customerId);
                    const daysOverdue = getDaysOverdue(inv.dueDate);
                    const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {cust?.name || 'Cliente'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {formatCurrency(balance)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {daysOverdue > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                              {daysOverdue} dias
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              No prazo
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigateToInvoice(inv.id);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline p-1"
                          >
                            <span>Abrir</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {invoices.length} fatura{invoices.length !== 1 ? 's' : ''} listada{invoices.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
