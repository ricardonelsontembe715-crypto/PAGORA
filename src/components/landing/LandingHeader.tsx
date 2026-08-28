import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from '../ui/Button';

export const LandingHeader: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Marca PAGORA */}
        <div
          onClick={() => navigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 leading-none">
              PAGORA
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide leading-none mt-1">
              Gestão de Cobranças
            </span>
          </div>
        </div>

        {/* Links de navegação interna da landing */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#para-quem" className="hover:text-indigo-600 transition-colors">
            Para quem é
          </a>
          <a href="#como-funciona" className="hover:text-indigo-600 transition-colors">
            Como funciona
          </a>
          <a href="#precos" className="hover:text-indigo-600 transition-colors">
            Planos e Preços
          </a>
          <a href="#seguranca" className="hover:text-indigo-600 transition-colors">
            Segurança
          </a>
        </nav>

        {/* Ações de autenticação */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('auth_login')}
          >
            Iniciar sessão
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('auth_register')}
          >
            Começar gratuitamente
          </Button>
        </div>
      </div>
    </header>
  );
};
