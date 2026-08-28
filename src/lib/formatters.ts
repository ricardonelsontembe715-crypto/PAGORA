/**
 * Utilitários de formatação para Português de Portugal (pt-PT)
 */

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2).replace('.', ',')} €`;
  }
}

export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-PT', options || {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | Date): string {
  return formatDate(dateString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('351')) {
    return `+351 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
}

/**
 * Calcula os dias de atraso comparando com a data atual (meia-noite local)
 * Retorna 0 se ainda não estiver vencida. Nunca retorna valores negativos.
 */
export function getDaysOverdue(dueDateString: string): number {
  if (!dueDateString) return 0;
  try {
    // Normalização estrita para datas YYYY-MM-DD
    const parts = dueDateString.split('T')[0].split('-');
    if (parts.length !== 3) return 0;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const dueDate = new Date(year, month, day, 0, 0, 0, 0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
}

/**
 * Verifica se uma data de vencimento já passou
 */
export function isDatePassed(dateString: string): boolean {
  return getDaysOverdue(dateString) > 0;
}

/**
 * Validação segura de link de pagamento
 */
export function isValidUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

