import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';
import type { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { LOG_PREFIX } from '../constants';
import type {
  PaystackError,
  PaystackTransaction,
  PaystackTransactionStatus,
} from '../types';

/** Props for the internal {@link PaystackWebView} component. */
export interface PaystackWebViewProps {
  /** The generated HTML content to render. */
  html: string;
  /** Called when the payment completes successfully. */
  onSuccess: (transaction: PaystackTransaction) => void;
  /** Called when the customer cancels the payment. */
  onCancel: () => void;
  /** Called when an error occurs during checkout. */
  onError?: (error: PaystackError) => void;
  /** Color of the loading spinner. */
  activityIndicatorColor?: string;
}

/** Shape of the messages posted from the in-WebView Paystack page. */
type WebViewMessage =
  | {
      type: 'SUCCESS';
      data: {
        reference: string;
        trans: string;
        status: PaystackTransactionStatus;
        message: string;
        trxref: string;
        redirecturl?: string;
      };
    }
  | { type: 'CANCEL' }
  | { type: 'ERROR'; data: { message: string; code?: string } };

function isWebViewMessage(value: unknown): value is WebViewMessage {
  if (typeof value !== 'object' || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return type === 'SUCCESS' || type === 'CANCEL' || type === 'ERROR';
}

/**
 * Extracts a transaction reference from a redirect URL, used as a fallback
 * when the in-page `postMessage` is unavailable.
 */
function extractReferenceFromUrl(url: string): string | null {
  const match = /[?&](?:reference|trxref)=([^&#]+)/.exec(url);
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Internal WebView wrapper that renders the Paystack checkout page, parses the
 * lifecycle messages it posts, and surfaces them as typed callbacks. Handles
 * loading and error states, the Android hardware back button, and a redirect
 * URL fallback for detecting completion.
 *
 * This component is not exported from the package root; it is composed by
 * {@link PaystackCheckout}.
 */
export function PaystackWebView({
  html,
  onSuccess,
  onCancel,
  onError,
  activityIndicatorColor = '#0BA4DB',
}: PaystackWebViewProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const settledRef = useRef(false);
  // `WebView` is declared as `WebView<P = undefined>`; instantiate the generic
  // with `object` so its props do not collapse to `never` in JSX.
  const webViewRef = useRef<WebView<object>>(null);

  const settle = useCallback((fn: () => void): void => {
    if (settledRef.current) return;
    settledRef.current = true;
    fn();
  }, []);

  // Intercept the Android hardware back button: treat it as a cancellation
  // rather than navigating within the WebView.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        settle(onCancel);
        return true;
      }
    );
    return () => subscription.remove();
  }, [onCancel, settle]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent): void => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!isWebViewMessage(parsed)) return;

      switch (parsed.type) {
        case 'SUCCESS':
          settle(() =>
            onSuccess({
              reference: parsed.data.reference,
              trans: parsed.data.trans,
              status: parsed.data.status,
              message: parsed.data.message,
              trxref: parsed.data.trxref,
              ...(parsed.data.redirecturl
                ? { redirecturl: parsed.data.redirecturl }
                : {}),
            })
          );
          break;
        case 'CANCEL':
          settle(onCancel);
          break;
        case 'ERROR':
          settle(() =>
            onError?.({
              message: parsed.data.message,
              ...(parsed.data.code ? { code: parsed.data.code } : {}),
            })
          );
          break;
      }
    },
    [onSuccess, onCancel, onError, settle]
  );

  // Fallback: detect a transaction reference in redirect URLs in case the
  // in-page postMessage did not fire.
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation): void => {
      const reference = extractReferenceFromUrl(navState.url);
      if (!reference) return;
      settle(() =>
        onSuccess({
          reference,
          trans: '',
          status: 'success',
          message: 'Approved',
          trxref: reference,
        })
      );
    },
    [onSuccess, settle]
  );

  const handleError = useCallback(
    (event: WebViewErrorEvent): void => {
      setHasError(true);
      setIsLoading(false);
      if (__DEV__) {
        console.warn(
          `${LOG_PREFIX} WebView failed to load: ${event.nativeEvent.description}`
        );
      }
    },
    []
  );

  const handleRetry = useCallback((): void => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  if (hasError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unable to load checkout</Text>
        <Text style={styles.errorMessage}>
          Please check your internet connection and try again.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: activityIndicatorColor }]}
          onPress={handleRetry}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView<object>
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={handleError}
        startInLoadingState={false}
        style={styles.webView}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={activityIndicatorColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#b00020',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
