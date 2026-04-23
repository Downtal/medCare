---
status: investigating
trigger: "VNPay payment redirect shows 'Sai chữ ký' (Invalid Signature) error."
created: 2026-04-23
updated: 2026-04-23
symptoms:
  expected: "Redirect to VNPay payment page successfully to enter card details."
  actual: "VNPay displays an error page with the message 'Sai chữ ký' (Invalid Signature)."
  error_messages: "Sai chữ ký"
  timeline: "Occurred immediately after implementing the VNPay redirect flow in the frontend."
  reproduction: "Select VNPay as payment method on the checkout page and click 'XÁC NHẬN ĐẶT HÀNG'."
---

# Current Focus
next_action: "Verify the fix with a real transaction."

# Evidence
- timestamp: 2026-04-23T04:52:55
  note: User provided screenshot showing VNPay error page with 'Sai chữ ký'.
- timestamp: 2026-04-23T04:58:00
  note: Identified encoding mismatch. Java's URLEncoder uses '+' for spaces, while VNPay 2.1.0 requires '%20'.
- timestamp: 2026-04-23T06:26:00
  note: Found critical discrepancy in PaymentService.java: the hash string was being built using raw values instead of URL-encoded values. Fixed by ensuring both hash data and query string use UTF-8 URL encoding with RFC 3986 (%20) compliance.

# Eliminated
- hypothesis: Incorrect parameter order. (Verified that Collections.sort() is used correctly).
- hypothesis: Missing mandatory parameters. (Verified against VNPay 2.1.0 spec).

# Resolution
root_cause: "Discrepancy between the data string used for hashing and the actual query string. The hash data used raw values, while the query string used encoded values. Additionally, inconsistent use of US_ASCII vs UTF-8 and '+' vs '%20' for spaces."
fix: "Synchronized the hashing logic to use the exact same URL-encoded values as the query string, using UTF-8 and replacing '+' with '%20'. Updated both PaymentService.java and VNPayUtil.java."
verification: "Generated URLs now follow the format: vnp_Params sorted alphabetically, values URL-encoded with %20, and HmacSHA512 calculated on the final query string."
files_changed:
  - "BE/payment-service/src/main/java/com/medcare/paymentservice/service/PaymentService.java"
  - "BE/payment-service/src/main/java/com/medcare/paymentservice/util/VNPayUtil.java"
