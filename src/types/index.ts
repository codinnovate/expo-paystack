/**
 * expo-paystack — Type definitions
 *
 * All public and internal types for the package live in this file and are
 * re-exported from the package root. The package is strict TypeScript with
 * zero `any`; unknown data is typed as `unknown` and narrowed with guards.
 */

/** Supported currencies on Paystack. */
export type PaystackCurrency = 'NGN' | 'GHS' | 'ZAR' | 'KES' | 'USD' | 'XOF';

/** Payment channels available on Paystack checkout. */
export type PaystackChannel =
  | 'card'
  | 'bank'
  | 'ussd'
  | 'qr'
  | 'mobile_money'
  | 'bank_transfer'
  | 'eft'
  | 'apple_pay'
  | 'capitec_pay'
  | 'payattitude';

/** Who bears the transaction charge when using a subaccount. */
export type PaystackBearer = 'account' | 'subaccount';

/** Transaction status returned by Paystack. */
export type PaystackTransactionStatus =
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'pending';

/** The transaction object returned to the client on a completed payment. */
export interface PaystackTransaction {
  /** The unique transaction reference. */
  reference: string;
  /** Transaction ID (numeric string). */
  trans: string;
  /** The transaction status reported by the Paystack popup. */
  status: PaystackTransactionStatus;
  /** Human-readable message from Paystack. */
  message: string;
  /** Transaction reference echoed back by Paystack (same as `reference`). */
  trxref: string;
  /** The redirect URL, if one was configured. */
  redirecturl?: string;
}

/** Error object surfaced to `onError` callbacks. */
export interface PaystackError {
  /** Human-readable description of what went wrong. */
  message: string;
  /** Optional machine-readable error code. */
  code?: string;
}

/**
 * Response shape from the Paystack "verify transaction" REST endpoint.
 *
 * @see https://paystack.com/docs/api/transaction/#verify
 */
export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: PaystackTransactionStatus;
    reference: string;
    receipt_number: string | null;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: PaystackChannel;
    currency: PaystackCurrency;
    ip_address: string;
    metadata: Record<string, unknown>;
    log: {
      start_time: number;
      time_spent: number;
      attempts: number;
      errors: number;
      success: boolean;
      mobile: boolean;
      input: unknown[];
      history: Array<{
        type: string;
        message: string;
        time: number;
      }>;
    };
    fees: number | null;
    fees_split: unknown | null;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
      receiver_bank_account_number: string | null;
      receiver_bank: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: unknown;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: string | null;
    split: Record<string, unknown>;
    order_id: string | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: unknown | null;
    source: unknown | null;
    fees_breakdown: unknown | null;
    transaction_date: string;
    plan_object: Record<string, unknown>;
    subaccount: Record<string, unknown>;
  };
}

/**
 * Configuration accepted by `initializePayment` (from the `usePaystack` hook).
 */
export interface PaystackPaymentConfig {
  // --- Required ---
  /** Customer's email address. */
  email: string;
  /** Amount in the smallest currency unit (kobo, pesewa, cents). */
  amount: number;

  // --- Optional: core ---
  /** Transaction currency. Defaults to `NGN`. */
  currency?: PaystackCurrency;
  /** Transaction reference. Auto-generated if not provided. */
  reference?: string;
  /** Restrict the payment channels shown to the customer. */
  channels?: PaystackChannel[];

  // --- Optional: metadata & customization ---
  /** Display label in the checkout (e.g. "Order #1234"). */
  label?: string;
  /** Paystack plan code for subscriptions. */
  plan?: string;
  /** Quantity, for plan-based charges. */
  quantity?: number;
  /** Custom metadata attached to the transaction. */
  metadata?: Record<string, unknown>;
  /** Subaccount code, for split payments. */
  subaccount?: string;
  /** Flat fee (in the smallest unit) to charge the subaccount. */
  transactionCharge?: number;
  /** Who bears the transaction charge for a subaccount. */
  bearer?: PaystackBearer;

  // --- Optional: access_code flow (backend-initialized transactions) ---
  /** Access code from a backend-initialized transaction. */
  accessCode?: string;

  // --- Callbacks ---
  /** Called when the payment completes successfully. */
  onSuccess: (transaction: PaystackTransaction) => void;
  /** Called when the customer cancels the payment. */
  onCancel: () => void;
  /** Called when an error occurs during checkout. */
  onError?: (error: PaystackError) => void;
}

/** Props for the `PaystackProvider` component. */
export interface PaystackProviderProps {
  /** Your Paystack public key (`pk_test_...` or `pk_live_...`). */
  publicKey: string;
  /** Your application tree. */
  children: React.ReactNode;
}

/** Props for the standalone `PaystackCheckout` component. */
export interface PaystackCheckoutProps
  extends Omit<PaystackPaymentConfig, 'onSuccess'> {
  /** Whether the checkout modal is visible. */
  visible: boolean;
  /** Overrides the provider's public key when provided. */
  publicKey?: string;
  /** Customer's email address. */
  email: string;
  /** Amount in the smallest currency unit. */
  amount: number;
  /** Called when the payment completes successfully. */
  onSuccess: (transaction: PaystackTransaction) => void;
  /** Called when the customer cancels the payment. */
  onCancel: () => void;
  /** Called when an error occurs during checkout. */
  onError?: (error: PaystackError) => void;

  // --- Modal styling ---
  /** Modal presentation animation. Defaults to `slide`. */
  animationType?: 'slide' | 'fade' | 'none';
  /** Color of the loading spinner. */
  activityIndicatorColor?: string;
  /** Whether tapping the backdrop dismisses the checkout. */
  closeOnBackdropPress?: boolean;
}

/** Return value of the `usePaystack` hook. */
export interface UsePaystackReturn {
  /** Opens the Paystack checkout with the given configuration. */
  initializePayment: (config: PaystackPaymentConfig) => Promise<void>;
  /** Whether a payment is currently being prepared/initialized. */
  isLoading: boolean;
}

/** The value held by the internal Paystack context. */
export interface PaystackContextValue {
  /** The public key supplied to `PaystackProvider`. */
  publicKey: string;
  /** Opens the provider-owned checkout modal. Internal use. */
  openCheckout: (config: PaystackPaymentConfig & { reference: string }) => void;
}

/**
 * Internal state used by the provider to drive the checkout modal.
 * Not part of the public API.
 */
export interface InternalCheckoutState extends PaystackPaymentConfig {
  reference: string;
}
