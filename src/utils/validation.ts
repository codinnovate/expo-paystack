import {
  LOG_PREFIX,
  SUPPORTED_CHANNELS,
  SUPPORTED_CURRENCIES,
} from '../constants';
import type { PaystackPaymentConfig } from '../types';

/** Logs a development-only warning prefixed with the package name. */
function warn(message: string): void {
  if (__DEV__) {
    console.warn(`${LOG_PREFIX} ${message}`);
  }
}

/**
 * Validates that a string looks like a Paystack public key. In development,
 * warns when the format is unexpected. Returns whether it is well-formed.
 */
export function validatePublicKey(publicKey: string | undefined): boolean {
  if (!publicKey) {
    warn('No publicKey was provided.');
    return false;
  }
  if (!publicKey.startsWith('pk_test_') && !publicKey.startsWith('pk_live_')) {
    warn(
      `publicKey "${publicKey.slice(
        0,
        8
      )}…" does not look like a Paystack public key (expected "pk_test_" or "pk_live_").`
    );
    return false;
  }
  return true;
}

/**
 * Validates a payment configuration. Emits development-only warnings for common
 * mistakes (bad email, non-positive amount, unsupported currency/channels).
 * Returns whether the required fields are usable.
 */
export function validatePaymentConfig(config: PaystackPaymentConfig): boolean {
  let valid = true;

  if (!config.email || !config.email.includes('@')) {
    warn(`A valid email is required. Received: "${config.email}".`);
    valid = false;
  }

  if (
    typeof config.amount !== 'number' ||
    !Number.isInteger(config.amount) ||
    config.amount <= 0
  ) {
    warn(
      `amount must be a positive integer in the smallest currency unit. Received: ${String(
        config.amount
      )}.`
    );
    valid = false;
  }

  if (config.currency && !SUPPORTED_CURRENCIES.includes(config.currency)) {
    warn(
      `Unsupported currency "${config.currency}". Supported: ${SUPPORTED_CURRENCIES.join(
        ', '
      )}.`
    );
  }

  if (config.channels) {
    const invalid = config.channels.filter(
      (channel) => !SUPPORTED_CHANNELS.includes(channel)
    );
    if (invalid.length > 0) {
      warn(`Unsupported channel(s): ${invalid.join(', ')}.`);
    }
  }

  return valid;
}
