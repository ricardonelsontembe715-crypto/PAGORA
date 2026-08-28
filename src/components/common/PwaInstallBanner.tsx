import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está a correr em modo standalone (PWA instalada)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Verifica se o utilizador dispensou o convite recentemente
    const dismissedAt = localStorage.getItem('pagora_pwa_dismissed_at');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return; // Aguarda 7 dias antes de sugerir novamente
      }
    }

    // 3. Registo do Service Worker se suportado
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('[PWA] Registo de service worker ignorado em dev/container:', err);
      });
    }

    // 4. Deteta iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 5. Escuta o evento beforeinstallprompt para Chrome / Android / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Apresenta após um pequeno delay para não interferir com a entrada inicial
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Se for iOS e nunca dispensado, mostra após 5 segundos
    if (isIosDevice && !dismissedAt) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Erro ao abrir diálogo de instalação:', err);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pagora_pwa_dismissed_at', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      id="pwa-install-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-2xs font-bold text-sm">
          P
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-semibold text-xs text-white">Instalar a PAGORA</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300">
              App Rápida
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {isIOS
              ? 'Aceda diretamente às suas cobranças a partir do ecrã inicial do seu telemóvel.'
              : 'Tenha acesso rápido às cobranças no seu telemóvel ou computador, sem abrir o navegador.'}
          </p>

          {showIOSInstructions && (
            <div className="mt-2.5 p-2 bg-slate-800/90 rounded-lg text-[11px] text-slate-200 border border-slate-700 space-y-1">
              <p className="font-semibold text-white">No Safari do seu iPhone:</p>
              <p>1. Toque no botão de <strong>Partilha</strong> (ícone do quadrado com seta para cima).</p>
              <p>2. Selecione <strong>"Adicionar ao ecrã principal"</strong>.</p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button
              id="pwa-install-button"
              variant="primary"
              size="sm"
              onClick={handleInstallClick}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs py-1.5 h-auto"
            >
              {isIOS ? 'Como instalar' : 'Instalar agora'}
            </Button>

            <Button
              id="pwa-dismiss-button"
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 text-xs py-1.5 h-auto"
            >
              Agora não
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          aria-label="Fechar convite de instalação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
