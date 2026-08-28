import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants, MOTION_TIERS, MOTION_EASINGS } from '../../lib/motionTokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth,
  size,
  id,
}) => {
  const chosenSize = size || maxWidth || 'md';
  // Fecha com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Previne scroll de fundo quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id={id}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 md:p-6 pt-[calc(0.625rem+env(safe-area-inset-top))] pb-[calc(0.625rem+env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_TIERS.FAST }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Content */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/80 w-full ${maxWidthClasses[chosenSize] || 'max-w-md'} max-h-[94vh] flex flex-col overflow-hidden z-10`}
          >
            {(title || description) && (
              <div className="flex items-start justify-between px-4 sm:px-6 pt-4 pb-3 sm:pt-5 sm:pb-4 border-b border-slate-100 shrink-0">
                <div className="min-w-0 pr-2">
                  {title && <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate sm:whitespace-normal">{title}</h2>}
                  {description && (
                    <p className="text-xs text-slate-500 mt-0.5 sm:mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 -mr-1"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">{children}</div>

            {footer && (
              <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
