import * as Crypto from 'expo-crypto';

/**
 * Generates a unique, cryptographically random transaction reference.
 *
 * Format: `pstk_<timestamp>_<randomHex>`
 *
 * @example
 * const ref = await generateReference();
 * // => 'pstk_1719532800000_a3f8c2e1'
 *
 * @returns A promise resolving to the generated reference string.
 */
export async function generateReference(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(8);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
  return `pstk_${Date.now()}_${hex}`;
}
