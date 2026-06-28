import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaystackContext } from '../context/PaystackContext';
import { LOG_PREFIX } from '../constants';
import type {
  PaystackCheckoutProps,
  PaystackTransaction,
} from '../types';
import { generatePaystackHTML } from '../utils/html';
import { generateReference } from '../utils/reference';
import {
  validatePaymentConfig,
  validatePublicKey,
} from '../utils/validation';
import { PaystackWebView } from './PaystackWebView';

/**
 * A self-contained checkout modal that renders the Paystack popup inside a
 * WebView. Can be used standalone (pass a `publicKey` prop) or together with
 * `PaystackProvider` (it will read the key from context).
 *
 * @example
 * <PaystackCheckout
 *   visible={visible}
 *   email="user@example.com"
 *   amount={500000}
 *   currency="NGN"
 *   onSuccess={(tx) => setVisible(false)}
 *   onCancel={() => setVisible(false)}
 * />
 */
export function PaystackCheckout({
  visible,
  publicKey: publicKeyProp,
  email,
  amount,
  currency = 'NGN',
  reference: referenceProp,
  channels,
  label,
  plan,
  quantity,
  metadata,
  subaccount,
  transactionCharge,
  bearer,
  accessCode,
  onSuccess,
  onCancel,
  onError,
  animationType = 'slide',
  activityIndicatorColor = '#0BA4DB',
}: PaystackCheckoutProps): React.JSX.Element {
  const context = useContext(PaystackContext);
  const publicKey = publicKeyProp ?? context?.publicKey ?? '';

  const [reference, setReference] = useState<string | null>(
    referenceProp ?? null
  );
  const hasValidatedRef = useRef(false);

  // Resolve a reference when the modal opens (auto-generate if none provided).
  useEffect(() => {
    if (!visible) {
      setReference(referenceProp ?? null);
      hasValidatedRef.current = false;
      return;
    }
    if (referenceProp) {
      setReference(referenceProp);
      return;
    }
    let cancelled = false;
    void generateReference().then((generated) => {
      if (!cancelled) setReference(generated);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, referenceProp]);

  // Development-only validation, run once per open.
  useEffect(() => {
    if (!visible || hasValidatedRef.current) return;
    hasValidatedRef.current = true;
    validatePublicKey(publicKey);
    validatePaymentConfig({
      email,
      amount,
      currency,
      onSuccess,
      onCancel,
      ...(channels ? { channels } : {}),
    });
    if (!publicKey && __DEV__) {
      console.warn(
        `${LOG_PREFIX} PaystackCheckout requires a publicKey, either via the ` +
          'prop or a parent <PaystackProvider>.'
      );
    }
  }, [
    visible,
    publicKey,
    email,
    amount,
    currency,
    channels,
    onSuccess,
    onCancel,
  ]);

  const html = useMemo<string | null>(() => {
    if (!reference || !publicKey) return null;
    return generatePaystackHTML({
      publicKey,
      email,
      amount,
      currency,
      reference,
      activityIndicatorColor,
      ...(channels ? { channels } : {}),
      ...(label ? { label } : {}),
      ...(plan ? { plan } : {}),
      ...(typeof quantity === 'number' ? { quantity } : {}),
      ...(metadata ? { metadata } : {}),
      ...(subaccount ? { subaccount } : {}),
      ...(typeof transactionCharge === 'number' ? { transactionCharge } : {}),
      ...(bearer ? { bearer } : {}),
      ...(accessCode ? { accessCode } : {}),
    });
  }, [
    reference,
    publicKey,
    email,
    amount,
    currency,
    activityIndicatorColor,
    channels,
    label,
    plan,
    quantity,
    metadata,
    subaccount,
    transactionCharge,
    bearer,
    accessCode,
  ]);

  const handleSuccess = (transaction: PaystackTransaction): void => {
    onSuccess(transaction);
  };

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={false}
      onRequestClose={onCancel}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Close checkout"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeIcon}>{'✕'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          {html ? (
            <PaystackWebView
              html={html}
              onSuccess={handleSuccess}
              onCancel={onCancel}
              {...(onError ? { onError } : {})}
              activityIndicatorColor={activityIndicatorColor}
            />
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e2e2',
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  body: {
    flex: 1,
  },
});
