-- Migration: Create menu build tables for weekly/monthly menu management
-- Date: 2025-10-06
-- Description: Create tables for managing weekly and monthly menus with dish categories

-- 1) Bảng thực đơn xây dựng (menu builds)
CREATE TABLE IF NOT EXISTS menu_builds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Tên thực đơn',
  description TEXT NULL COMMENT 'Mô tả thực đơn',
  view_type ENUM('week', 'month') DEFAULT 'month' COMMENT 'Loại hiển thị: week (theo tuần), month (theo tháng)',
  selected_week TINYINT NULL COMMENT 'Tuần được chọn (1-4) nếu view_type = week',
  visible_categories JSON NULL COMMENT 'Danh sách loại món hiển thị cho thực đơn này. VD: ["mon_chinh", "mon_man", "mon_canh"]',
  start_date DATE NULL COMMENT 'Ngày bắt đầu áp dụng',
  end_date DATE NULL COMMENT 'Ngày kết thúc áp dụng',
  status ENUM('draft', 'active', 'archived') DEFAULT 'draft' COMMENT 'Trạng thái: draft (nháp), active (đang dùng), archived (lưu trữ)',
  note TEXT NULL COMMENT 'Ghi chú',
  active TINYINT DEFAULT 1,
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_menu_builds_created_by (created_by),
  INDEX idx_menu_builds_status (status),
  INDEX idx_menu_builds_view_type (view_type),
  INDEX idx_menu_builds_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2) Bảng chi tiết thực đơn theo tuần (menu build details)
CREATE TABLE IF NOT EXISTS menu_build_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_build_id INT NOT NULL COMMENT 'ID thực đơn',
  week_number TINYINT NOT NULL COMMENT 'Tuần thứ mấy (1-4)',
  day_of_week TINYINT NOT NULL COMMENT 'Thứ trong tuần (2-8, với 8 là Chủ nhật)',
  category_key VARCHAR(50) NOT NULL COMMENT 'Key loại món (mon_chinh, mon_man, mon_canh, mon_xao, v.v.)',
  dish_id INT NULL COMMENT 'ID món ăn được chọn',
  dish_name VARCHAR(255) NULL COMMENT 'Tên món ăn (lưu để tránh mất dữ liệu khi xóa dish)',
  note TEXT NULL COMMENT 'Ghi chú cho món ăn này',
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (menu_build_id) REFERENCES menu_builds(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL,

  INDEX idx_menu_build_details_menu (menu_build_id),
  INDEX idx_menu_build_details_week (week_number),
  INDEX idx_menu_build_details_day (day_of_week),
  INDEX idx_menu_build_details_category (category_key),

  UNIQUE KEY unique_menu_week_day_category (menu_build_id, week_number, day_of_week, category_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create view for easy querying
CREATE OR REPLACE VIEW v_menu_build_details AS
SELECT
  mbd.id,
  mbd.menu_build_id,
  mb.name AS menu_name,
  mb.view_type,
  mb.status AS menu_status,
  mbd.week_number,
  mbd.day_of_week,
  CASE mbd.day_of_week
    WHEN 2 THEN 'Thứ 2'
    WHEN 3 THEN 'Thứ 3'
    WHEN 4 THEN 'Thứ 4'
    WHEN 5 THEN 'Thứ 5'
    WHEN 6 THEN 'Thứ 6'
    WHEN 7 THEN 'Thứ 7'
    WHEN 8 THEN 'Chủ nhật'
  END AS day_name,
  mbd.category_key,
  mbd.dish_id,
  COALESCE(d.name, mbd.dish_name) AS dish_name,
  d.description AS dish_description,
  mbd.note,
  mbd.created_at,
  mbd.updated_at
FROM menu_build_details mbd
INNER JOIN menu_builds mb ON mbd.menu_build_id = mb.id
LEFT JOIN dishes d ON mbd.dish_id = d.id
WHERE mbd.active = 1 AND mb.active = 1;

-- Add comments
ALTER TABLE menu_builds COMMENT = 'Thực đơn xây dựng theo tuần/tháng';
ALTER TABLE menu_build_details COMMENT = 'Chi tiết món ăn trong thực đơn theo từng ngày';

