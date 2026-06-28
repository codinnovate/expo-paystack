import { useContext } from 'react';
import { PaystackContext } from '../context/PaystackContext';
import { LOG_PREFIX } from '../constants';
import type { PaystackContextValue } from '../types';

/**
 * Returns the current Paystack context value.
 *
 * @throws If called outside of a `<PaystackProvider>`.
 */
export function usePaystackContext(): PaystackContextValue {
  const context = useContext(PaystackContext);
  if (!context) {
    throw new Error(
      `${LOG_PREFIX} usePaystack must be used inside a <PaystackProvider>. ` +
        'Wrap your app root with <PaystackProvider publicKey="pk_...">.'
    );
  }
  return context;
}
