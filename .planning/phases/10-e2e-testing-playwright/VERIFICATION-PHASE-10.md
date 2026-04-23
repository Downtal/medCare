# Phase 10 Verification: E2E Testing — Playwright

## Overview
This document summarizes the results of the End-to-End (E2E) testing phase for the MedCare application. Tests were conducted using Playwright to validate critical user journeys, specifically focusing on authentication and the checkout process.

## Test Environment
- **Frontend**: Next.js (running on http://127.0.0.1:3000)
- **Backend Mocking**: 
  - A custom Node.js mock server (`test/mock-server.mjs`) was used to handle server-side authentication calls from NextAuth.
  - Playwright's `page.route` was used for client-side API mocking (Address retrieval, Order submission).
- **Network**: All internal calls were routed to `127.0.0.1:8080` (Mock Server).

## Test Suites

### 1. Login Flow (`e2e/login.spec.ts`)
Validates that users can securely log in to the application.
- [x] **Validation errors**: Checks for appropriate error messages when fields are empty.
- [x] **Invalid credentials**: Ensures the system correctly handles 401 Unauthorized responses from the mock backend.
- [x] **Successful login**: Validates redirect to home page and session cookie establishment.
- [x] **Navigation**: Tests links to signup and other auth pages.

### 2. Checkout Flow (`e2e/checkout.spec.ts`)
Validates the purchasing journey from cart to order confirmation.
- [x] **State Initialization**: Mocks the cart state in `localStorage` before checkout.
- [x] **Authentication Check**: Ensures the checkout page is protected and requires login.
- [x] **Address Selection**: Validates that saved addresses are fetched and displayed correctly.
- [x] **Payment Selection**: Tests COD selection and persistence.
- [x] **Order Confirmation**: Validates successful order submission and redirect to the confirmation page.
- [x] **Validation**: Checks that the "Confirm Order" button is disabled if required information (address) is missing.

## Results
| Test File | Test Case | Status | Notes |
| :--- | :--- | :--- | :--- |
| login.spec.ts | Validation errors | PASSED | |
| login.spec.ts | Invalid credentials | PASSED | |
| login.spec.ts | Successful login | PASSED | |
| login.spec.ts | Navigation | PASSED | |
| checkout.spec.ts | COD Checkout Success | PASSED | Includes login and address mock |
| checkout.spec.ts | Missing Address Validation | PASSED | Checks disabled state |

## Critical Fixes Applied
1. **Middleware/Auth Conflict**: Resolved redirects to `/dang-nhap` by implementing a mock server that satisfies NextAuth's server-side requirements.
2. **Network Reliability**: Switched from `localhost` to `127.0.0.1` in all configurations to avoid DNS resolution delays and origin mismatch issues in Playwright.
3. **Deterministic Locators**: Used `.first()` and `nth=0` for locators matching multiple elements in complex UI components.
4. **Race Conditions**: Synchronized address mocking with page navigation to prevent `GlobalAuthGuard` from triggering sign-outs on unmocked 404/401 responses.

## Conclusion
Phase 10 is **COMPLETED**. The core user journeys are now covered by automated E2E tests, ensuring that future changes do not break the critical login or purchase paths.
