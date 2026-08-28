import React from 'react';
import {
  ShieldCheck,
  MessageSquare,
  Layers,
  TrendingUp,
  Lock,
  Zap,
} from 'lucide-react';

export const LandingValueProps: React.FC = () => {
  const values = [
    {
      icon: <MessageSquare className="w-5 h-5 text-indigo-600" />,
      title: 'Comunicação Profissional e Respeitosa',
      description:
        'Elimine o desconforto de cobrar. Crie mensagens com o tom certo — cordial, formal ou firme — preservando sempre a relação de confiança com o cliente.',
    },
    {
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      title: 'Organização Centralizada de Cobranças',
      description:
        'Tenha uma visão clara de todas as faturas emitidas, valores recebidos, quantias pendentes e prazos de vencimento num único sítio estruturado.',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
      title: 'Gestão de Promessas de Pagamento',
      description:
        'Registe acordos e datas prometidas pelos clientes. Acompanhe se o compromisso foi cumprido sem precisar de folhas de cálculo dispersas.',
    },
    {
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      title: 'Isolamento Absoluto de Dados',
      description:
        'Cada conta possui uma estrutura própria e isolada. Os seus clientes e valores são estritamente confidenciais e protegidos por autenticação segura.',
    },
    {
      icon: <Zap className="w-5 h-5 text-indigo-600" />,
      title: 'Automação e Consistência de Processos',
      description:
        'Envie lembretes no momento exato e reduza significativamente a média de dias em atraso sem gastar horas em contactos repetitivos.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
      title: 'Adequado à Realidade Portuguesa (PT)',
      description:
        'Interface integralmente em português de Portugal, pensada para as práticas comerciais, meios de pagamento e hábitos do mercado nacional.',
    },
  ];

  return (
    <section id="como-funciona" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            Porquê escolher a Pagora
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Mais confiança. Menos tempo perdido a cobrar.
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Uma abordagem moderna, humana e focada na eficácia para que a sua empresa receba o que
            lhe é devido no prazo acordado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((v, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                {v.icon}
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">{v.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
