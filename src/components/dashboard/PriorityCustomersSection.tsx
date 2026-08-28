import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PriorityCustomerSummary } from '../../lib/dashboardAnalytics';
import { formatCurrency } from '../../lib/formatters';
import {
  Users,
  Building2,
  User,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface PriorityCustomersSectionProps {
  customers: PriorityCustomerSummary[];
  onViewCustomer: (customerId: string) => void;
  onGenerateMessage: (customerId: string) => void;
  onViewAllCustomers: () => void;
}

export const PriorityCustomersSection: React.FC<PriorityCustomersSectionProps> = ({
  customers,
  onViewCustomer,
  onGenerateMessage,
  onViewAllCustomers,
}) => {
  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Clientes Prioritários</CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              Clientes com maior exposição de saldo ou histórico recente de atraso
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onViewAllCustomers}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Ver todos
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {customers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {customers.map(({ customer, overdueAmount, totalReceivable, overdueInvoicesCount, hasBrokenPromise }) => (
              <div
                key={customer.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 sm:mt-0">
                    {customer.type === 'company' ? (
                      <Building2 className="w-4 h-4 text-slate-500" />
                    ) : (
                      <User className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onViewCustomer(customer.id)}
                        className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate text-left"
                      >
                        {customer.name}
                      </button>

                      {hasBrokenPromise && (
                        <Badge variant="danger" size="sm" className="font-bold">
                          Promessa Quebrada
                        </Badge>
                      )}

                      {overdueInvoicesCount > 0 && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          {overdueInvoicesCount} fatura{overdueInvoicesCount > 1 ? 's' : ''} vencida{overdueInvoicesCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      {customer.email && <span className="truncate">{customer.email}</span>}
                      {customer.phone && (
                        <>
                          <span>•</span>
                          <span>{customer.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    {overdueAmount > 0 ? (
                      <div>
                        <div className="text-xs font-extrabold text-amber-700">
                          {formatCurrency(overdueAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500">em atraso</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(totalReceivable)}
                        </div>
                        <div className="text-[10px] text-slate-500">a receber</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerateMessage(customer.id)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                      className="text-xs h-7 px-2.5 bg-white font-medium"
                    >
                      Cobrar
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewCustomer(customer.id)}
                      className="text-xs h-7 px-2 text-slate-600 hover:text-slate-900"
                      title="Ver perfil do cliente"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p>Nenhum cliente com dívidas ou pendências prioritárias.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
