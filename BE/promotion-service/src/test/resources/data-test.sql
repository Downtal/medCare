-- Insert vouchers for testing
INSERT INTO vouchers (id, code, title, description, discount_type, discount_value, min_order_value, max_discount, start_at, end_at, usage_limit, limit_per_user, used_count, is_active, exclude_prescription_drugs, created_at, updated_at) 
VALUES (1, 'WELCOME10', 'Welcome 10%', '10% off for new users', 'PERCENT', 10.00, 50000.00, 20000.00, '2024-01-01 00:00:00', '2030-12-31 23:59:59', 100, 1, 0, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO vouchers (id, code, title, description, discount_type, discount_value, min_order_value, max_discount, start_at, end_at, usage_limit, limit_per_user, used_count, is_active, exclude_prescription_drugs, created_at, updated_at)
VALUES (2, 'FIXED50', 'Fixed 50k', '50k off', 'FIXED', 50000.00, 200000.00, 50000.00, '2024-01-01 00:00:00', '2030-12-31 23:59:59', 50, 1, 0, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
