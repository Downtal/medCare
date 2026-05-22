-- Clear existing data
DELETE FROM order_items;
DELETE FROM orders;

-- Insert sample orders
INSERT INTO orders (id, user_id, order_code, status, order_type, total_price, shipping_fee, grand_total, payment_method, recipient_name, recipient_phone, recipient_address, city_id, district_id, ward_code, created_at, updated_at)
VALUES (1, 1, 'ORD-TEST-001', 'PENDING', 'OTC', 100000.00, 30000.00, 130000.00, 'COD', 'John Doe', '0123456789', '123 Test St', 201, 1491, '20308', '2026-04-23 00:00:00', '2026-04-23 00:00:00');

INSERT INTO orders (id, user_id, order_code, status, order_type, total_price, shipping_fee, grand_total, payment_method, recipient_name, recipient_phone, recipient_address, city_id, district_id, ward_code, created_at, updated_at)
VALUES (2, 1, 'ORD-TEST-002', 'PAID', 'OTC', 50000.00, 30000.00, 80000.00, 'VNPAY', 'John Doe', '0123456789', '123 Test St', 201, 1491, '20308', '2026-04-23 00:01:00', '2026-04-23 00:01:00');

-- Insert sample order items
INSERT INTO order_items (id, order_id, medicine_id, medicine_name, image_url, quantity, unit_price, sub_total)
VALUES (1, 1, 101, 'Paracetamol', 'paracetamol.jpg', 2, 25000.00, 50000.00);

INSERT INTO order_items (id, order_id, medicine_id, medicine_name, image_url, quantity, unit_price, sub_total)
VALUES (2, 1, 102, 'Amoxicillin', 'amoxicillin.jpg', 1, 50000.00, 50000.00);

INSERT INTO order_items (id, order_id, medicine_id, medicine_name, image_url, quantity, unit_price, sub_total)
VALUES (3, 2, 103, 'Aspirin', 'aspirin.jpg', 1, 50000.00, 50000.00);
