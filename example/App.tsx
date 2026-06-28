import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  PaystackProvider,
  usePaystack,
  PaystackCheckout,
  formatAmount,
} from 'expo-paystack';

// Replace with your own Paystack test public key.
const PAYSTACK_TEST_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

function PaymentDemoScreen(): React.JSX.Element {
  const { initializePayment, isLoading } = usePaystack();
  const [componentVisible, setComponentVisible] = useState(false);

  // Demo 1: Hook-based payment — NGN card / bank transfer.
  const payWithHook = async (): Promise<void> => {
    await initializePayment({
      email: 'john@example.com',
      amount: 500000, // ₦5,000.00
      currency: 'NGN',
      channels: ['card', 'bank_transfer'],
      metadata: { orderId: 'ORDER-001', product: 'Premium Plan' },
      onSuccess: (tx) =>
        Alert.alert('✅ Payment Successful', `Reference: ${tx.reference}`),
      onCancel: () => Alert.alert('❌ Cancelled', 'Payment was cancelled'),
      onError: (err) => Alert.alert('⚠️ Error', err.message),
    });
  };

  // Demo 2: GHS mobile money.
  const payMobileMoney = async (): Promise<void> => {
    await initializePayment({
      email: 'abena@example.com',
      amount: 100000, // GHS 1,000.00
      currency: 'GHS',
      channels: ['mobile_money'],
      onSuccess: (tx) => Alert.alert('✅ Success', tx.reference),
      onCancel: () => {},
    });
  };

  // Demo 3: Component-based checkout.
  const payWithComponent = (): void => setComponentVisible(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>expo-paystack Demo</Text>
        <Text style={styles.subtitle}>Try the payment flows below</Text>

        <Section title="Hook-based (usePaystack)">
          <PayButton
            label={`Pay ${formatAmount(500000, 'NGN')} (Card/Transfer)`}
            onPress={payWithHook}
            loading={isLoading}
            color="#0BA4DB"
          />
          <PayButton
            label={`Pay ${formatAmount(100000, 'GHS')} (Mobile Money)`}
            onPress={payMobileMoney}
            loading={isLoading}
            color="#00C48C"
          />
        </Section>

        <Section title="Component-based (PaystackCheckout)">
          <PayButton
            label={`Pay ${formatAmount(250000, 'NGN')} (Component)`}
            onPress={payWithComponent}
            color="#7C3AED"
          />
        </Section>

        <Section title="Currency Formatting">
          <Text style={styles.code}>
            formatAmount(500000, &apos;NGN&apos;) → {formatAmount(500000, 'NGN')}
          </Text>
          <Text style={styles.code}>
            formatAmount(100000, &apos;GHS&apos;) → {formatAmount(100000, 'GHS')}
          </Text>
          <Text style={styles.code}>
            formatAmount(9900, &apos;ZAR&apos;) → {formatAmount(9900, 'ZAR')}
          </Text>
        </Section>
      </ScrollView>

      <PaystackCheckout
        visible={componentVisible}
        email="jane@example.com"
        amount={250000}
        currency="NGN"
        label="Order #5678"
        onSuccess={(tx) => {
          setComponentVisible(false);
          Alert.alert('✅ Paid!', `Reference: ${tx.reference}`);
        }}
        onCancel={() => setComponentVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <PaystackProvider publicKey={PAYSTACK_TEST_KEY}>
        <PaymentDemoScreen />
      </PaystackProvider>
    </SafeAreaProvider>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

interface PayButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  color: string;
}

function PayButton({
  label,
  onPress,
  loading = false,
  color,
}: PayButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionBody: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#333',
  },
});
