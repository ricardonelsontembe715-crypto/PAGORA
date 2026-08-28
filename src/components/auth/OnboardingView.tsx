import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import {
  Building2,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Receipt,
  Users,
  MessageSquare,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const ACTIVITY_OPTIONS = [
  { id: 'services', label: 'Prestador de Serviços Independentes', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'consulting', label: 'Consultoria e Freelance', icon: <Target className="w-4 h-4" /> },
  { id: 'agency', label: 'Agência e Estúdio Criativo', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'retail', label: 'Pequeno Comércio e Loja', icon: <Building2 className="w-4 h-4" /> },
  { id: 'construction', label: 'Construção, Obras e Reparações', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'health', label: 'Saúde, Bem-estar e Terapias', icon: <Users className="w-4 h-4" /> },
  { id: 'other', label: 'Outra Atividade Profissional', icon: <Building2 className="w-4 h-4" /> },
];

const PURPOSE_OPTIONS = [
  {
    id: 'organize_invoices',
    label: 'Organizar cobranças e faturas pendentes',
    desc: 'Registar valores a receber e manter o controlo dos prazos',
    icon: <Receipt className="w-4 h-4 text-indigo-600" />,
  },
  {
    id: 'overdue_recovery',
    label: 'Cobrar clientes em atraso sem constrangimento',
    desc: 'Gerar mensagens cordiais, profissionais e respeitosas',
    icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'track_promises',
    label: 'Acompanhar promessas e prazos de pagamento',
    desc: 'Evitar esquecimentos e melhorar a previsibilidade de tesouraria',
    icon: <Clock className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'centralize_clients',
    label: 'Centralizar histórico e contactos de clientes',
    desc: 'Reunir dados fiscais e registos de cobrança num único local',
    icon: <Users className="w-4 h-4 text-blue-600" />,
  },
];

export const OnboardingView: React.FC = () => {
  const { user, account, completeOnboarding, skipOnboarding } = useAuth();
  const { navigate } = useNavigation();
  const { showToast } = useNotifications();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 3;

  // Form State
  const [workspaceName, setWorkspaceName] = useState(account?.name || (user?.name ? `Espaço de ${user.name}` : 'Meu Negócio'));
  const [selectedActivity, setSelectedActivity] = useState<string>(account?.activityType || 'Prestador de Serviços Independentes');
  const [selectedPurpose, setSelectedPurpose] = useState<string>(account?.usagePurpose || 'Organizar cobranças e faturas pendentes');
  const [taxId, setTaxId] = useState(account?.taxId || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!workspaceName.trim()) {
        setErrorMsg('Por favor, indique um nome para o seu espaço de trabalho.');
        return;
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await completeOnboarding({
      accountName: workspaceName.trim(),
      activityType: selectedActivity,
      usagePurpose: selectedPurpose,
      taxId: taxId.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      showToast({
        type: 'success',
        title: 'Espaço de trabalho pronto',
        message: 'A sua conta foi configurada com sucesso. Bem-vindo à Pagora!',
      });
      navigate('dashboard_overview');
    } else {
      setErrorMsg(result.error || 'Erro ao guardar configurações.');
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    showToast({
      type: 'info',
      title: 'Configuração adiada',
      message: 'Poderá completar estes dados mais tarde nas Definições.',
    });
    navigate('dashboard_overview');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Logo & Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              P
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">PAGORA</span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Saltar configuração por agora
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-2">
            <span>Passo {currentStep} de {totalSteps}</span>
            <span>
              {currentStep === 1 && 'Identidade do Negócio'}
              {currentStep === 2 && 'Objetivo Principal'}
              {currentStep === 3 && 'Detalhes Fiscais e Contacto'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-md">
          {errorMsg && (
            <div className="mb-5">
              <Alert type="error" title="Atenção">
                {errorMsg}
              </Alert>
            </div>
          )}

          {/* PASSO 1: Nome do Espaço e Tipo de Atividade */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Como devemos chamar o seu espaço de trabalho?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Este nome identificará a sua empresa, atelier ou atividade nas comunicações e registos.
                </p>
              </div>

              <Input
                label="Nome do espaço de trabalho / negócio"
                type="text"
                placeholder="Ex: Atelier Silva & Ramos ou João Pereira Consultoria"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                leftIcon={<Building2 className="w-4 h-4" />}
                helperText="Poderá criar outros espaços ou alterar o nome mais tarde."
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Qual é o seu setor ou atividade principal?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ACTIVITY_OPTIONS.map((item) => {
                    const isSelected = selectedActivity === item.label;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedActivity(item.label)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className={isSelected ? 'text-indigo-600' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: Objetivo Principal na Pagora */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Qual é o seu objetivo prioritário na Pagora?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Adaptaremos os atalhos e sugestões para responder melhor às suas necessidades imediatas.
                </p>
              </div>

              <div className="space-y-2.5">
                {PURPOSE_OPTIONS.map((opt) => {
                  const isSelected = selectedPurpose === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPurpose(opt.label)}
                      className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{opt.icon}</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {opt.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 3: NIF e Telemóvel (Opcionais) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Dados de faturação e contacto (opcional)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pode preencher agora para agilizar a criação de mensagens e cabeçalhos de cobrança.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="NIF / Número de Identificação Fiscal (Opcional)"
                  type="text"
                  placeholder="Ex: 509 123 456"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  helperText="Utilizado para identificar a sua empresa nas comunicações formais."
                />

                <Input
                  label="Telemóvel / Telefone de Contacto (Opcional)"
                  type="tel"
                  placeholder="Ex: 912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  helperText="Para notificações de segurança e lembretes do sistema."
                />

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong>Plano FREE Ativado:</strong> O seu espaço de trabalho foi criado com o plano FREE (0,00 €/mês), sem qualquer cobrança. Pode começar imediatamente a registar clientes e cobranças.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Configurar depois
              </button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continuar
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleFinish}
                isLoading={isSubmitting}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Concluir e Começar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
