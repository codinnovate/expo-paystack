import { PAYSTACK_INLINE_JS_URL } from '../constants';

/** Parameters accepted by {@link generatePaystackHTML}. */
export interface GeneratePaystackHTMLParams {
  publicKey: string;
  email: string;
  amount: number;
  currency?: string;
  reference: string;
  channels?: string[];
  label?: string;
  plan?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  subaccount?: string;
  transactionCharge?: number;
  bearer?: string;
  accessCode?: string;
  /** Color of the in-page loading indicator. */
  activityIndicatorColor?: string;
}

/**
 * Pattern matching characters that are unsafe to inline inside a `<script>`
 * tag: HTML-significant characters (`<`, `>`, `&`) and the Unicode line and
 * paragraph separators (U+2028 / U+2029), which are valid in JSON but break
 * JavaScript string literals.
 */
const UNSAFE_INLINE_PATTERN = new RegExp(
  '[<>&' + String.fromCharCode(0x2028) + String.fromCharCode(0x2029) + ']',
  'g'
);

/**
 * Safely serializes a value to a JSON string for inlining inside a `<script>`
 * tag, escaping characters that could prematurely close the script element,
 * be interpreted as HTML, or break a JavaScript string literal.
 */
function toSafeJSON(value: unknown): string {
  return JSON.stringify(value).replace(UNSAFE_INLINE_PATTERN, (char) => {
    switch (char.charCodeAt(0)) {
      case 0x3c:
        return '\\u003c';
      case 0x3e:
        return '\\u003e';
      case 0x26:
        return '\\u0026';
      case 0x2028:
        return '\\u2028';
      case 0x2029:
        return '\\u2029';
      default:
        return char;
    }
  });
}

/**
 * Generates a self-contained HTML document that renders the Paystack Inline
 * checkout inside a WebView. The page loads the Paystack Inline JS (v2) from
 * the CDN, initializes the transaction on load, and posts lifecycle events
 * (`SUCCESS` / `CANCEL` / `ERROR`) back to React Native via
 * `window.ReactNativeWebView.postMessage()`.
 *
 * When an `accessCode` is provided, a backend-initialized transaction is
 * resumed via `resumeTransaction`; otherwise a new transaction is started via
 * `newTransaction`.
 *
 * @param params - The transaction parameters.
 * @returns A complete HTML document as a string.
 */
