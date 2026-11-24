import { CurrencyCode } from '../types/immo';

export function formatCurrency(amount: number, currency: CurrencyCode = 'MAD'): string {
  if (currency === 'MAD') {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(amount)} MAD`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: CurrencyCode = 'MAD'): string {
  const symbol = currency === 'MAD' ? 'MAD' : currency === 'CHF' ? 'CHF' : '€';
  if (amount >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(2).replace('.', ',');
    return `${val} M ${symbol}`;
  }
  if (amount >= 1_000) {
    const val = Math.round(amount / 1_000);
    return `${val} k ${symbol}`;
  }
  return `${amount} ${symbol}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

export function formatDateFr(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}
