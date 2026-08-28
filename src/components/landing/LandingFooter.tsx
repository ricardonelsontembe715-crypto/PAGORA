import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { Shield, Lock, FileText, CheckCircle } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Marca e Slogan */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                P
              </div>
              <span className="font-bold text-base tracking-tight text-white">PAGORA</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              «Cobre com confiança. Receba sem perseguir.»
            </p>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Plataforma SaaS concebida para ajudar pessoas e pequenos negócios a organizar cobranças,
              acompanhar pagamentos e criar comunicações profissionais.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Encriptação Segura
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Isolamento Multi-Tenant
              </span>
            </div>
          </div>

          {/* Navegação Rápida */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Navegação
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('landing')}
                  className="hover:text-white transition-colors"
                >
                  Início
                </button>
              </li>
              <li>
                <a href="#para-quem" className="hover:text-white transition-colors">
                  Para quem é
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-white transition-colors">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#precos" className="hover:text-white transition-colors">
                  Planos e Preços
                </a>
              </li>
            </ul>
          </div>

          {/* Aplicação e Acesso */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Acesso
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('auth_login')}
                  className="hover:text-white transition-colors"
                >
                  Iniciar sessão
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('auth_register')}
                  className="hover:text-white transition-colors"
                >
                  Criar conta grátis
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('auth_recovery')}
                  className="hover:text-white transition-colors"
                >
                  Recuperar palavra-passe
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha de Direitos e Idioma */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} PAGORA. Todos os direitos reservados. Interface em Português de Portugal.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Arquitetura de Segurança Ativa
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
