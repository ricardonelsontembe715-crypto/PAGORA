import React from 'react';
import {
  Briefcase,
  Store,
  Compass,
  Hammer,
  UserCheck,
  Building,
  GraduationCap,
  HeartHandshake,
} from 'lucide-react';

export const LandingAudience: React.FC = () => {
  const audiences = [
    {
      icon: <Store className="w-5 h-5 text-indigo-600" />,
      title: 'Pequenos Negócios',
      description: 'Lojas, oficinas e comércios locais que faturam a clientes habituais a prazo.',
    },
    {
      icon: <Briefcase className="w-5 h-5 text-indigo-600" />,
      title: 'Prestadores de Serviços',
      description: 'Empresas de manutenção, limpezas, TI, eventos e suporte técnico especializado.',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-indigo-600" />,
      title: 'Profissionais Independentes',
      description: 'Designers, programadores, fotógrafos, redactores e tradutores que cobram por projeto.',
    },
    {
      icon: <Compass className="w-5 h-5 text-indigo-600" />,
      title: 'Agências e Consultores',
      description: 'Equipas de marketing, publicidade, consultoria de gestão e estratégia de negócios.',
    },
    {
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      title: 'Profissionais Liberais',
      description: 'Advogados, contabilistas, arquitetos, engenheiros, psicólogos e terapeutas.',
    },
    {
      icon: <Hammer className="w-5 h-5 text-indigo-600" />,
      title: 'Serviços Domésticos e Obras',
      description: 'Eletricistas, canalizadores, técnicos de climatização e empreiteiros de renovações.',
    },
    {
      icon: <Building className="w-5 h-5 text-indigo-600" />,
      title: 'Pequenas Empresas (PME)',
      description: 'Empresas com faturação recorrente que necessitam de rigor e previsão de tesouraria.',
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-indigo-600" />,
      title: 'Qualquer Pessoa que Cobre Regularmente',
      description: 'Quem precisa de acompanhar recebimentos sem constrangimentos e com total controlo.',
    },
  ];

  return (
    <section id="para-quem" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            A quem se destina a Pagora
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Criada para quem trabalha e merece receber a tempo
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            A Pagora não é apenas para freelancers. É para qualquer pessoa ou pequeno negócio que preste
            serviços e precise de organizar cobranças e lidar com pagamentos em atraso com profissionalismo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {audiences.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-200/90 bg-[#F8FAFC]/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs flex flex-col"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3.5">
                {item.icon}
              </div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1.5">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
