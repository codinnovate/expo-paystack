import { useCallback, useState } from 'react';
import type { PaystackPaymentConfig, UsePaystackReturn } from '../types';
import { generateReference } from '../utils/reference';
import { validatePaymentConfig } from '../utils/validation';
import { usePaystackContext } from './usePaystackContext';

/**
 * Primary hook for initiating Paystack payments. Must be used within a
 * `<PaystackProvider>`. Calling `initializePayment` opens the provider-owned
 * checkout modal.
 *
 * @example
 * const { initializePayment, isLoading } = usePaystack();
 * await initializePayment({
 *   email: 'user@example.com',
 *   amount: 500000,
 *   currency: 'NGN',
 *   onSuccess: (tx) => console.log(tx.reference),
 *   onCancel: () => {},
 * });
 */
export function usePaystack(): UsePaystackReturn {
  const { openCheckout } = usePaystackContext();
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = useCallback(
    async (config: PaystackPaymentConfig): Promise<void> => {
      setIsLoading(true);
      try {
        validatePaymentConfig(config);
        const reference = config.reference ?? (await generateReference());
        openCheckout({ ...config, reference });
      } finally {
        setIsLoading(false);
      }
    },
    [openCheckout]
  );

  return { initializePayment, isLoading };
}
