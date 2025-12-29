-- Migration: Update menu build tables - Remove dish_categories table
-- Date: 2025-10-06
-- Description: Drop dish_categories table and update menu_builds and menu_build_details

-- Drop view first
DROP VIEW IF EXISTS v_menu_build_details;

-- Drop foreign keys from menu_build_details (check if exists first)
SET @exist := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = 'patients'
    AND TABLE_NAME = 'menu_build_details'
    AND CONSTRAINT_NAME = 'menu_build_details_ibfk_2'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE menu_build_details DROP FOREIGN KEY menu_build_details_ibfk_2', 'SELECT ''Foreign key does not exist''');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

-- Drop dish_categories table
DROP TABLE IF EXISTS dish_categories;

-- Modify menu_builds table - Add visible_categories column
ALTER TABLE menu_builds 
ADD COLUMN visible_categories JSON NULL COMMENT 'Danh sách loại món hiển thị cho thực đơn này. VD: ["mon_chinh", "mon_man", "mon_canh"]' 
AFTER selected_week;

-- Modify menu_build_details table - Change dish_category_id to category_key
ALTER TABLE menu_build_details
DROP COLUMN dish_category_id;

ALTER TABLE menu_build_details
ADD COLUMN category_key VARCHAR(50) NOT NULL COMMENT 'Key loại món (mon_chinh, mon_man, mon_canh, mon_xao, v.v.)'
AFTER day_of_week;

-- Recreate unique constraint
ALTER TABLE menu_build_details
DROP INDEX unique_menu_week_day_category;

ALTER TABLE menu_build_details
ADD UNIQUE KEY unique_menu_week_day_category (menu_build_id, week_number, day_of_week, category_key);

-- Recreate view
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

