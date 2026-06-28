import { LOG_PREFIX, PAYSTACK_BASE_URL } from '../constants';
import type { PaystackVerifyResponse } from '../types';

/**
 * Verifies a Paystack transaction using the Paystack REST API.
 *
 * ⚠️ **SECURITY WARNING — SERVER-SIDE ONLY.**
 * This function requires your Paystack **secret key** (`sk_test_...` /
 * `sk_live_...`). Secret keys must **never** be embedded in client-side app
 * code, as they grant full access to your Paystack account. Call this only
 * from a trusted server environment (e.g. your backend, or an Expo API Route /
 * server-side function — never from a React component).
 *
 * @example
 * // In your backend / server route only:
 * const result = await verifyTransaction(reference, process.env.PAYSTACK_SECRET_KEY!);
 * if (result.data.status === 'success') {
 *   // fulfill the order
 * }
 *
 * @param reference - The transaction reference to verify.
 * @param secretKey - Your Paystack secret key. Server-side use only.
 * @returns A promise resolving to the verification response.
 * @throws If the network request fails or Paystack returns a non-OK status.
 */
export async function verifyTransaction(
  reference: string,
  secretKey: string
): Promise<PaystackVerifyResponse> {
  if (!reference) {
    throw new Error(`${LOG_PREFIX} verifyTransaction: a reference is required.`);
  }
  if (!secretKey) {
    throw new Error(
      `${LOG_PREFIX} verifyTransaction: a secret key is required (server-side only).`
    );
  }

  const url = `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(
    reference
  )}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `${LOG_PREFIX} verifyTransaction failed with HTTP ${response.status}.`
    );
  }

  return (await response.json()) as PaystackVerifyResponse;
}
