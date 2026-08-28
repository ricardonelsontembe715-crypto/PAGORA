import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, Info, Trash2, CheckCircle2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  details?: {
    willDelete?: string[];
    willKeep?: string[];
    isIrreversible?: boolean;
  };
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  details,
}) => {
  const iconConfig = {
    danger: {
      bg: 'bg-red-50 text-red-600 border border-red-100',
      icon: <Trash2 className="w-5 h-5" />,
      btnVariant: 'primary' as const,
      btnClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-700 border border-amber-100',
      icon: <AlertTriangle className="w-5 h-5" />,
      btnVariant: 'primary' as const,
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    },
    primary: {
      bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      icon: <Info className="w-5 h-5" />,
      btnVariant: 'primary' as const,
      btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    },
  };

  const currentConfig = iconConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentConfig.bg}`}>
            {currentConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
            {description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        {details && (
          <div className="space-y-3 pt-2">
            {details.willDelete && details.willDelete.length > 0 && (
              <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-lg text-xs space-y-1.5">
                <span className="text-red-900 font-semibold block text-[11px] uppercase tracking-wider">
                  O que será removido:
                </span>
                <ul className="space-y-1 text-red-800">
                  {details.willDelete.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {details.willKeep && details.willKeep.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <span className="text-slate-700 font-semibold block text-[11px] uppercase tracking-wider">
                  O que será preservado:
                </span>
                <ul className="space-y-1 text-slate-600">
                  {details.willKeep.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {details.isIrreversible && (
              <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Esta operação é definitiva e não pode ser revertida após confirmação.</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className={currentConfig.btnClass}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