export function generatePaystackHTML(
  params: GeneratePaystackHTMLParams
): string {
  const spinnerColor = params.activityIndicatorColor ?? '#0BA4DB';

  // Build the configuration object passed to Paystack (callbacks are attached
  // separately in JS). `label` is injected both directly and as a custom field
  // so it surfaces in the checkout and on the dashboard.
  const metadata: Record<string, unknown> = { ...(params.metadata ?? {}) };
  if (params.label) {
    const existingCustomFields = Array.isArray(
      (metadata as { custom_fields?: unknown[] }).custom_fields
    )
      ? ((metadata as { custom_fields: unknown[] }).custom_fields as unknown[])
      : [];
    metadata.custom_fields = [
      ...existingCustomFields,
      {
        display_name: 'Label',
        variable_name: 'label',
        value: params.label,
      },
    ];
  }

  const config: Record<string, unknown> = {
    key: params.publicKey,
    email: params.email,
    amount: params.amount,
    reference: params.reference,
  };
  if (params.currency) config.currency = params.currency;
  if (params.channels && params.channels.length > 0) {
    config.channels = params.channels;
  }
  if (params.label) config.label = params.label;
  if (params.plan) config.plan = params.plan;
  if (typeof params.quantity === 'number') config.quantity = params.quantity;
  if (Object.keys(metadata).length > 0) config.metadata = metadata;
  if (params.subaccount) config.subaccount = params.subaccount;
  if (typeof params.transactionCharge === 'number') {
    config.transaction_charge = params.transactionCharge;
  }
  if (params.bearer) config.bearer = params.bearer;

  const configJSON = toSafeJSON(config);
  const referenceJSON = toSafeJSON(params.reference);
  const accessCodeJSON = toSafeJSON(params.accessCode ?? null);
  const inlineJsUrlJSON = toSafeJSON(PAYSTACK_INLINE_JS_URL);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Paystack Checkout</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #state {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-top-color: ${spinnerColor};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .message { margin-top: 16px; color: #444; font-size: 15px; }
    .error-title { color: #b00020; font-size: 17px; font-weight: 600; margin-bottom: 8px; }
    .retry {
      margin-top: 20px;
      padding: 12px 24px;
      background-color: ${spinnerColor};
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
    }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div id="state">
    <div id="loader">
      <div class="spinner"></div>
      <div class="message">Loading secure checkout&hellip;</div>
    </div>
    <div id="error" class="hidden">
      <div class="error-title">Unable to load checkout</div>
      <div class="message" id="error-message">Please check your connection and try again.</div>
      <button class="retry" onclick="window.location.reload()">Retry</button>
    </div>
  </div>

  <script>
    (function () {
      var CONFIG = ${configJSON};
      var REFERENCE = ${referenceJSON};
      var ACCESS_CODE = ${accessCodeJSON};
      var INLINE_JS_URL = ${inlineJsUrlJSON};
      var settled = false;

      function post(payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (e) {}
      }

      function showError(message) {
        var loader = document.getElementById('loader');
        var error = document.getElementById('error');
        var msg = document.getElementById('error-message');
        if (loader) loader.classList.add('hidden');
        if (error) error.classList.remove('hidden');
        if (msg && message) msg.textContent = message;
      }

      function handleSuccess(response) {
        if (settled) return;
        settled = true;
        response = response || {};
        post({
          type: 'SUCCESS',
          data: {
            reference: response.reference || REFERENCE,
            trans: String(response.trans || response.transaction || ''),
            status: response.status || 'success',
            message: response.message || 'Approved',
            trxref: response.trxref || response.reference || REFERENCE,
            redirecturl: response.redirecturl
          }
        });
      }

      function handleCancel() {
        if (settled) return;
        settled = true;
        post({ type: 'CANCEL' });
      }

      function handleError(error) {
        if (settled) return;
        settled = true;
        error = error || {};
        post({
          type: 'ERROR',
          data: {
            message: error.message || 'An error occurred during checkout.',
            code: error.code
          }
        });
      }

      function startCheckout() {
        if (typeof PaystackPop === 'undefined') {
          showError('Payment library failed to load.');
          handleError({ message: 'Paystack Inline JS failed to load.', code: 'CDN_LOAD_FAILED' });
          return;
        }
        try {
          var popup = new PaystackPop();
          var callbacks = {
            onSuccess: handleSuccess,
            onCancel: handleCancel,
            onError: handleError,
            onLoad: function () {}
          };
          if (ACCESS_CODE) {
            popup.resumeTransaction(ACCESS_CODE, callbacks);
          } else {
            var options = {};
            for (var k in CONFIG) {
              if (Object.prototype.hasOwnProperty.call(CONFIG, k)) options[k] = CONFIG[k];
            }
            options.onSuccess = handleSuccess;
            options.onCancel = handleCancel;
            options.onError = handleError;
            options.onLoad = function () {};
            // Legacy callback names, for resilience across inline.js versions.
            options.callback = handleSuccess;
            options.onClose = handleCancel;
            popup.newTransaction(options);
          }
        } catch (e) {
          showError(e && e.message ? e.message : 'Could not start checkout.');
          handleError({ message: e && e.message ? e.message : 'Could not start checkout.' });
        }
      }

      function loadScript() {
        var script = document.createElement('script');
        script.src = INLINE_JS_URL;
        script.async = true;
        script.onload = startCheckout;
        script.onerror = function () {
          showError('Could not reach the payment service.');
          handleError({ message: 'Failed to load Paystack Inline JS from CDN.', code: 'CDN_LOAD_FAILED' });
        };
        document.head.appendChild(script);
      }

      if (document.readyState === 'complete') {
        loadScript();
      } else {
        window.addEventListener('load', loadScript);
      }
    })();
  </script>
</body>
</html>`;
}
