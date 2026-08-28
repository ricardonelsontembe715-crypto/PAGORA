import React, { useState } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  MessageCircle,
  TrendingUp,
  Building2,
  CreditCard,
  Zap,
  Copy,
  Check,
  Smartphone,
  Mail,
  Receipt,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  const { navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'collection'>('overview');
  const [selectedTone, setSelectedTone] = useState<'cordial' | 'formal' | 'firme'>('cordial');
  const [copied, setCopied] = useState(false);

  const handleCopyDemo = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50">
      {/* Elementos visuais de fundo subtis para criar profundidade sofisticada */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-100/50 via-slate-100/40 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-indigo-50/60 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-96 h-96 bg-slate-100/80 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bloco Superior: Headline & CTAs de Alto Impacto */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {/* Badge de Contexto PT */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-indigo-800 text-xs font-semibold mb-6 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Gestão Inteligente de Cobranças em Portugal</span>
          </motion.div>

          {/* Título Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6"
          >
            Cobre com confiança. <br className="hidden sm:inline" />
            <span className="text-[#4F46E5]">Receba sem perseguir.</span>
          </motion.h1>

          {/* Subtítulo Descritivo de Alto Valor */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mb-8 text-balance"
          >
            A plataforma profissional concebida para quem presta serviços em Portugal organizar cobranças,
            acompanhar promessas e gerar mensagens no tom perfeito para receber no prazo sem atritos.
          </motion.p>

          {/* Ações de Conversão */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-8"
          >
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('auth_register')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-sm px-7 py-3 font-semibold shadow-sm hover:shadow-md transition-all"
            >
              Criar Conta Gratuita
            </Button>
            <a href="#como-funciona" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-sm px-6 py-3 font-medium bg-white/90 text-slate-700 hover:bg-slate-50 border-slate-300"
              >
                Ver Como Funciona
              </Button>
            </a>
          </motion.div>

          {/* Garantias Claras */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-600 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Plano gratuito vitalício</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Isolamento total de dados</span>
            </div>
          </motion.div>
        </div>

        {/* DEMONSTRAÇÃO VISUAL INTEGRADA: DASHBOARD PRO EM FUNDO / CAMADA VIVA */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Caixa da Janela de Aplicação */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
            {/* Barra de Controlo do Sistema / Workspace Pro */}
            <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    PAGORA Workspace PRO
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                    • app.pagora.pt / painel
                  </span>
                </div>
              </div>

              {/* Seletor de visualização do dashboard na demonstração */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/80 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === 'overview'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === 'messages'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Assistente IA
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('collection')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === 'collection'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Cobranças
                </button>
              </div>
            </div>

            {/* Conteúdo do Dashboard Demonstrativo */}
            <div className="p-4 sm:p-6 bg-slate-50/60">
              {/* Barra de KPIs do Dashboard PRO */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-1 text-slate-500 text-xs">
                    <span>Total em Cobrança</span>
                    <Receipt className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900">
                    28.450,00 €
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    14 faturas registadas
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-1 text-slate-500 text-xs">
                    <span>Recuperado este mês</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-extrabold text-emerald-700">
                    19.820,00 €
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <span>↑ +18.4% vs mês ant.</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-1 text-slate-500 text-xs">
                    <span>Em Atraso</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-extrabold text-amber-700">
                    3.450,00 €
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium mt-1">
                    3 clientes prioritários
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-1 text-slate-500 text-xs">
                    <span>Taxa de Sucesso</span>
                    <Zap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-extrabold text-indigo-700">
                    94.2%
                  </div>
                  <div className="text-[11px] text-indigo-800 font-medium mt-1">
                    Eficiência de liquidação
                  </div>
                </div>
              </div>

              {/* Aba 1: Visão Geral e Cobranças Operacionais */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
                  {/* Painel Esquerdo: Faturas Prioritárias */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        Centro de Cobrança Operacional
                      </h4>
                      <Badge variant="primary" size="sm">
                        3 ações recomendadas
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      {/* Item 1: Em atraso com promessa */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              <Building2 className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                Atelier Silva & Ramos, Lda
                              </div>
                              <div className="text-[11px] text-slate-500">
                                FT 2026/104 • Vencida há 5 dias
                              </div>
                              <div className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold mt-1 bg-amber-50 px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3" /> Promessa para 30 Ago
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-slate-900">
                              2.450,00 €
                            </div>
                            <Badge variant="warning" size="sm" className="mt-1">
                              Em atraso
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Item 2: Vence hoje */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              <Building2 className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                Consultoria Digital M. Costa
                              </div>
                              <div className="text-[11px] text-slate-500">
                                FT 2026/112 • Vencimento Hoje
                              </div>
                              <div className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-semibold mt-1 bg-indigo-50 px-2 py-0.5 rounded">
                                <MessageCircle className="w-3 h-3" /> Lembrete preventivo pronto
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-slate-900">
                              1.280,00 €
                            </div>
                            <Badge variant="info" size="sm" className="mt-1">
                              Vence Hoje
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Item 3: Regularizado */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                Clínica Dentária Bem Estar
                              </div>
                              <div className="text-[11px] text-slate-500">
                                FT 2026/118 • Liquidado via MB WAY
                              </div>
                              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-1 bg-emerald-50 px-2 py-0.5 rounded">
                                <CreditCard className="w-3 h-3" /> Recibo emitido
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-emerald-700">
                              890,00 €
                            </div>
                            <Badge variant="success" size="sm" className="mt-1">
                              Pago
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Painel Direito: Mensagem de Cobrança Cordial Gerada */}
                  <div className="lg:col-span-5 bg-indigo-900/5 border border-indigo-100 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Mensagem Gerada (WhatsApp)
                        </span>
                        <Badge variant="primary" size="sm">
                          Tom Cordial
                        </Badge>
                      </div>

                      <div className="bg-white p-3.5 rounded-lg border border-indigo-100 text-xs text-slate-700 leading-relaxed font-sans shadow-2xs space-y-2">
                        <p className="font-semibold text-slate-900">
                          «Olá, Dr. Silva. Esperamos que esteja tudo bem.
                        </p>
                        <p>
                          Gostaríamos de confirmar se já teve oportunidade de validar a fatura{' '}
                          <strong>FT 2026/104</strong> (valor de <strong>2.450,00 €</strong>), cujo
                          vencimento ocorreu no passado dia 23.
                        </p>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 font-mono">
                          IBAN: PT50 0033 0000 1234 5678 9012 3<br />
                          MB WAY: 912 345 678
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Ficamos ao dispor para qualquer esclarecimento.»
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={handleCopyDemo}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{copied ? 'Copiada!' : 'Copiar'}</span>
                      </button>

                      <div className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Abrir no WhatsApp</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba 2: Assistente de Comunicação Interativo */}
              {activeTab === 'messages' && (
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 text-left space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Gerador de Mensagens Profissionais
                      </h4>
                      <p className="text-xs text-slate-500">
                        Adapte a comunicação ao perfil do cliente e ao estágio da cobrança.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTone('cordial')}
                        className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                          selectedTone === 'cordial'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Cordial
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTone('formal')}
                        className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                          selectedTone === 'formal'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Formal
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTone('firme')}
                        className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                          selectedTone === 'firme'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Firme
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                    {selectedTone === 'cordial' && (
                      <p>
                        «Estimada equipa da Consultoria Digital, esperamos que este contacto o encontre bem.
                        Relembramos cordialmente que a fatura FT 2026/112 no montante de 1.280,00 € vence no dia de hoje.
                        Agradecemos desde já a atenção dispensada.»
                      </p>
                    )}
                    {selectedTone === 'formal' && (
                      <p>
                        «Exmos. Senhores, acusamos o envio da referência da fatura FT 2026/112, no valor de 1.280,00 €,
                        com termo do prazo de liquidação na presente data. Solicitamos a confirmação da respetiva transferência bancária.»
                      </p>
                    )}
                    {selectedTone === 'firme' && (
                      <p>
                        «Atenção: A fatura FT 2026/104 de 2.450,00 € encontra-se em atraso há 5 dias.
                        Agradecemos a regularização urgente ou envio do comprovativo de pagamento nas próximas 24 horas.»
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> E-mail
                      </span>
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-600" /> SMS
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate('auth_register')}
                      className="text-xs"
                    >
                      Experimentar na sua conta
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Aba 3: Centro de Cobranças */}
              {activeTab === 'collection' && (
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 text-left space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Fila de Prioridades e Lembretes Automáticos
                    </span>
                    <Badge variant="success" size="sm">
                      Taxa de Recuperação 94.2%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <div className="font-bold text-indigo-950">Cobranças Preventivas</div>
                      <div className="text-slate-600 text-[11px] mt-1">
                        Lembrete 3 dias antes do vencimento
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="font-bold text-amber-950">Vencidas Recentes</div>
                      <div className="text-slate-600 text-[11px] mt-1">
                        Contacto cordial 1 a 5 dias após prazo
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                      <div className="font-bold text-rose-950">Atraso Crítico</div>
                      <div className="text-slate-600 text-[11px] mt-1">
                        Registo de promessas e termo de acordo
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé da Janela Demonstrativa */}
            <div className="bg-white px-4 sm:px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Demonstração visual do plano PRO • Dados isolados em conformidade com RGPD</span>
              </div>
              <div
                onClick={() => navigate('auth_register')}
                className="font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
              >
                <span>Criar conta para o seu negócio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
