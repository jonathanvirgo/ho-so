-- Dữ liệu mẫu cho kho thực phẩm
-- Chạy sau khi đã tạo kho

-- Lấy ID kho đầu tiên
SET @warehouse_id = (SELECT id FROM inventory_warehouses WHERE active = 1 LIMIT 1);

-- Tạo phiếu nhập kho 1 (Ngày 01/01/2025)
INSERT INTO inventory_receipts (warehouse_id, receipt_code, receipt_date, supplier, total_amount, status, created_by, created_at)
VALUES (@warehouse_id, 'PN202501010001', '2025-01-01', 'Công ty TNHH Thực phẩm Sạch', 15000000, 'confirmed', 1, NOW());

SET @receipt_id_1 = LAST_INSERT_ID();

-- Chi tiết phiếu nhập 1
INSERT INTO inventory_receipt_items (receipt_id, food_id, quantity, unit, unit_price, total_price, expiry_date, batch_code)
SELECT @receipt_id_1, id, quantity, 'kg', unit_price, quantity * unit_price, expiry_date, batch_code
FROM (
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Gạo tẻ%' LIMIT 1) as id,
        100 as quantity,
        25000 as unit_price,
        DATE_ADD(CURDATE(), INTERVAL 6 MONTH) as expiry_date,
        'GAO-2025-01' as batch_code
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Thịt lợn nạc%' LIMIT 1),
        50,
        120000,
        DATE_ADD(CURDATE(), INTERVAL 7 DAY),
        'THIT-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Cá%' LIMIT 1),
        30,
        80000,
        DATE_ADD(CURDATE(), INTERVAL 5 DAY),
        'CA-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Rau%' LIMIT 1),
        20,
        15000,
        DATE_ADD(CURDATE(), INTERVAL 3 DAY),
        'RAU-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Cà chua%' LIMIT 1),
        15,
        20000,
        DATE_ADD(CURDATE(), INTERVAL 4 DAY),
        'CACHUA-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Dầu ăn%' LIMIT 1),
        10,
        45000,
        DATE_ADD(CURDATE(), INTERVAL 12 MONTH),
        'DAU-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Đường%' LIMIT 1),
        25,
        18000,
        DATE_ADD(CURDATE(), INTERVAL 12 MONTH),
        'DUONG-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Muối%' LIMIT 1),
        10,
        8000,
        DATE_ADD(CURDATE(), INTERVAL 24 MONTH),
        'MUOI-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Trứng%' LIMIT 1),
        20,
        35000,
        DATE_ADD(CURDATE(), INTERVAL 10 DAY),
        'TRUNG-2025-01'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Sữa%' LIMIT 1),
        15,
        28000,
        DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
        'SUA-2025-01'
) as sample_data
WHERE id IS NOT NULL;

-- Tạo phiếu nhập kho 2 (Ngày 05/01/2025 - Giá khác)
INSERT INTO inventory_receipts (warehouse_id, receipt_code, receipt_date, supplier, total_amount, status, created_by, created_at)
VALUES (@warehouse_id, 'PN202501050001', '2025-01-05', 'Siêu thị Thực phẩm An Toàn', 8000000, 'confirmed', 1, NOW());

SET @receipt_id_2 = LAST_INSERT_ID();

-- Chi tiết phiếu nhập 2 (Giá cao hơn)
INSERT INTO inventory_receipt_items (receipt_id, food_id, quantity, unit, unit_price, total_price, expiry_date, batch_code)
SELECT @receipt_id_2, id, quantity, 'kg', unit_price, quantity * unit_price, expiry_date, batch_code
FROM (
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Gạo tẻ%' LIMIT 1) as id,
        50 as quantity,
        27000 as unit_price,
        DATE_ADD(CURDATE(), INTERVAL 6 MONTH) as expiry_date,
        'GAO-2025-02' as batch_code
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Thịt lợn nạc%' LIMIT 1),
        30,
        125000,
        DATE_ADD(CURDATE(), INTERVAL 7 DAY),
        'THIT-2025-02'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Cá%' LIMIT 1),
        20,
        85000,
        DATE_ADD(CURDATE(), INTERVAL 5 DAY),
        'CA-2025-02'
    UNION ALL
    SELECT 
        (SELECT id FROM food_info WHERE name LIKE '%Rau%' LIMIT 1),
        15,
        16000,
        DATE_ADD(CURDATE(), INTERVAL 3 DAY),
        'RAU-2025-02'
) as sample_data
WHERE id IS NOT NULL;

-- Cập nhật giá tham khảo cho food_info
UPDATE food_info SET price = 25000 WHERE name LIKE '%Gạo tẻ%';
UPDATE food_info SET price = 120000 WHERE name LIKE '%Thịt lợn nạc%';
UPDATE food_info SET price = 80000 WHERE name LIKE '%Cá%';
UPDATE food_info SET price = 15000 WHERE name LIKE '%Rau%';
UPDATE food_info SET price = 20000 WHERE name LIKE '%Cà chua%';
UPDATE food_info SET price = 45000 WHERE name LIKE '%Dầu ăn%';
UPDATE food_info SET price = 18000 WHERE name LIKE '%Đường%';
UPDATE food_info SET price = 8000 WHERE name LIKE '%Muối%';
UPDATE food_info SET price = 35000 WHERE name LIKE '%Trứng%';
UPDATE food_info SET price = 28000 WHERE name LIKE '%Sữa%';

SELECT 'Đã thêm dữ liệu mẫu thành công!' as message;

