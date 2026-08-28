import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PaymentPromise, Customer, Invoice } from '../../types/database';
import { formatCurrency, formatDate, getDaysOverdue } from '../../lib/formatters';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Eye,
  Calendar,
  Building2,
  User,
} from 'lucide-react';

interface PaymentPromisesWidgetProps {
  promises: PaymentPromise[];
  customers: Customer[];
  invoices: Invoice[];
  onViewInvoice: (invoiceId: string) => void;
  onGenerateMessage: (customerId: string, invoiceId: string) => void;
}

export const PaymentPromisesWidget: React.FC<PaymentPromisesWidgetProps> = ({
  promises,
  customers,
  invoices,
  onViewInvoice,
  onGenerateMessage,
}) => {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const invoiceMap = new Map<string, Invoice>();
  invoices.forEach((inv) => invoiceMap.set(inv.id, inv));

  // Estatísticas
  let activeCount = 0;
  let brokenCount = 0;
  let keptCount = 0;

  promises.forEach((p) => {
    if (p.status === 'kept') {
      keptCount++;
    } else if (p.status === 'broken' || (p.status === 'pending' && getDaysOverdue(p.promisedDate) > 0)) {
      brokenCount++;
    } else {
      activeCount++;
    }
  });

  const activePromises = promises
    .filter((p) => p.status === 'pending')
    .sort((a, b) => new Date(a.promisedDate).getTime() - new Date(b.promisedDate).getTime())
    .slice(0, 4);

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Promessas de Pagamento</CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              Gestão de compromissos acordados com clientes
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de Totais */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-center">
            <div className="text-sm font-bold text-blue-900">{activeCount}</div>
            <div className="text-[10px] font-medium text-blue-700">Ativas</div>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-100 text-center">
            <div className="text-sm font-bold text-red-900">{brokenCount}</div>
            <div className="text-[10px] font-medium text-red-700">Vencidas</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-center">
            <div className="text-sm font-bold text-emerald-900">{keptCount}</div>
            <div className="text-[10px] font-medium text-emerald-700">Cumpridas</div>
          </div>
        </div>

        {/* Lista de Promessas Ativas */}
        {activePromises.length > 0 ? (
          <div className="space-y-2">
            {activePromises.map((promise) => {
              const cust = customerMap.get(promise.customerId);
              const inv = invoiceMap.get(promise.invoiceId);
              const overdueDays = getDaysOverdue(promise.promisedDate);
              const isOverdue = overdueDays > 0;

              return (
                <div
                  key={promise.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors ${
                    isOverdue
                      ? 'bg-red-50/40 border-red-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-900 truncate">
                        {cust?.name || 'Cliente'}
                      </span>
                      {isOverdue ? (
                        <Badge variant="danger" size="sm">
                          Venceu há {overdueDays}d
                        </Badge>
                      ) : (
                        <Badge variant="info" size="sm">
                          Prometeu a {formatDate(promise.promisedDate)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Fatura: <span className="font-medium text-slate-700">{inv?.invoiceNumber || '—'}</span> • {formatCurrency(promise.amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onGenerateMessage(promise.customerId, promise.invoiceId)}
                      className="h-7 px-2 text-indigo-600 hover:bg-indigo-50"
                      title="Gerar lembrete de promessa"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewInvoice(promise.invoiceId)}
                      className="h-7 px-2 text-slate-600"
                      title="Ver cobrança"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-500">
            <Calendar className="w-5 h-5 text-slate-300 mx-auto mb-1" />
            <p>Nenhuma promessa pendente no momento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
