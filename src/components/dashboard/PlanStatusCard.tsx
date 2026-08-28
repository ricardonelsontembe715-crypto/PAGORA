import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Account } from '../../types/database';
import { PLANS } from '../../config/plans';
import { CreditCard, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PlanStatusCardProps {
  account: Account | null;
  activeCustomersCount: number;
  monthlyInvoicesCount: number;
  monthlyMessagesCount: number;
  onNavigateToPlans: () => void;
}

export const PlanStatusCard: React.FC<PlanStatusCardProps> = ({
  account,
  activeCustomersCount,
  monthlyInvoicesCount,
  monthlyMessagesCount,
  onNavigateToPlans,
}) => {
  const planKey = account?.plan || 'free';
  const planConfig = PLANS[planKey] || PLANS.free;

  const maxCustomers = planConfig.limits.maxCustomers;
  const maxInvoicesMonthly = planConfig.limits.maxInvoicesPerMonth;
  const maxMessagesMonthly = planConfig.limits.maxMessageGenerationsPerMonth;

  const isUnlimitedCustomers = maxCustomers === 'unlimited';
  const isUnlimitedInvoices = maxInvoicesMonthly === 'unlimited';
  const isUnlimitedMessages = maxMessagesMonthly === 'unlimited';

  const customerPercent = isUnlimitedCustomers
    ? 0
    : Math.min(100, Math.round((activeCustomersCount / (maxCustomers as number)) * 100));

  const invoicePercent = isUnlimitedInvoices
    ? 0
    : Math.min(100, Math.round((monthlyInvoicesCount / (maxInvoicesMonthly as number)) * 100));

  const messagePercent = isUnlimitedMessages
    ? 0
    : Math.min(100, Math.round((monthlyMessagesCount / (maxMessagesMonthly as number)) * 100));

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Plano e Utilização</CardTitle>
            </div>
            <CardDescription className="mt-0.5">
              Acompanhamento de recursos e limites da conta
            </CardDescription>
          </div>

          <Badge variant={planKey === 'pro' ? 'success' : 'primary'} size="sm">
            {planConfig?.name.toUpperCase() || 'FREE'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barras de progresso das cotas */}
        <div className="space-y-3 text-xs">
          {/* Clientes */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-slate-600">Clientes Ativos</span>
              <span className="text-slate-900 font-bold">
                {activeCustomersCount} / {isUnlimitedCustomers ? 'Ilimitado' : maxCustomers}
              </span>
            </div>
            {!isUnlimitedCustomers && (
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    customerPercent > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${customerPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Cobranças Mês */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-slate-600">Cobranças no Mês</span>
              <span className="text-slate-900 font-bold">
                {monthlyInvoicesCount} / {isUnlimitedInvoices ? 'Ilimitado' : maxInvoicesMonthly}
              </span>
            </div>
            {!isUnlimitedInvoices && (
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    invoicePercent > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${invoicePercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Mensagens Mês */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-slate-600">Mensagens Geradas</span>
              <span className="text-slate-900 font-bold">
                {monthlyMessagesCount} / {isUnlimitedMessages ? 'Ilimitado' : maxMessagesMonthly}
              </span>
            </div>
            {!isUnlimitedMessages && (
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    messagePercent > 85 ? 'bg-amber-500' : 'bg-violet-600'
                  }`}
                  style={{ width: `${messagePercent}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Banner de Upgrade para Free ou Plus */}
        {planKey !== 'pro' && (
          <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Desbloqueie todo o potencial</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Obtenha automações com IA, modelos ilimitados e relatórios de cobrança detalhados.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onNavigateToPlans}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="w-full h-7 text-xs bg-white text-indigo-700 font-semibold border-indigo-200 hover:bg-indigo-50"
            >
              Ver Planos & Upgrade
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
