import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { PeriodOption } from '../../lib/dashboardAnalytics';
import {
  Calendar,
  Users,
  Plus,
  ChevronDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string;
  accountName?: string;
  hasInvoices: boolean;
  overdueCount: number;
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  onNewCustomer: () => void;
  onNewInvoice: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  accountName,
  hasInvoices,
  overdueCount,
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  onNewCustomer,
  onNewInvoice,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(customStartDate || '');
  const [tempEnd, setTempEnd] = useState(customEndDate || '');

  // Determina saudação com base na hora local
  const currentHour = new Date().getHours();
  let greeting = 'Bom dia';
  if (currentHour >= 12 && currentHour < 20) {
    greeting = 'Boa tarde';
  } else if (currentHour >= 20 || currentHour < 6) {
    greeting = 'Boa noite';
  }

  // Subtexto contextual
  let statusMessage = 'A sua cobrança está sob controlo.';
  let StatusIcon = CheckCircle2;
  let statusColor = 'text-emerald-600';

  if (!hasInvoices) {
    statusMessage = 'Ainda não existem cobranças registadas. Comece por adicionar o seu primeiro cliente.';
    StatusIcon = Sparkles;
    statusColor = 'text-indigo-600';
  } else if (overdueCount > 0) {
    statusMessage = `Existem ${overdueCount} cobrança${overdueCount > 1 ? 's' : ''} que precisa${overdueCount > 1 ? 'm' : ''} da sua atenção.`;
    StatusIcon = AlertTriangle;
    statusColor = 'text-amber-600';
  }

  const periodLabels: Record<PeriodOption, string> = {
    today: 'Hoje',
    last_7_days: 'Últimos 7 dias',
    last_30_days: 'Últimos 30 dias',
    this_month: 'Este mês',
    last_month: 'Mês anterior',
    last_3_months: 'Últimos 3 meses',
    last_6_months: 'Últimos 6 meses',
    this_year: 'Este ano',
    custom: 'Personalizado',
  };

  const periodDropdownItems = [
    { label: 'Hoje', onClick: () => onPeriodChange('today') },
    { label: 'Últimos 7 dias', onClick: () => onPeriodChange('last_7_days') },
    { label: 'Últimos 30 dias', onClick: () => onPeriodChange('last_30_days') },
    { label: 'Este mês', onClick: () => onPeriodChange('this_month') },
    { label: 'Mês anterior', onClick: () => onPeriodChange('last_month') },
    { label: 'Últimos 3 meses', onClick: () => onPeriodChange('last_3_months') },
    { label: 'Este ano', onClick: () => onPeriodChange('this_year') },
    {
      label: 'Personalizado...',
      onClick: () => {
        onPeriodChange('custom');
        setShowCustomModal(true);
      },
    },
  ];

  return (
    <div className="space-y-3 pb-2 border-b border-slate-200/80">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Saudação e Contexto */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, <span className="text-indigo-700">{userName || 'Utilizador'}</span>
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
            <StatusIcon className={`w-3.5 h-3.5 ${statusColor} shrink-0`} />
            <span>{statusMessage}</span>
            {accountName && (
              <span className="hidden sm:inline text-slate-400">
                • Espaço: <strong className="text-slate-700 font-semibold">{accountName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Controlos e Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Período */}
          <div className="relative">
            <Dropdown
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-slate-500" />}
                  rightIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  className="bg-white border-slate-200 text-slate-700 shadow-2xs font-medium text-xs h-8"
                >
                  <span>{periodLabels[selectedPeriod]}</span>
                </Button>
              }
              items={periodDropdownItems}
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onNewCustomer}
            leftIcon={<Users className="w-3.5 h-3.5 text-slate-600" />}
            className="h-8 text-xs font-medium"
          >
            Novo Cliente
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onNewInvoice}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="h-8 text-xs font-semibold shadow-2xs"
          >
            Registar Cobrança
          </Button>
        </div>
      </div>

      {/* Barra de Período Personalizado (quando ativo) */}
      {selectedPeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 font-medium text-indigo-900">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Intervalo Personalizado:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={tempStart}
              onChange={(e) => setTempStart(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-slate-400">até</span>
            <input
              type="date"
              value={tempEnd}
              onChange={(e) => setTempEnd(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (tempStart && tempEnd && onCustomDateChange) {
                  onCustomDateChange(tempStart, tempEnd);
                }
              }}
              className="h-7 text-[11px] px-2.5"
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
