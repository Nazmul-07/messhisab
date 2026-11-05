// ============================================================
// MessHisab — Currency & Paisa Utilities
// ============================================================

import { CURRENCY_SYMBOL, PAISA_PER_TAKA } from './constants';

/** Convert BDT taka (number) to integer paisa */
export function takaToPaisa(taka: number): number {
  return Math.round(taka * PAISA_PER_TAKA);
}

/** Convert integer paisa to BDT taka */
export function paisaToTaka(paisa: number): number {
  return paisa / PAISA_PER_TAKA;
}

/** Format paisa as BDT display string e.g. "৳1,234.50" */
export function formatCurrency(paisa: number, opts?: { showSign?: boolean }): string {
  const taka = paisaToTaka(paisa);
  const sign = opts?.showSign && taka > 0 ? '+' : '';
  const formatted = Math.abs(taka).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${CURRENCY_SYMBOL}${formatted}`;
}

/** Format paisa as compact BDT string e.g. "৳1.2K" */
export function formatCurrencyCompact(paisa: number): string {
  const taka = paisaToTaka(paisa);
  if (Math.abs(taka) >= 1_000_000) {
    return `${CURRENCY_SYMBOL}${(taka / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(taka) >= 1_000) {
    return `${CURRENCY_SYMBOL}${(taka / 1_000).toFixed(1)}K`;
  }
  return `${CURRENCY_SYMBOL}${taka.toFixed(0)}`;
}

/** Safe integer paisa addition (avoids float drift) */
export function addPaisa(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + Math.round(a), 0);
}

/** Divide paisa and round to nearest integer */
export function dividePaisa(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round(numerator / denominator);
}

/** Distribute paisa as equally as possible among n parts.
 *  Returns array of length n where values sum to total. */
export function distributePaisaEqually(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => (i < remainder ? base + 1 : base));
}

