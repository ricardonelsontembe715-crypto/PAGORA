import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-indigo-900 text-white px-4 py-2.5 text-xs flex items-center justify-between gap-4 border-b border-indigo-800">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-indigo-300 shrink-0" />
        <span>
          Instale a <strong>PAGORA</strong> no seu dispositivo para acesso rápido e direto.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstall}
          className="bg-white text-indigo-900 hover:bg-slate-100 py-1 px-2.5 text-xs"
        >
          Instalar Aplicação
        </Button>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="p-1 text-indigo-300 hover:text-white rounded"
          aria-label="Dispensar aviso de instalação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
