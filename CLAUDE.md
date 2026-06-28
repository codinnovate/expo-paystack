# expo-paystack — Claude Code Reference

## What this package does
Paystack payments in Expo apps via WebView. Provider + hook architecture.

## Core pattern
```tsx
<PaystackProvider publicKey="pk_...">
  {/* always at app root */}
</PaystackProvider>

const { initializePayment } = usePaystack();
await initializePayment({ email, amount, currency, onSuccess, onCancel });
```

## Amount is ALWAYS in smallest unit
- NGN: kobo (₦5,000 = 500000)
- GHS: pesewas
- ZAR/KES/USD: cents

## Never do this
- Never put secret key in app code
- Never call verifyTransaction() from client side
- Never use `npm install` — always `npx expo install`

## Common mistakes to fix
- Missing PaystackProvider → throws clear error
- Amount in naira not kobo → multiply by 100
- react-native-webview in app.json plugins → remove it, it has no config plugin
