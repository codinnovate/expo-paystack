# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-28

### Added

- Initial release of `expo-paystack`.
- `PaystackProvider` for app-wide configuration and provider-owned checkout.
- `usePaystack()` hook with `initializePayment()` and `isLoading`.
- `PaystackCheckout` standalone component (works with or without the provider).
- WebView-based checkout using Paystack Inline JS v2, with `postMessage`
  lifecycle events and a redirect-URL fallback.
- `access_code` flow support for backend-initialized transactions.
- Currency utilities: `formatAmount`, `toSubunit`, `getCurrencySymbol`,
  `CURRENCY_SUBUNIT_MAP`.
- `generateReference()` using `expo-crypto`.
- `verifyTransaction()` server-side verification helper.
- Full TypeScript types for all public APIs.
- New Architecture (Fabric / TurboModules) compatible.
