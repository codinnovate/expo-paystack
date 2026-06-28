import { CURRENCY_SUBUNIT_MAP, CURRENCY_SYMBOLS } from '../constants';
import type { PaystackCurrency } from '../types';

export { CURRENCY_SUBUNIT_MAP };

/**
 * Returns the currency symbol for a given Paystack currency code.
 *
 * @example
 * getCurrencySymbol('NGN'); // => '₦'
 *
 * @param currency - The currency code.
 * @returns The currency symbol.
 */
export function getCurrencySymbol(currency: PaystackCurrency): string {
  return CURRENCY_SYMBOLS[currency];
}

/**
 * Converts a human-readable (major-unit) amount to the smallest currency unit,
 * which is the unit Paystack expects (kobo, pesewa, cents).
 *
 * @example
 * toSubunit(5000, 'NGN'); // => 500000
 *
 * @param amount - The amount in the major currency unit.
 * @param currency - The currency code.
 * @returns The amount in the smallest currency unit, rounded to an integer.
 */
export function toSubunit(amount: number, currency: PaystackCurrency): number {
  return Math.round(amount * CURRENCY_SUBUNIT_MAP[currency]);
}

/**
 * Formats a Paystack amount (given in the smallest currency unit) into a
 * human-readable string with the appropriate symbol and grouping.
 *
 * @example
 * formatAmount(500000, 'NGN'); // => '₦5,000.00'
 *
 * @param amount - The amount in the smallest currency unit.
 * @param currency - The currency code.
 * @returns The formatted currency string.
 */
export function formatAmount(
  amount: number,
  currency: PaystackCurrency
): string {
  const divisor = CURRENCY_SUBUNIT_MAP[currency];
  const major = amount / divisor;
  const symbol = CURRENCY_SYMBOLS[currency];

  // Prefer Intl for correct thousands grouping; fall back to a manual format
  // if Intl is unavailable in the JS engine.
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    formatted = major.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return `${symbol}${formatted}`;
}
