<div align="center">

<h1>💳 expo-paystack</h1>

<p><strong>The easiest way to accept Paystack payments in your Expo app.</strong></p>

<p><em>Card · Bank transfer · USSD · QR · Mobile money — built for Expo &amp; the New Architecture.</em></p>

[![npm version](https://img.shields.io/npm/v/expo-paystack.svg)](https://www.npmjs.com/package/expo-paystack)
[![license](https://img.shields.io/npm/l/expo-paystack.svg)](./LICENSE)
[![platform - ios](https://img.shields.io/badge/platform-iOS-blue.svg)](#)
[![platform - android](https://img.shields.io/badge/platform-Android-green.svg)](#)
[![types](https://img.shields.io/badge/types-included-blueviolet.svg)](#typescript)

</div>

---

`expo-paystack` lets you accept **card, bank transfer, USSD, QR, mobile money,
and more** through [Paystack](https://paystack.com) — Africa's leading payment
infrastructure — in your Expo app, with a clean hook-based API, first-class
TypeScript, and verified support for the **New Architecture**.

```tsx
const { initializePayment } = usePaystack();

await initializePayment({
  email: 'customer@example.com',
  amount: 500000, // ₦5,000.00 in kobo
  onSuccess: (tx) => console.log('Paid!', tx.reference),
  onCancel: () => console.log('Cancelled'),
});
```

---

## Why expo-paystack?

There are already Paystack packages for React Native — so why another one?

Because every existing option is a **React Native package that happens to
support Expo**. `expo-paystack` is an **Expo package** — built, tested, and
optimized for the Expo SDK and the New Architecture from the ground up.

> The existing packages are React Native packages that support Expo.
> **expo-paystack is an Expo package** — built, tested, and optimized for the
> Expo SDK and the New Architecture.

| | `react-native-paystack-webview` (market leader) | Native SDK wrappers (`react-native-paystack`) | **expo-paystack** |
|---|:---:|:---:|:---:|
| Works in Expo managed workflow | ⚠️ With caveats | ❌ | ✅ |
| New Architecture (SDK 54+, RN 0.81+) | ❌ Open iOS white‑screen bug¹ | ❌ | ✅ |
| Named & built for Expo | ❌ | ❌ | ✅ |
| Uses the Expo toolchain (`expo-crypto`) | ❌ | ❌ | ✅ |
| Strict TypeScript, zero `any` | ❌ | ❌ | ✅ |
| Currency helpers | ❌ | ❌ | ✅ |
| Clean `initializePayment()` API | ❌ `popup.checkout()` | ❌ | ✅ |
| `access_code` flow as a first‑class API | ❌ Buried in docs | ❌ | ✅ |

<sub>¹ The market leader has an open issue where iOS TestFlight builds on Expo
SDK 53+ render a blank screen once the New Architecture became the default.
Because the New Architecture is permanent from RN 0.82 onward, this matters for
every future Expo app.</sub>

This comparison is meant to be factual, not disparaging — those projects paved
the way and remain useful. `expo-paystack` simply takes a different, Expo-first
approach.

---

## Installation

```bash
npx expo install expo-paystack react-native-webview
```

`react-native-webview` is a peer dependency. It is autolinked, so it does **not**
need a config-plugin entry — just make sure the New Architecture is enabled in
your `app.json` (or `app.config.js`):

```json
{
  "expo": {
    "newArchEnabled": true
  }
}
```

> **Note:** Do not add `"react-native-webview"` to your `plugins` array.
> It does not export an Expo config plugin, and listing it there will make
> `expo run:ios` / `run:android` fail with a `PluginError`.

Then create a development build (the WebView requires native code, so it does
**not** run in Expo Go on its own — use `npx expo run:ios` / `run:android` or an
EAS build):

```bash
npx expo prebuild
npx expo run:ios   # or: npx expo run:android
```

> `expo-crypto` is installed automatically as a dependency and is used to
> generate cryptographically random transaction references.

---

## Quick Start

```tsx
import { PaystackProvider, usePaystack } from 'expo-paystack';
import { Button } from 'react-native';

function PayButton() {
  const { initializePayment, isLoading } = usePaystack();

  return (
    <Button
      title="Pay ₦5,000"
      disabled={isLoading}
      onPress={() =>
        initializePayment({
          email: 'customer@example.com',
          amount: 500000, // in kobo
          currency: 'NGN',
          onSuccess: (tx) => console.log('Success:', tx.reference),
          onCancel: () => console.log('Cancelled'),
        })
      }
    />
  );
}

export default function App() {
  return (
    <PaystackProvider publicKey="pk_test_xxxxxxxxxxxxxxxx">
      <PayButton />
    </PaystackProvider>
  );
}
```

---

## Usage Patterns

### 1. Provider (required for the hook)

Wrap your app once at the root:

```tsx
<PaystackProvider publicKey="pk_test_xxxxxxxxxxxxxxxx">
  <App />
</PaystackProvider>
```

### 2. `usePaystack()` hook (recommended)

The hook returns `initializePayment` and `isLoading`. Calling
`initializePayment` opens a checkout modal that the provider renders for you —
you never have to mount a component yourself.

```tsx
const { initializePayment, isLoading } = usePaystack();
```

### 3. `<PaystackCheckout />` component

For a JSX-driven flow, or to use the package **without** a provider (pass a
`publicKey` prop directly):

```tsx
const [visible, setVisible] = useState(false);

<PaystackCheckout
  visible={visible}
  publicKey="pk_test_xxxxxxxx"
  email="user@example.com"
  amount={500000}
  currency="NGN"
  onSuccess={(tx) => {
    setVisible(false);
    console.log('Paid!', tx);
  }}
  onCancel={() => setVisible(false)}
/>
```

---

## Payment Flow

```
   ┌──────────┐   (optional)   ┌──────────┐        ┌──────────────┐
   │  Your    │ ─ initialize ─▶│  Your    │ ─────▶ │ Paystack API │
   │  App     │  (access_code) │  Backend │        └──────┬───────┘
   └────┬─────┘                └──────────┘               │
        │  initializePayment({ email, amount, ... })      │
        ▼                                                  │
   ┌──────────────────────┐    Paystack Inline JS (v2)     │
   │  expo-paystack        │◀──────────────────────────────┘
   │  WebView checkout     │
   └────┬─────────────────┘
        │ onSuccess(transaction) / onCancel() / onError()
        ▼
   ┌──────────┐   verify reference (server-side)   ┌──────────────┐
   │  Your    │ ─────────────────────────────────▶ │ Paystack API │
   │  Backend │   verifyTransaction(ref, secret)   └──────────────┘
   └──────────┘
```

The frontend should **always** treat `onSuccess` as "the user finished the
flow" — confirm the real status by verifying the reference on your backend.

---

## API Reference

### `<PaystackProvider>`

| Prop | Type | Required | Description |
|---|---|:---:|---|
| `publicKey` | `string` | ✅ | Your Paystack public key (`pk_test_…` / `pk_live_…`). |
| `children` | `React.ReactNode` | ✅ | Your app tree. |

### `usePaystack()`

Returns:

| Field | Type | Description |
|---|---|---|
| `initializePayment` | `(config) => Promise<void>` | Opens the checkout. |
| `isLoading` | `boolean` | `true` while a payment is being prepared. |

### `initializePayment(config)` / `<PaystackCheckout>` props

| Field | Type | Required | Description |
|---|---|:---:|---|
| `email` | `string` | ✅ | Customer email. |
| `amount` | `number` | ✅ | Amount in the **smallest** currency unit (kobo, pesewa, cents). |
| `currency` | `PaystackCurrency` | | `NGN` (default), `GHS`, `ZAR`, `KES`, `USD`, `XOF`. |
| `reference` | `string` | | Auto-generated if omitted. |
| `channels` | `PaystackChannel[]` | | Restrict the channels shown. |
| `label` | `string` | | Display label (e.g. `"Order #1234"`). |
| `plan` | `string` | | Paystack plan code (subscriptions). |
| `quantity` | `number` | | Quantity for plan-based charges. |
| `metadata` | `Record<string, unknown>` | | Custom metadata. |
| `subaccount` | `string` | | Subaccount code for split payments. |
| `transactionCharge` | `number` | | Flat fee (smallest unit) for the subaccount. |
| `bearer` | `'account' \| 'subaccount'` | | Who bears the transaction charge. |
| `accessCode` | `string` | | Resume a backend-initialized transaction. |
| `onSuccess` | `(tx: PaystackTransaction) => void` | ✅ | Success callback. |
| `onCancel` | `() => void` | ✅ | Cancel callback. |
| `onError` | `(err: PaystackError) => void` | | Error callback. |

Additional `<PaystackCheckout>`-only props: `visible` (required), `publicKey`
(overrides provider), `animationType` (`'slide' | 'fade' | 'none'`),
`activityIndicatorColor`, `closeOnBackdropPress`.

### Utilities

| Function | Signature | Description |
|---|---|---|
| `formatAmount` | `(amount, currency) => string` | `formatAmount(500000, 'NGN')` → `₦5,000.00` |
| `toSubunit` | `(amount, currency) => number` | `toSubunit(5000, 'NGN')` → `500000` |
| `getCurrencySymbol` | `(currency) => string` | `getCurrencySymbol('NGN')` → `₦` |
| `generateReference` | `() => Promise<string>` | Crypto-random reference. |
| `verifyTransaction` | `(reference, secretKey) => Promise<PaystackVerifyResponse>` | **Server-side only.** |

---

## The `access_code` (backend-first) flow

For maximum security, initialize the transaction on your backend and pass the
returned `access_code` to the app:

```tsx
// 1. Your backend calls POST https://api.paystack.co/transaction/initialize
//    and returns { access_code, reference }.
const { access_code, reference } = await fetch('/api/checkout').then((r) => r.json());

// 2. The app resumes that exact transaction:
await initializePayment({
  email: 'customer@example.com',
  amount: 500000,
  accessCode: access_code,
  reference,
  onSuccess: (tx) => {/* verify on backend */},
  onCancel: () => {},
});
```

---

## Supported Channels

| Channel | Countries (typical) |
|---|---|
| `card` | NG, GH, ZA, KE, CI |
| `bank` / `bank_transfer` | NG |
| `ussd` | NG |
| `qr` | NG |
| `mobile_money` | GH, KE |
| `eft` | ZA |
| `apple_pay` | Supported regions |
| `capitec_pay` | ZA |
| `payattitude` | NG |

> Channel availability ultimately depends on your Paystack account, country, and
> the currency of the transaction.

## Supported Currencies

| Code | Currency | Symbol | Smallest unit |
|---|---|:---:|---|
| `NGN` | Nigerian Naira | ₦ | kobo (×100) |
| `GHS` | Ghanaian Cedi | ₵ | pesewa (×100) |
| `ZAR` | South African Rand | R | cent (×100) |
| `KES` | Kenyan Shilling | KSh | cent (×100) |
| `USD` | US Dollar | $ | cent (×100) |
| `XOF` | West African CFA Franc | CFA | ×100 |

---

## Security Best Practices

- **Never put your secret key (`sk_…`) in app code.** It grants full access to
  your Paystack account. The app only ever uses the **public** key.
- **Verify every payment on your backend** with `verifyTransaction(reference,
  secretKey)` (or a direct call to the Paystack verify endpoint) before
  fulfilling an order. Client-side `onSuccess` is not proof of payment.
- Prefer the **`access_code` flow**: initialize transactions on your backend so
  the amount and metadata cannot be tampered with on the device.

```ts
// Server-side only (e.g. an Expo API Route or your own backend):
import { verifyTransaction } from 'expo-paystack';

const result = await verifyTransaction(reference, process.env.PAYSTACK_SECRET_KEY!);
if (result.data.status === 'success') {
  // fulfill the order
}
```

---

## TypeScript

Types are **bundled** — there is no `@types/expo-paystack` to install. Every
public API, including `PaystackTransaction`, `PaystackPaymentConfig`,
`PaystackVerifyResponse`, and the currency/channel unions, is fully typed.

---

## FAQ

**The WebView shows a blank/loading screen forever.**
Ensure `react-native-webview` is installed and that you are running a
development build (not plain Expo Go). Do **not** add it to `plugins` — it is
autolinked and has no config plugin.

**"Reference already used / duplicate reference" error.**
Each transaction needs a unique reference. Omit `reference` to let the package
generate one, or always generate a fresh one per attempt.

**Does this work with the New Architecture?**
Yes. The package uses only Expo SDK packages and `react-native-webview` — no
legacy bridge / `NativeModules` usage — and is verified against the New
Architecture.

**Can I use it without `PaystackProvider`?**
Yes — use `<PaystackCheckout>` directly with a `publicKey` prop. The provider is
only required for the `usePaystack()` hook.

**Which Expo SDK versions are supported?**
Expo SDK 54 and newer (React Native 0.81+, React 19+).

---

## Example App

A complete demo lives in [`example/`](./example) covering the hook flow,
component flow, mobile money, and the currency helpers. Add your own
`pk_test_…` key in `example/App.tsx` and run it with `npx expo run:ios`.

---

## Contributing

Contributions are welcome! To get started:

```bash
git clone https://github.com/codinnovate/expo-paystack.git
cd expo-paystack
npm install
npm run build       # build with react-native-builder-bob
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

Please [open an issue](https://github.com/codinnovate/expo-paystack/issues) to
discuss substantial changes before sending a PR, and keep the strict-TypeScript /
zero-`any` bar intact.

---

## Support

- 🐛 **Bugs & feature requests:** [GitHub Issues](https://github.com/codinnovate/expo-paystack/issues)
- 📦 **Source & releases:** [github.com/codinnovate/expo-paystack](https://github.com/codinnovate/expo-paystack)
- ✉️ **Contact the maintainer:** [adeyemis710@gmail.com](mailto:adeyemis710@gmail.com)

---

## License

[MIT](./LICENSE) © [Sam Adeyemi](https://github.com/codinnovate)
