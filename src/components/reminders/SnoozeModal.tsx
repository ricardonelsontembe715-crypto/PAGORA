import React, { useState } from 'react';
import { CollectionReminder } from '../../types/automations';
import { Button } from '../ui/Button';
import {
  X,
  Clock,
  Calendar,
  Sun,
  Sunrise,
  CalendarDays,
  Check,
} from 'lucide-react';

interface SnoozeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: CollectionReminder | null;
  onSnooze: (id: string, daysOrDate: number | string) => Promise<unknown> | void | unknown;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  isOpen,
  onClose,
  reminder,
  onSnooze,
}) => {
  const [customDate, setCustomDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !reminder) return null;

  const handleQuickSnooze = async (days: number) => {
    setIsSubmitting(true);
    try {
      await onSnooze(reminder.id, days);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSnooze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;
    setIsSubmitting(true);
    try {
      await onSnooze(reminder.id, customDate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="snooze-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Adiar Lembrete de Cobrança
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">
                {reminder.customerName} ({reminder.invoiceNumber || 'Geral'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Opções Rápidas de Adiamento */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickSnooze(1)}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <Sunrise className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Amanhã de manhã
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Agendar para o próximo dia útil às 09:30
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                +1 dia
              </span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickSnooze(3)}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-indigo-500" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Em 3 dias úteis
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Tempo ideal para aguardar processamento bancário
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                +3 dias
              </span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickSnooze(7)}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Próxima semana (+7 dias)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Acompanhamento no ciclo seguinte
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                +7 dias
              </span>
            </button>
          </div>

          {/* Escolha de Data Específica */}
          <form onSubmit={handleCustomSnooze} className="pt-3 border-t border-slate-100 space-y-2.5">
            <label className="block font-semibold text-slate-700">
              Ou escolha uma data específica:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <Button type="submit" size="sm" disabled={!customDate || isSubmitting}>
                Confirmar
              </Button>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};
