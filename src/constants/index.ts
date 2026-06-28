/**
 * expo-paystack — Constants
 *
 * Centralized constant values. No hardcoded strings should appear outside
 * of this module (per the package's quality bar).
 */

import type { PaystackChannel, PaystackCurrency } from '../types';

/** Base URL for the Paystack REST API. */
export const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/** CDN URL for the Paystack Inline JS (v2) library. */
export const PAYSTACK_INLINE_JS_URL = 'https://js.paystack.co/v2/inline.js';

/** All currencies supported by this package. */
export const SUPPORTED_CURRENCIES: readonly PaystackCurrency[] = [
  'NGN',
  'GHS',
  'ZAR',
  'KES',
  'USD',
  'XOF',
];

/** All payment channels supported by this package. */
export const SUPPORTED_CHANNELS: readonly PaystackChannel[] = [
  'card',
  'bank',
  'ussd',
  'qr',
  'mobile_money',
  'bank_transfer',
  'eft',
  'apple_pay',
  'capitec_pay',
  'payattitude',
];

/** Human-readable label for each supported currency. */
export const CURRENCY_LABELS: Record<PaystackCurrency, string> = {
  NGN: 'Nigerian Naira',
  GHS: 'Ghanaian Cedi',
  ZAR: 'South African Rand',
  KES: 'Kenyan Shilling',
  USD: 'US Dollar',
  XOF: 'West African CFA Franc',
};

/**
 * Number of minor units per major unit for each currency.
 * For example NGN: 100 (100 kobo = ₦1). XOF has no minor unit in practice,
 * but the Paystack API still treats amounts in the smallest unit (×100).
 */
export const CURRENCY_SUBUNIT_MAP: Record<PaystackCurrency, number> = {
  NGN: 100,
  GHS: 100,
  ZAR: 100,
  KES: 100,
  USD: 100,
  XOF: 100,
};

/** Symbol used to render each currency. */
export const CURRENCY_SYMBOLS: Record<PaystackCurrency, string> = {
  NGN: '₦',
  GHS: '₵',
  ZAR: 'R',
  KES: 'KSh',
  USD: '$',
  XOF: 'CFA',
};

/** The package-wide prefix used for all log/error messages. */
export const LOG_PREFIX = '[expo-paystack]';
