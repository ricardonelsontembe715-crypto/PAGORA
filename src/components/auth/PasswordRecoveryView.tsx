import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { ArrowLeft, Mail, CheckCircle2, Lock, KeyRound } from 'lucide-react';

export const PasswordRecoveryView: React.FC = () => {
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const { navigate } = useNavigation();
  const { showToast } = useNotifications();

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await requestPasswordReset(email);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message);
      if (result.simulatedToken) {
        setResetToken(result.simulatedToken);
      }
      setStep('confirm');
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetToken.trim()) {
      setErrorMessage('Por favor, introduza o código ou token de recuperação.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As palavras-passe não coincidem. Verifique a confirmação.');
      return;
    }

    setIsSubmitting(true);
    const result = await confirmPasswordReset(resetToken, newPassword);
    setIsSubmitting(false);

    if (result.success) {
      showToast({
        type: 'success',
        title: 'Palavra-passe alterada',
        message: 'A sua nova palavra-passe foi guardada com sucesso. Pode iniciar sessão.',
      });
      navigate('auth_login');
    } else {
      setErrorMessage(result.error || 'Erro ao redefinir a palavra-passe.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          type="button"
          onClick={() => navigate('auth_login')}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início de sessão</span>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">PAGORA</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {step === 'request' ? 'Recuperar palavra-passe' : 'Redefinir palavra-passe'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {step === 'request'
            ? 'Introduza o seu e-mail associado à conta Pagora para receber o código de redefinição.'
            : 'Introduza o código recebido e defina a sua nova palavra-passe de acesso.'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-md">
          {errorMessage && (
            <div className="mb-5">
              <Alert type="error" title="Atenção">
                {errorMessage}
              </Alert>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="Endereço de e-mail registado"
                type="email"
                placeholder="o.seu.email@empresa.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="Será gerado um código de recuperação seguro para este endereço."
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isSubmitting}
              >
                Enviar instruções de recuperação
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              {successMessage && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Instruções enviadas</span>
                  </div>
                  <p className="text-[11px] text-indigo-800">{successMessage}</p>
                </div>
              )}

              <Input
                label="Código / Token de recuperação"
                type="text"
                placeholder="Ex: PAGORA-RESET-123456"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                leftIcon={<KeyRound className="w-4 h-4" />}
                helperText="Preenchido automaticamente para este teste."
              />

              <Input
                label="Nova palavra-passe"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirmar nova palavra-passe"
                type="password"
                placeholder="Repita a nova palavra-passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isSubmitting}
              >
                Guardar Nova Palavra-passe
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Voltar e pedir novo código
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
