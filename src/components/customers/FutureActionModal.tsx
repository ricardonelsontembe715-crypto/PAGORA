import React from 'react';
import { Customer } from '../../types/database';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Receipt, MessageSquare, ArrowRight, Sparkles, CheckCircle2, Clock } from 'lucide-react';

interface FutureActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'invoice' | 'message';
  customer: Customer | null;
}

export const FutureActionModal: React.FC<FutureActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
  customer,
}) => {
  if (!customer) return null;

  const isInvoice = actionType === 'invoice';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isInvoice ? 'Criar Cobrança para Cliente' : 'Gerar Mensagem de Cobrança'}
      description={
        isInvoice
          ? 'Fluxo preparado para o módulo seguinte de Cobranças da Pagora.'
          : 'Fluxo preparado para o motor de redação e envio de comunicações cordiais.'
      }
      maxWidth="md"
    >
      <div className="p-6 space-y-5">
        {/* Banner Informativo */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            {isInvoice ? <Receipt className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950">
                {isInvoice ? 'Módulo de Cobranças (Parte 4)' : 'Motor de Mensagens (Parte 5)'}
              </span>
              <Badge variant="primary" size="sm">
                Em preparação
              </Badge>
            </div>
            <p className="text-xs text-indigo-900/90 mt-1 leading-relaxed">
              O cliente <strong>{customer.name}</strong> está 100% parametrizado e pronto para ser
              vinculado a este fluxo.
            </p>
          </div>
        </div>

        {/* Dados Herdados do Cliente */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Dados herdados deste cliente:
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 font-mono text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Destinatário:</span>
              <span className="font-bold text-slate-900 font-sans">{customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">E-mail:</span>
              <span>{customer.email || 'Não configurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Telemóvel / WhatsApp:</span>
              <span>{customer.phone || 'Não configurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">NIF:</span>
              <span>{customer.taxId || 'Não configurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">País & Moeda:</span>
              <span className="font-sans">{customer.country} • EUR (€)</span>
            </div>
          </div>
        </div>

        {/* O que acontecerá no próximo módulo */}
        <div className="space-y-2 text-xs text-slate-600">
          <div className="font-semibold text-slate-900">
            {isInvoice ? 'O que fará este botão na Parte 4:' : 'O que fará este botão na Parte 5:'}
          </div>
          <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
            {isInvoice ? (
              <>
                <li>Definir número de fatura, valor a cobrar e data de vencimento.</li>
                <li>Atribuir métodos de liquidação (Transferência, MB WAY, Referência Multibanco).</li>
                <li>Monitorizar automaticamente o estado (Pendente, Em Atraso, Liquidado).</li>
              </>
            ) : (
              <>
                <li>
                  Gerar automaticamente texto cordial, formal ou direto com o nome de{' '}
                  <strong>{customer.name}</strong>.
                </li>
                <li>Incluir referências de pagamento e valores em atraso sem constrangimento.</li>
                <li>Permitir envio por Email, WhatsApp ou cópia direta de texto.</li>
              </>
            )}
          </ul>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
};
