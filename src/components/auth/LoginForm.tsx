import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { ArrowLeft, Lock, Mail } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { signIn, isLoading, error } = useAuth();
  const { navigate } = useNavigation();
  const { showToast } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = await signIn({ email, password, rememberMe });
    if (result.success) {
      if (result.isAdmin) {
        showToast({
          type: 'success',
          title: 'Sessão Administrativa',
          message: 'Autenticação autorizada no Painel do Proprietário.',
        });
        navigate('admin_portal');
      } else {
        showToast({
          type: 'success',
          title: 'Sessão iniciada',
          message: 'Bem-vindo de volta à Pagora.',
        });
        navigate('dashboard_overview');
      }
    } else {
      setFormError(result.error || 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Voltar à Landing */}
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
          Iniciar sessão
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Aceda ao seu painel de cobranças e acompanhamento de pagamentos.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-md">
          {(formError || error) && (
            <div className="mb-5">
              <Alert type="error" title="Não foi possível iniciar sessão">
                {formError || error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Endereço de e-mail"
              type="email"
              placeholder="exemplo@empresa.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="space-y-1">
              <Input
                label="Palavra-passe"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('auth_recovery')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                >
                  Esqueceu-se da palavra-passe?
                </button>
              </div>
            </div>

            <Checkbox
              label="Lembrar este dispositivo"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
            >
              Iniciar sessão
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Ainda não tem conta na Pagora?{' '}
              <button
                type="button"
                onClick={() => navigate('auth_register')}
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Criar conta gratuita
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
