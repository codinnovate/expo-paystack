import { createContext } from 'react';
import type { PaystackContextValue } from '../types';

/**
 * Internal React context holding the Paystack public key and the function used
 * to open the provider-owned checkout modal. Defined in its own module so both
 * the provider and the checkout component can import it without a circular
 * dependency.
 */
export const PaystackContext = createContext<PaystackContextValue | null>(null);
