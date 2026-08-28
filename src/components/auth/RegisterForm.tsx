import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { ArrowLeft, Lock, Mail, User as UserIcon, Building2, Check, ShieldCheck } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const { signUp, isLoading, error } = useAuth();
  const { navigate } = useNavigation();
  const { showToast } = useNotifications();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados de criação e transição de onboarding profissional (Parte 37)
  const [isSettingUpWorkspace, setIsSettingUpWorkspace] = useState(false);
  const [setupStepText, setSetupStepText] = useState('A criar o seu espaço de trabalho…');
  const [setupProgress, setSetupProgress] = useState(15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Por favor, introduza o seu nome completo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Por favor, introduza um endereço de e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setFormError('A palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    if (password !== passwordConfirm) {
      setFormError('As palavras-passe não coincidem. Verifique a confirmação.');
      return;
    }

    if (!acceptTerms) {
      setFormError('Por favor, confirme que aceita os termos e condições para avançar.');
      return;
    }

    setIsSettingUpWorkspace(true);
    setSetupProgress(25);
    setSetupStepText('A criar o seu espaço de trabalho…');

    const result = await signUp({
      name,
      email,
      accountName: accountName || `Atividade de ${name}`,
      password,
      passwordConfirm,
      acceptTerms,
    });

    if (result.success) {
      // Sequência de transição suave de 2.2 segundos
      setTimeout(() => {
        setSetupStepText('A configurar o motor de cobranças e modelos…');
        setSetupProgress(65);
      }, 700);

      setTimeout(() => {
        setSetupStepText('Quase pronto… A preparar o seu painel.');
        setSetupProgress(95);
      }, 1500);

      setTimeout(() => {
        setIsSettingUpWorkspace(false);
        showToast({
          type: 'success',
          title: 'Conta criada com sucesso',
          message: 'Bem-vindo à Pagora. Vamos configurar o seu espaço de trabalho.',
        });
        navigate('auth_onboarding');
      }, 2300);
    } else {
      setIsSettingUpWorkspace(false);
      setFormError(result.error || 'Erro ao criar conta.');
    }
  };

  if (isSettingUpWorkspace) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
            <ShieldCheck className="w-7 h-7 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {setupStepText}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              A criar ambiente isolado, parâmetros de privacidade e modelos de abordagem.
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${setupProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Voltar */}
        <button
          type="button"
          onClick={() => navigate('landing')}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à página inicial</span>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">PAGORA</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Criar conta gratuita
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Sem necessidade de cartão de crédito. Comece a organizar cobranças em minutos.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-md">
          {(formError || error) && (
            <div className="mb-5">
              <Alert type="error" title="Atenção">
                {formError || error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="O seu nome completo"
              type="text"
              placeholder="Ex: Ana Rodrigues"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Nome do negócio, empresa ou atividade"
              type="text"
              placeholder="Ex: AR Arquitetura ou Ana Serviços"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              helperText="Poderá alterar ou criar outros espaços posteriormente."
              leftIcon={<Building2 className="w-4 h-4" />}
            />

            <Input
              label="Endereço de e-mail"
              type="email"
              placeholder="ana@exemplo.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Palavra-passe"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirmar palavra-passe"
                type="password"
                placeholder="Repita a palavra-passe"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Plano FREE Vitalício sem custos ocultos nem fidelização.</span>
            </div>

            <Checkbox
              label={
                <span className="text-xs">
                  Aceito os{' '}
                  <span className="text-indigo-600 font-medium">Termos de Serviço</span> e a{' '}
                  <span className="text-indigo-600 font-medium">Política de Privacidade</span> da Pagora.
                </span>
              }
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
            >
              Criar Conta Gratuita
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Já possui uma conta na Pagora?{' '}
              <button
                type="button"
                onClick={() => navigate('auth_login')}
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Iniciar sessão
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

