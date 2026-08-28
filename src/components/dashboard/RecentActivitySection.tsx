import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Invoice, Customer, ActivityLog, PaymentPromise } from '../../types/database';
import { formatCurrency, formatDate, formatDateTime, getDaysOverdue } from '../../lib/formatters';
import {
  Receipt,
  ArrowRight,
  Building2,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  MessageSquare,
  Activity,
} from 'lucide-react';

interface RecentActivitySectionProps {
  invoices: Invoice[];
  customers: Customer[];
  promises: PaymentPromise[];
  activityLogs: ActivityLog[];
  onViewInvoice: (invoiceId: string) => void;
  onViewAllInvoices: () => void;
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({
  invoices,
  customers,
  promises,
  activityLogs,
  onViewInvoice,
  onViewAllInvoices,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'timeline'>('invoices');

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const promiseMap = new Map<string, PaymentPromise>();
  promises.forEach((p) => promiseMap.set(p.invoiceId, p));

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentLogs = [...activityLogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const getInvoiceStatusBadge = (inv: Invoice) => {
    if (inv.status === 'canceled') {
      return (
        <Badge variant="default" size="sm">
          Cancelada
        </Badge>
      );
    }
    if (inv.status === 'paid') {
      return (
        <Badge variant="success" size="sm">
          Paga
        </Badge>
      );
    }
    const overdueDays = getDaysOverdue(inv.dueDate);
    if (overdueDays > 0) {
      return (
        <Badge variant="danger" size="sm">
          {overdueDays}d atraso
        </Badge>
      );
    }
    const prom = promiseMap.get(inv.id);
    if (prom && prom.status === 'pending') {
      return (
        <Badge variant="info" size="sm">
          Com promessa
        </Badge>
      );
    }
    if (inv.paidAmount > 0) {
      return (
        <Badge variant="warning" size="sm">
          Parcial
        </Badge>
      );
    }
    return (
      <Badge variant="warning" size="sm">
        Em aberto
      </Badge>
    );
  };

  const getLogIcon = (entityType: string) => {
    switch (entityType) {
      case 'payment':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'invoice':
        return <Receipt className="w-3.5 h-3.5 text-indigo-600" />;
      case 'message':
        return <MessageSquare className="w-3.5 h-3.5 text-violet-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div>
              <CardTitle>Cobranças e Atividades Recentes</CardTitle>
              <CardDescription className="mt-0.5">
                Últimas movimentações de faturas e pagamentos registados
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'invoices'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cobranças
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Timeline
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={onViewAllInvoices}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Ver todas
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'invoices' ? (
          recentInvoices.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => {
                const cust = customerMap.get(inv.customerId);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onViewInvoice(inv.id)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {cust?.type === 'company' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {cust?.name || 'Cliente'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {inv.invoiceNumber} • Emitida a {formatDate(inv.issueDate)} • Vence a{' '}
                          {formatDate(inv.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(inv.amount)}
                      </div>
                      <div className="mt-1">{getInvoiceStatusBadge(inv)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Ainda não tem cobranças registadas.</p>
            </div>
          )
        ) : recentLogs.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {recentLogs.map((log) => (
              <div key={log.id} className="relative group text-xs">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-2xs">
                  {getLogIcon(log.entityType)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{log.action}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{formatDateTime(log.createdAt)}</span>
                    {log.details?.invoiceNumber && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-slate-700">
                          {String(log.details.invoiceNumber)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            <Activity className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p>Nenhuma atividade recente registada no sistema.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
