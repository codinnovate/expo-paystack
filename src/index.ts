/**
 * expo-paystack
 *
 * The easiest way to integrate Paystack payments into your Expo app.
 * Built for Expo and the New Architecture, with strict TypeScript.
 */

// Components
export { PaystackProvider } from './context/PaystackProvider';
export { PaystackCheckout } from './components/PaystackCheckout';

// Hooks
export { usePaystack } from './hooks/usePaystack';

// Types
export type {
  PaystackCurrency,
  PaystackChannel,
  PaystackBearer,
  PaystackTransaction,
  PaystackTransactionStatus,
  PaystackError,
  PaystackVerifyResponse,
  PaystackPaymentConfig,
  PaystackProviderProps,
  PaystackCheckoutProps,
  UsePaystackReturn,
} from './types';

// Utilities
export {
  formatAmount,
  toSubunit,
  getCurrencySymbol,
  CURRENCY_SUBUNIT_MAP,
} from './utils/currency';
export { generateReference } from './utils/reference';
export { verifyTransaction } from './utils/api';

// Constants
export {
  PAYSTACK_BASE_URL,
  SUPPORTED_CURRENCIES,
  SUPPORTED_CHANNELS,
  CURRENCY_LABELS,
} from './constants';
