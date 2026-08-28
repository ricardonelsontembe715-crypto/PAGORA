import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { PLANS } from '../../config/plans';
import { formatCurrency } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Check, ArrowRight } from 'lucide-react';

export const LandingPricing: React.FC = () => {
  const { navigate } = useNavigation();
  const { isAuthenticated, account } = useAuth();

  const handleChoosePlan = (plan: 'free' | 'plus' | 'pro') => {
    if (isAuthenticated) {
      if (account?.plan === plan) {
        navigate('dashboard_plans');
      } else {
        navigate('dashboard_plans', { targetUpgradePlan: plan });
      }
    } else {
      navigate('auth_register', { targetPlan: plan });
    }
  };

  return (
    <section id="precos" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            Planos e Preços
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Transparente, simples e sem surpresas
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Comece gratuitamente e evolua à medida que o seu volume de cobranças aumenta. Os planos
            são cumulativos: o plano PRO inclui tudo do PLUS e do FREE.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {/* Plano FREE */}
          <div className="rounded-2xl border border-slate-200/90 bg-[#F8FAFC]/50 p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wider text-slate-900 uppercase">
                  {PLANS.free.name}
                </span>
                <Badge variant="neutral" size="sm">
                  Começar Grátis
                </Badge>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatCurrency(PLANS.free.priceMonthly)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/mês</span>
              </div>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {PLANS.free.description}
              </p>

              <div className="pt-4 border-t border-slate-200 space-y-3 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Inclui:
                </span>
                {PLANS.free.features.map((feat) => (
                  <div key={feat.key} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => handleChoosePlan('free')}
            >
              {isAuthenticated && account?.plan === 'free' ? 'Plano Atual' : 'Criar Conta Gratuita'}
            </Button>
          </div>

          {/* Plano PLUS */}
          <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-6 flex flex-col justify-between shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-[11px] font-bold uppercase px-3 py-0.5 rounded-full shadow-xs">
                Mais Escolhido
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wider text-indigo-700 uppercase">
                  {PLANS.plus.name}
                </span>
                <Badge variant="primary" size="sm">
                  Crescimento
                </Badge>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatCurrency(PLANS.plus.priceMonthly)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/mês</span>
              </div>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {PLANS.plus.description}
              </p>

              <div className="pt-4 border-t border-slate-100 space-y-3 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                  Tudo do plano FREE, mais:
                </span>
                {PLANS.plus.features.map((feat) => (
                  <div key={feat.key} className="flex items-start gap-2.5 text-xs text-slate-800">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 font-bold" />
                    <span>{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="md"
              onClick={() => handleChoosePlan('plus')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isAuthenticated && account?.plan === 'plus' ? 'Plano Atual' : 'Escolher Plano PLUS'}
            </Button>
          </div>

          {/* Plano PRO */}
          <div className="rounded-2xl border border-slate-200/90 bg-[#F8FAFC]/50 p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wider text-slate-900 uppercase">
                  {PLANS.pro.name}
                </span>
                <Badge variant="success" size="sm">
                  Completo
                </Badge>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatCurrency(PLANS.pro.priceMonthly)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/mês</span>
              </div>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {PLANS.pro.description}
              </p>

              <div className="pt-4 border-t border-slate-200 space-y-3 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
                  Tudo do plano PLUS, mais:
                </span>
                {PLANS.pro.features.map((feat) => (
                  <div key={feat.key} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => handleChoosePlan('pro')}
            >
              {isAuthenticated && account?.plan === 'pro' ? 'Plano Atual' : 'Escolher Plano PRO'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
