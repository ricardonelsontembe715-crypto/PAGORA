import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  Users,
  Receipt,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DashboardEmptyStateProps {
  hasCustomers: boolean;
  hasInvoices: boolean;
  onNewCustomer: () => void;
  onNewInvoice: () => void;
  onGenerateMessage: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  hasCustomers,
  hasInvoices,
  onNewCustomer,
  onNewInvoice,
  onGenerateMessage,
}) => {
  const steps = [
    {
      number: '1',
      title: 'Adicionar o primeiro cliente',
      description: 'Cadastre os dados da empresa ou particular (NIF, e-mail, telefone).',
      completed: hasCustomers,
      actionLabel: 'Adicionar Cliente',
      icon: <Users className="w-4 h-4 text-indigo-600" />,
      onClick: onNewCustomer,
    },
    {
      number: '2',
      title: 'Registar a primeira cobrança',
      description: 'Indique o valor, data de vencimento e referência da fatura a acompanhar.',
      completed: hasInvoices,
      actionLabel: 'Registar Cobrança',
      icon: <Receipt className="w-4 h-4 text-emerald-600" />,
      onClick: onNewInvoice,
    },
    {
      number: '3',
      title: 'Preparar mensagem profissional',
      description: 'Gere lembretes cordiais ou avisos de atraso com canais WhatsApp, E-mail ou SMS.',
      completed: false,
      actionLabel: 'Experimentar Gerador',
      icon: <MessageSquare className="w-4 h-4 text-violet-600" />,
      onClick: onGenerateMessage,
    },
  ];

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg text-slate-900">
              Bem-vindo ao Centro de Comando da PAGORA
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Siga os passos essenciais para colocar a sua gestão de cobranças a trabalhar por si
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`p-4 rounded-xl border transition-all ${
                step.completed
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.completed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {step.completed ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Passo {step.number}</span>
                </div>

                {step.completed && (
                  <Badge variant="success" size="sm">
                    Concluído
                  </Badge>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-900 mb-1">{step.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4 min-h-[32px]">
                {step.description}
              </p>

              <Button
                size="sm"
                variant={step.completed ? 'outline' : 'primary'}
                onClick={step.onClick}
                rightIcon={<ArrowRight className="w-3 h-3" />}
                className="w-full h-8 text-xs font-medium"
              >
                {step.completed ? 'Adicionar Outro' : step.actionLabel}
              </Button>
            </div>
          ))}
        </div>

        {/* Destaque de Benefícios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/70 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Reduza a inadimplência com lembretes no timing certo</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Poupe tempo com mensagens geradas automaticamente</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Mantenha total controlo sobre promessas e acordos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
