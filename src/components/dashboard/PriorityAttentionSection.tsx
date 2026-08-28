import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PriorityItem, PriorityLevel } from '../../lib/dashboardAnalytics';
import { formatCurrency } from '../../lib/formatters';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  MessageSquare,
  Eye,
  User,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface PriorityAttentionSectionProps {
  items: PriorityItem[];
  onViewInvoice: (invoiceId: string) => void;
  onViewCustomer: (customerId: string) => void;
  onGenerateMessage: (customerId: string, invoiceId?: string) => void;
}

export const PriorityAttentionSection: React.FC<PriorityAttentionSectionProps> = ({
  items,
  onViewInvoice,
  onViewCustomer,
  onGenerateMessage,
}) => {
  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <Badge variant="danger" size="sm" className="font-bold tracking-wide">
            Crítica
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="warning" size="sm" className="font-bold">
            Alta
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="info" size="sm" className="font-medium">
            Média
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="default" size="sm" className="font-medium">
            Baixa
          </Badge>
        );
    }
  };

  const getPriorityBorder = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-red-200/90 bg-red-50/20 hover:border-red-300';
      case 'HIGH':
        return 'border-amber-200/90 bg-amber-50/20 hover:border-amber-300';
      case 'MEDIUM':
        return 'border-blue-200/80 bg-blue-50/15 hover:border-blue-300';
      case 'LOW':
        return 'border-slate-200 bg-white hover:border-slate-300';
    }
  };

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Precisa da sua atenção</CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              Situações que requerem contacto, acompanhamento ou regularização prioritária
            </CardDescription>
          </div>

          {items.length > 0 && (
            <Badge variant="warning" size="sm">
              {items.length} pendente{items.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 ${getPriorityBorder(
                  item.priority
                )}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Informação principal */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      <button
                        type="button"
                        onClick={() => onViewCustomer(item.customerId)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate text-left"
                      >
                        {item.customerType === 'company' ? (
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{item.customerName}</span>
                      </button>

                      {item.invoiceNumber && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.invoiceNumber}
                        </span>
                      )}

                      <span className="text-xs font-extrabold text-slate-900 ml-auto sm:ml-0">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.title}: {item.description}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600">Motivo:</span>
                      <span>{item.reason}</span>
                    </div>
                  </div>

                  {/* Ações Rápidas de Resolução */}
                  <div className="flex items-center gap-1.5 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerateMessage(item.customerId, item.invoiceId)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5 text-indigo-600" />}
                      className="text-xs h-7.5 px-2.5 bg-white font-medium hover:border-indigo-300"
                    >
                      Gerar mensagem
                    </Button>

                    {item.invoiceId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewInvoice(item.invoiceId!)}
                        className="text-xs h-7.5 px-2 text-slate-600 hover:text-slate-900"
                        title="Ver cobrança"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-xl bg-emerald-50/40 border border-emerald-100/80">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">Cobrança sob controlo</h4>
            <p className="text-xs text-emerald-700/90 mt-1 max-w-md mx-auto leading-relaxed">
              Não existem cobranças críticas, promessas quebradas ou atrasos graves a requerer intervenção imediata neste momento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
