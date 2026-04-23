-- Insert a pending payment for testing IPN
INSERT INTO payments (id, order_id, provider, amount, status, transaction_id, created_at, updated_at)
VALUES (1, 1001, 'VNPAY', 100000.00, 'PENDING', 'ORD1001-TEST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
