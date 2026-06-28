import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LOG_PREFIX } from '../constants';
import type {
  InternalCheckoutState,
  PaystackContextValue,
  PaystackError,
  PaystackProviderProps,
  PaystackTransaction,
} from '../types';
import { validatePublicKey } from '../utils/validation';
import { PaystackCheckout } from '../components/PaystackCheckout';
import { PaystackContext } from './PaystackContext';

/**
 * Provides the Paystack public key to descendant components and owns the single
 * checkout modal used by the `usePaystack` hook. Wrap your app root with this:
 *
 * @example
 * <PaystackProvider publicKey="pk_test_xxxx">
 *   <App />
 * </PaystackProvider>
 */
export function PaystackProvider({
  publicKey,
  children,
}: PaystackProviderProps): React.JSX.Element {
  const [checkout, setCheckout] = useState<InternalCheckoutState | null>(null);

  // Validate the key once on mount (and whenever it changes) in development.
  useEffect(() => {
    if (!__DEV__) return;
    validatePublicKey(publicKey);
    if (publicKey.startsWith('pk_live_') && __DEV__) {
      console.warn(
        `${LOG_PREFIX} A live key (pk_live_...) is being used in a development ` +
          'build. Make sure this is intended.'
      );
    }
  }, [publicKey]);

  const openCheckout = useCallback<PaystackContextValue['openCheckout']>(
    (config) => {
      setCheckout(config);
    },
    []
  );

  const closeCheckout = useCallback((): void => {
    setCheckout(null);
  }, []);

  const contextValue = useMemo<PaystackContextValue>(
    () => ({ publicKey, openCheckout }),
    [publicKey, openCheckout]
  );

  const handleSuccess = useCallback(
    (transaction: PaystackTransaction): void => {
      const callback = checkout?.onSuccess;
      closeCheckout();
      callback?.(transaction);
    },
    [checkout, closeCheckout]
  );

  const handleCancel = useCallback((): void => {
    const callback = checkout?.onCancel;
    closeCheckout();
    callback?.();
  }, [checkout, closeCheckout]);

  const handleError = useCallback(
    (error: PaystackError): void => {
      const callback = checkout?.onError;
      closeCheckout();
      callback?.(error);
    },
    [checkout, closeCheckout]
  );

  return (
    <PaystackContext.Provider value={contextValue}>
      {children}
      {checkout ? (
        <PaystackCheckout
          visible
          publicKey={publicKey}
          email={checkout.email}
          amount={checkout.amount}
          reference={checkout.reference}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onError={handleError}
          {...(checkout.currency ? { currency: checkout.currency } : {})}
          {...(checkout.channels ? { channels: checkout.channels } : {})}
          {...(checkout.label ? { label: checkout.label } : {})}
          {...(checkout.plan ? { plan: checkout.plan } : {})}
          {...(typeof checkout.quantity === 'number'
            ? { quantity: checkout.quantity }
            : {})}
          {...(checkout.metadata ? { metadata: checkout.metadata } : {})}
          {...(checkout.subaccount ? { subaccount: checkout.subaccount } : {})}
          {...(typeof checkout.transactionCharge === 'number'
            ? { transactionCharge: checkout.transactionCharge }
            : {})}
          {...(checkout.bearer ? { bearer: checkout.bearer } : {})}
          {...(checkout.accessCode ? { accessCode: checkout.accessCode } : {})}
        />
      ) : null}
    </PaystackContext.Provider>
  );
}
