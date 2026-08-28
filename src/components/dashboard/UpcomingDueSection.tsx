import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UpcomingDueItem } from '../../lib/dashboardAnalytics';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  Calendar,
  Clock,
  MessageSquare,
  Eye,
  Building2,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface UpcomingDueSectionProps {
  items: UpcomingDueItem[];
  onViewInvoice: (invoiceId: string) => void;
  onPrepareReminder: (customerId: string, invoiceId: string) => void;
  onViewAllInvoices: () => void;
}

export const UpcomingDueSection: React.FC<UpcomingDueSectionProps> = ({
  items,
  onViewInvoice,
  onPrepareReminder,
  onViewAllInvoices,
}) => {
  const getTimeframeBadge = (item: UpcomingDueItem) => {
    if (item.timeframe === 'today') {
      return (
        <Badge variant="danger" size="sm" className="font-bold">
          Vence Hoje
        </Badge>
      );
    }
    if (item.timeframe === 'tomorrow') {
      return (
        <Badge variant="warning" size="sm" className="font-semibold">
          Vence Amanhã
        </Badge>
      );
    }
    if (item.daysRemaining <= 3) {
      return (
        <Badge variant="info" size="sm">
          Em {item.daysRemaining} dias
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        Em {item.daysRemaining} dias
      </Badge>
    );
  };

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Próximos Vencimentos</CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              Cobranças que atingem o termo nos próximos 14 dias
            </CardDescription>
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
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.invoice.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 sm:mt-0">
                    {item.customer?.type === 'company' ? (
                      <Building2 className="w-4 h-4 text-slate-500" />
                    ) : (
                      <User className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.customer?.name || 'Cliente'}
                      </span>
                      {getTimeframeBadge(item)}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-600">{item.invoice.invoiceNumber}</span>
                      <span>•</span>
                      <span>Vencimento: {formatDate(item.invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(item.remainingAmount)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">saldo a receber</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPrepareReminder(item.invoice.customerId, item.invoice.id)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                      className="text-xs h-7 px-2.5 bg-white"
                      title="Preparar lembrete prévio"
                    >
                      Lembrete
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewInvoice(item.invoice.id)}
                      className="text-xs h-7 px-2 text-slate-600 hover:text-slate-900"
                      title="Ver cobrança"
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
            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p>Sem cobranças a vencer nos próximos 14 dias.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
