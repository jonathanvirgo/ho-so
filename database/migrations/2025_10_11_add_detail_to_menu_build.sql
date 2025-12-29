-- Migration: Add detail column to menu_build_details
-- Date: 2025-10-11
-- Description: Add detail column to store food items detail (JSON) for each dish

-- Add detail column to menu_build_details
ALTER TABLE menu_build_details 
ADD COLUMN detail TEXT NULL 
COMMENT 'Chi tiết thực phẩm của món ăn (JSON array). VD: [{"food_id":1,"quantity":100}]' 
AFTER dish_name;

-- Update view to include detail
DROP VIEW IF EXISTS v_menu_build_details;

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
  mbd.meal_type,
  CASE mbd.meal_type
    WHEN 'sang' THEN 'Sáng'
    WHEN 'trua' THEN 'Trưa'
    WHEN 'chieu' THEN 'Chiều'
    WHEN 'toi' THEN 'Tối'
    WHEN 'phu' THEN 'Phụ'
    ELSE NULL
  END AS meal_name,
  mbd.category_key,
  mbd.dish_id,
  COALESCE(d.name, mbd.dish_name) AS dish_name,
  d.description AS dish_description,
  mbd.detail,
  mbd.note,
  mbd.created_at,
  mbd.updated_at
FROM menu_build_details mbd
INNER JOIN menu_builds mb ON mbd.menu_build_id = mb.id
LEFT JOIN dishes d ON mbd.dish_id = d.id
WHERE mbd.active = 1 AND mb.active = 1;

