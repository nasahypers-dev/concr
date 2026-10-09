import type { MoneyString } from '../domain/common';

/**
 * Money helpers. Amounts travel as "110.00" strings (CLAUDE.md rule 11) and are computed in
 * integer qəpik so that 0.1 + 0.2 never happens. Rounding is half-up at the qəpik.
 */

const MONEY_RE = /^-?\d+\.\d{2}$/;

export const ZERO_MONEY: MoneyString = '0.00';
export const CURRENCY_SYMBOL = '₼';

export function isMoneyString(value: unknown): value is MoneyString {
  return typeof value === 'string' && MONEY_RE.test(value);
}

/** "110.00" → 11000. Throws on malformed input so bugs surface early. */
export function toQepik(money: MoneyString): number {
  if (!isMoneyString(money)) throw new TypeError(`Invalid money string: ${String(money)}`);
  const negative = money.startsWith('-');
  const [whole = '0', fraction = '00'] = money.replace('-', '').split('.');
  const value = Number(whole) * 100 + Number(fraction);
  return negative ? -value : value;
}

/** 11000 → "110.00". Non-integers are rounded half-up first. */
export function fromQepik(qepik: number): MoneyString {
  const rounded = Math.round(qepik);
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${whole}.${fraction.toString().padStart(2, '0')}`;
}

export function addMoney(...amounts: MoneyString[]): MoneyString {
  return fromQepik(amounts.reduce((sum, amount) => sum + toQepik(amount), 0));
}

export function subtractMoney(a: MoneyString, b: MoneyString): MoneyString {
  return fromQepik(toQepik(a) - toQepik(b));
}

/** Multiply by a plain number (volume in m³, VAT rate), rounding half-up to the qəpik. */
export function multiplyMoney(amount: MoneyString, factor: number): MoneyString {
  if (!Number.isFinite(factor)) throw new TypeError(`Invalid factor: ${String(factor)}`);
  return fromQepik(toQepik(amount) * factor);
}

export function compareMoney(a: MoneyString, b: MoneyString): -1 | 0 | 1 {
  const diff = toQepik(a) - toQepik(b);
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

export function isZeroMoney(amount: MoneyString): boolean {
  return toQepik(amount) === 0;
}

export interface FormatMoneyOptions {
  /** Append " ₼" (default true). */
  symbol?: boolean;
  /** Thousands separator (default: regular space, as on the website). */
  thousandsSeparator?: string;
}

/**
 * Azerbaijani display format (spec §15): "1 298,00 ₼". Deterministic on every runtime
 * (Hermes included), no Intl dependency.
 */
export function formatAzn(amount: MoneyString, options: FormatMoneyOptions = {}): string {
  const { symbol = true, thousandsSeparator = ' ' } = options;
  const qepik = toQepik(amount);
  const sign = qepik < 0 ? '-' : '';
  const abs = Math.abs(qepik);
  const whole = Math.floor(abs / 100).toString();
  const fraction = (abs % 100).toString().padStart(2, '0');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  const text = `${sign}${grouped},${fraction}`;
  return symbol ? `${text} ${CURRENCY_SYMBOL}` : text;
}
