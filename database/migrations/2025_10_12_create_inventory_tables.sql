-- Migration: Create inventory management tables
-- Date: 2025-10-12
-- Description: Create tables for warehouse inventory management (FIFO)

-- 1) Bảng kho (mỗi campaign có kho riêng)
CREATE TABLE IF NOT EXISTS inventory_warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Tên kho',
  campaign_id INT NOT NULL COMMENT 'ID chiến dịch',
  location VARCHAR(255) NULL COMMENT 'Vị trí kho',
  description TEXT NULL COMMENT 'Mô tả',
  active TINYINT DEFAULT 1 COMMENT '1: Hoạt động, 0: Ngừng hoạt động',
  created_by INT NOT NULL COMMENT 'ID người tạo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_active (active),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Kho thực phẩm';

-- 2) Bảng phiếu nhập kho
CREATE TABLE IF NOT EXISTS inventory_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL COMMENT 'ID kho',
  receipt_code VARCHAR(50) NOT NULL COMMENT 'Mã phiếu nhập',
  receipt_date DATE NOT NULL COMMENT 'Ngày nhập kho',
  supplier VARCHAR(255) NULL COMMENT 'Nhà cung cấp',
  total_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Tổng tiền',
  note TEXT NULL COMMENT 'Ghi chú',
  status ENUM('draft', 'confirmed', 'cancelled') DEFAULT 'confirmed' COMMENT 'Trạng thái phiếu',
  created_by INT NOT NULL COMMENT 'ID người tạo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_receipt_code (receipt_code),
  INDEX idx_warehouse_id (warehouse_id),
  INDEX idx_receipt_date (receipt_date),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (warehouse_id) REFERENCES inventory_warehouses(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Phiếu nhập kho';

-- 3) Bảng chi tiết phiếu nhập kho
CREATE TABLE IF NOT EXISTS inventory_receipt_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_id INT NOT NULL COMMENT 'ID phiếu nhập',
  food_id INT NOT NULL COMMENT 'ID thực phẩm',
  quantity DECIMAL(10,2) NOT NULL COMMENT 'Số lượng nhập (kg)',
  unit VARCHAR(20) DEFAULT 'kg' COMMENT 'Đơn vị tính',
  unit_price DECIMAL(10,2) DEFAULT 0 COMMENT 'Đơn giá (VNĐ/kg)',
  total_price DECIMAL(15,2) DEFAULT 0 COMMENT 'Thành tiền',
  expiry_date DATE NULL COMMENT 'Hạn sử dụng',
  batch_code VARCHAR(50) NULL COMMENT 'Mã lô',
  note TEXT NULL COMMENT 'Ghi chú',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_receipt_id (receipt_id),
  INDEX idx_food_id (food_id),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_batch_code (batch_code),
  FOREIGN KEY (receipt_id) REFERENCES inventory_receipts(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES food_info(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết phiếu nhập kho';

-- 4) Bảng phiếu xuất kho
CREATE TABLE IF NOT EXISTS inventory_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL COMMENT 'ID kho',
  issue_code VARCHAR(50) NOT NULL COMMENT 'Mã phiếu xuất',
  issue_date DATE NOT NULL COMMENT 'Ngày xuất kho',
  issue_type ENUM('menu', 'manual', 'waste', 'return') DEFAULT 'manual' COMMENT 'Loại xuất: menu=theo thực đơn, manual=thủ công, waste=hao hụt, return=trả lại',
  menu_build_id INT NULL COMMENT 'ID thực đơn (nếu xuất theo thực đơn)',
  menu_week INT NULL COMMENT 'Tuần thực đơn',
  menu_day INT NULL COMMENT 'Ngày thực đơn',
  receiver VARCHAR(255) NULL COMMENT 'Người nhận',
  note TEXT NULL COMMENT 'Ghi chú',
  status ENUM('draft', 'confirmed', 'cancelled') DEFAULT 'confirmed' COMMENT 'Trạng thái phiếu',
  created_by INT NOT NULL COMMENT 'ID người tạo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_issue_code (issue_code),
  INDEX idx_warehouse_id (warehouse_id),
  INDEX idx_issue_date (issue_date),
  INDEX idx_issue_type (issue_type),
  INDEX idx_menu_build_id (menu_build_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (warehouse_id) REFERENCES inventory_warehouses(id) ON DELETE RESTRICT,
  FOREIGN KEY (menu_build_id) REFERENCES menu_builds(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Phiếu xuất kho';

-- 5) Bảng chi tiết phiếu xuất kho
CREATE TABLE IF NOT EXISTS inventory_issue_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issue_id INT NOT NULL COMMENT 'ID phiếu xuất',
  food_id INT NOT NULL COMMENT 'ID thực phẩm',
  receipt_item_id INT NULL COMMENT 'ID chi tiết phiếu nhập (FIFO)',
  quantity DECIMAL(10,2) NOT NULL COMMENT 'Số lượng xuất (kg)',
  unit VARCHAR(20) DEFAULT 'kg' COMMENT 'Đơn vị tính',
  note TEXT NULL COMMENT 'Ghi chú',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_issue_id (issue_id),
  INDEX idx_food_id (food_id),
  INDEX idx_receipt_item_id (receipt_item_id),
  FOREIGN KEY (issue_id) REFERENCES inventory_issues(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES food_info(id) ON DELETE RESTRICT,
  FOREIGN KEY (receipt_item_id) REFERENCES inventory_receipt_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết phiếu xuất kho';

-- 6) Bảng tồn kho (materialized view - cập nhật realtime)
CREATE TABLE IF NOT EXISTS inventory_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL COMMENT 'ID kho',
  food_id INT NOT NULL COMMENT 'ID thực phẩm',
  receipt_item_id INT NOT NULL COMMENT 'ID chi tiết phiếu nhập (FIFO)',
  batch_code VARCHAR(50) NULL COMMENT 'Mã lô',
  expiry_date DATE NULL COMMENT 'Hạn sử dụng',
  quantity_in DECIMAL(10,2) NOT NULL COMMENT 'Số lượng nhập',
  quantity_out DECIMAL(10,2) DEFAULT 0 COMMENT 'Số lượng xuất',
  quantity_available DECIMAL(10,2) NOT NULL COMMENT 'Số lượng còn lại',
  unit VARCHAR(20) DEFAULT 'kg' COMMENT 'Đơn vị tính',
  unit_price DECIMAL(10,2) DEFAULT 0 COMMENT 'Đơn giá',
  receipt_date DATE NOT NULL COMMENT 'Ngày nhập',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_receipt_item (warehouse_id, receipt_item_id),
  INDEX idx_warehouse_food (warehouse_id, food_id),
  INDEX idx_food_id (food_id),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_batch_code (batch_code),
  INDEX idx_quantity_available (quantity_available),
  FOREIGN KEY (warehouse_id) REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES food_info(id) ON DELETE RESTRICT,
  FOREIGN KEY (receipt_item_id) REFERENCES inventory_receipt_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tồn kho hiện tại (FIFO)';

-- 7) Trigger: Tự động tạo stock khi nhập kho
DELIMITER $$
CREATE TRIGGER after_receipt_item_insert
AFTER INSERT ON inventory_receipt_items
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id INT;
    DECLARE v_receipt_date DATE;
    
    -- Lấy warehouse_id và receipt_date từ receipt
    SELECT warehouse_id, receipt_date INTO v_warehouse_id, v_receipt_date
    FROM inventory_receipts
    WHERE id = NEW.receipt_id;
    
    -- Tạo stock record
    INSERT INTO inventory_stock (
        warehouse_id, food_id, receipt_item_id, batch_code, expiry_date,
        quantity_in, quantity_out, quantity_available, unit, unit_price, receipt_date
    ) VALUES (
        v_warehouse_id, NEW.food_id, NEW.id, NEW.batch_code, NEW.expiry_date,
        NEW.quantity, 0, NEW.quantity, NEW.unit, NEW.unit_price, v_receipt_date
    );
END$$
DELIMITER ;

-- 8) Trigger: Tự động cập nhật stock khi xuất kho (FIFO)
DELIMITER $$
CREATE TRIGGER after_issue_item_insert
AFTER INSERT ON inventory_issue_items
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id INT;
    DECLARE v_remaining DECIMAL(10,2);
    DECLARE v_stock_id INT;
    DECLARE v_stock_available DECIMAL(10,2);
    DECLARE v_to_deduct DECIMAL(10,2);
    DECLARE done INT DEFAULT FALSE;
    
    -- Cursor để lấy stock theo FIFO (nhập trước xuất trước)
    DECLARE stock_cursor CURSOR FOR
        SELECT id, quantity_available
        FROM inventory_stock
        WHERE warehouse_id = v_warehouse_id
        AND food_id = NEW.food_id
        AND quantity_available > 0
        ORDER BY receipt_date ASC, id ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Lấy warehouse_id
    SELECT warehouse_id INTO v_warehouse_id
    FROM inventory_issues
    WHERE id = NEW.issue_id;
    
    SET v_remaining = NEW.quantity;
    
    -- Mở cursor
    OPEN stock_cursor;
    
    read_loop: LOOP
        FETCH stock_cursor INTO v_stock_id, v_stock_available;
        
        IF done OR v_remaining <= 0 THEN
            LEAVE read_loop;
        END IF;
        
        -- Tính số lượng cần trừ
        IF v_stock_available >= v_remaining THEN
            SET v_to_deduct = v_remaining;
        ELSE
            SET v_to_deduct = v_stock_available;
        END IF;
        
        -- Cập nhật stock
        UPDATE inventory_stock
        SET quantity_out = quantity_out + v_to_deduct,
            quantity_available = quantity_available - v_to_deduct
        WHERE id = v_stock_id;
        
        -- Giảm remaining
        SET v_remaining = v_remaining - v_to_deduct;
    END LOOP;
    
    CLOSE stock_cursor;
END$$
DELIMITER ;

