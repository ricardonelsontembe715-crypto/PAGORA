import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigation } from '../../context/NavigationContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Layers,
  MessageSquare,
  TrendingUp,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const LandingProductDemo: React.FC = () => {
  const { navigate } = useNavigation();
  const [activeFeature, setActiveFeature] = useState<'clients' | 'invoices' | 'messages' | 'promises'>('clients');

  return (
    <section id="como-funciona" className="relative py-20 md:py-28 bg-white border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Arquitetura Desenhada para Resultados Reais</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Como a PAGORA transforma o seu fluxo de recebimentos
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Uma suite completa para quem precisa de gerir faturas, evitar atrasos crónicos e manter uma relação
            impecável com cada cliente.
          </p>
        </div>

        {/* Barra de Navegação de Funcionalidades */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveFeature('clients')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFeature === 'clients'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>1. Gestão de Clientes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFeature('invoices')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFeature === 'invoices'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>2. Centro de Cobranças</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFeature('messages')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFeature === 'messages'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>3. Motor de Mensagens</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFeature('promises')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFeature === 'promises'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>4. Gestão de Promessas</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Dinâmico da Funcionalidade Selecionada */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-5 sm:p-8">
          <AnimatePresence mode="wait">
            {activeFeature === 'clients' && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    <span>Perfil e Histórico de Pagamentos</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Conheça exatamente o comportamento de cada cliente
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Armazene NIF, contactos diretos de faturação, histórico completo de faturas pagas e
                    em atraso, e notas confidenciais sobre acordos prévios num só CRM financeiro.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Classificação visual de risco de atraso</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Atalhos diretos para WhatsApp e E-mail de faturação</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Histórico auditável de cobranças e recibos</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs text-left space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Engenharia & Soluções Ramos, Lda
                        </div>
                        <div className="text-xs text-slate-500">NIF 509 881 223 • Lisboa</div>
                      </div>
                    </div>
                    <Badge variant="warning" size="md">
                      1 Fatura em Atraso
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">Total Faturado</span>
                      <span className="font-bold text-slate-900 text-sm">14.600,00 €</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">Total Regularizado</span>
                      <span className="font-bold text-emerald-700 text-sm">12.150,00 €</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block text-[11px]">Saldo Pendente</span>
                      <span className="font-bold text-amber-700 text-sm">2.450,00 €</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeFeature === 'invoices' && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>Prioridades Inteligentes</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Foco no que realmente precisa de intervenção
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    O Centro de Cobranças agrupa automaticamente as suas faturas em quatro categorias de ação:
                    Atrasos Críticos (+15 dias), Vencidas Recentes, Vencimento Hoje e Preventivas.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Filtro imediato por urgência financeira</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Registo de pagamentos parciais e totais</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs text-left space-y-2.5">
                  <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-950">Atraso Crítico (+15 dias)</div>
                      <div className="text-[11px] text-rose-700">Studio Design Alpha • FT 2026/064</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-900">1.850,00 €</div>
                      <Badge variant="danger" size="sm">
                        Atraso Crítico
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-950">Vencida Há 4 Dias</div>
                      <div className="text-[11px] text-amber-700">Consultores Norte TI • FT 2026/071</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-900">920,00 €</div>
                      <Badge variant="warning" size="sm">
                        Pendente
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-950">Lembrete Preventivo (3 dias)</div>
                      <div className="text-[11px] text-indigo-700">Clínica São Gabriel • FT 2026/082</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-900">3.100,00 €</div>
                      <Badge variant="info" size="sm">
                        Preventiva
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeFeature === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4" />
                    <span>Inteligência Artificial & Tom Perfeito</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Mensagens que preservam a relação e aceleram o pagamento
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Gere comunicações impecáveis em Português de Portugal com dados dinâmicos de pagamento
                    (IBAN, MB WAY, Entidade/Referência Multibanco) em segundos.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>3 tons ajustáveis: Cordial, Formal e Firme</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Formatos para WhatsApp, E-mail, SMS e Guião de Chamada</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs text-left space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Comunicação Personalizada (WhatsApp)
                    </span>
                    <Badge variant="primary" size="sm">
                      Tom Cordial
                    </Badge>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                    «Olá, Eng. Miguel. Esperamos que se encontre bem. Gostaríamos apenas de relembrar o termo de liquidação
                    da fatura FT 2026/092 (1.450,00 €). Para sua comodidade, pode regularizar através do MB WAY 912 345 678
                    ou por transferência para o IBAN PT50 0033 0000 1234 5678 9012 3. Muito obrigado!»
                  </div>
                </div>
              </motion.div>
            )}

            {activeFeature === 'promises' && (
              <motion.div
                key="promises"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4" />
                    <span>Controlo de Compromissos</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Nunca mais se esqueça de um acordo de liquidação
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Quando um cliente promete pagar numa data específica, registe na PAGORA. O sistema notifica-o
                    no dia exato para verificar se o valor deu entrada na sua conta bancária.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Acompanhamento visual de promessas cumpridas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Alerta de quebra de compromisso para re-agendamento</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs text-left space-y-3">
                  <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Promessa Ativa para 30 Ago</div>
                        <div className="text-[11px] text-slate-500">
                          Atelier Silva & Ramos • 2.450,00 €
                        </div>
                      </div>
                    </div>
                    <Badge variant="info" size="sm">
                      Agendado
                    </Badge>
                  </div>

                  <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Promessa Cumprida a 25 Ago</div>
                        <div className="text-[11px] text-slate-500">
                          Consultoria Digital M. Costa • 1.280,00 €
                        </div>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">
                      Liquidado
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA Intermédio da Demonstração */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('auth_register')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="text-sm px-8 py-3"
          >
            Começar a Usar Gratuitamente
          </Button>
        </div>
      </div>
    </section>
  );
};
