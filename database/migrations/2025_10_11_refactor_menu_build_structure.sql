-- =====================================================
-- Migration: Refactor Menu Build Structure
-- Date: 2025-10-11
-- Description: Thay đổi hoàn toàn cấu trúc Menu Build
--              - Xóa dish_id, category_key, meal_type
--              - Thêm menu_time_id
--              - Lưu detail dạng JSON như menuExamine.json
-- =====================================================

USE patients;

-- =====================================================
-- STEP 1: Backup dữ liệu cũ (nếu cần)
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_build_details_backup_20251011 AS 
SELECT * FROM menu_build_details;

-- =====================================================
-- STEP 2: Xóa view cũ (nếu có)
-- =====================================================
DROP VIEW IF EXISTS v_menu_build_details;

-- =====================================================
-- STEP 3: Thay đổi cấu trúc menu_build_details
-- =====================================================

-- Các cột category_key, meal_type, dish_id, dish_name đã bị xóa rồi
-- Không cần xóa nữa

-- Thêm cột menu_time_id
ALTER TABLE menu_build_details 
ADD COLUMN menu_time_id INT NOT NULL DEFAULT 5 COMMENT 'ID giờ ăn từ bảng menu_time (3=Sáng, 4=Phụ sáng, 5=Trưa, 6=Chiều, 7=Tối, 8=Phụ tối)' AFTER day_of_week,
ADD CONSTRAINT fk_menu_build_details_menu_time 
    FOREIGN KEY (menu_time_id) REFERENCES menu_time(id) ON DELETE RESTRICT;

-- Cập nhật cột detail để lưu JSON
ALTER TABLE menu_build_details 
MODIFY COLUMN detail LONGTEXT NULL COMMENT 'Chi tiết thực đơn dạng JSON như menuExamine.json: {courses: [...], listFood: [...]}';

-- Thêm index cho menu_time_id
CREATE INDEX idx_menu_time_id ON menu_build_details(menu_time_id);

-- =====================================================
-- STEP 4: Cập nhật menu_builds
-- =====================================================

-- Xóa visible_categories và visible_meals (không cần nữa)
ALTER TABLE menu_builds DROP COLUMN visible_categories;
ALTER TABLE menu_builds DROP COLUMN visible_meals;

-- Thêm cột visible_meal_times để lưu danh sách giờ ăn hiển thị
ALTER TABLE menu_builds 
ADD COLUMN visible_meal_times LONGTEXT NULL COMMENT 'Danh sách ID giờ ăn hiển thị (JSON array). VD: [3,5,7] = Sáng, Trưa, Tối' AFTER selected_week;

-- Set mặc định là bữa trưa (ID=5)
UPDATE menu_builds 
SET visible_meal_times = '[5]' 
WHERE visible_meal_times IS NULL OR visible_meal_times = '';

-- =====================================================
-- STEP 5: Tạo view mới (nếu cần)
-- =====================================================
CREATE OR REPLACE VIEW v_menu_build_details AS
SELECT 
    mbd.id,
    mbd.menu_build_id,
    mb.name AS menu_build_name,
    mbd.week_number,
    mbd.day_of_week,
    mbd.menu_time_id,
    mt.time AS menu_time_name,
    mt.order_sort AS menu_time_order,
    mbd.detail,
    mbd.note,
    mbd.active,
    mbd.created_at,
    mbd.updated_at
FROM menu_build_details mbd
INNER JOIN menu_builds mb ON mbd.menu_build_id = mb.id
INNER JOIN menu_time mt ON mbd.menu_time_id = mt.id
WHERE mbd.active = 1 AND mb.active = 1;

-- =====================================================
-- STEP 6: Xóa dữ liệu cũ (vì cấu trúc đã thay đổi hoàn toàn)
-- =====================================================
-- Lưu ý: Dữ liệu cũ đã được backup ở STEP 1
TRUNCATE TABLE menu_build_details;

-- =====================================================
-- STEP 7: Insert dữ liệu mẫu (optional)
-- =====================================================
-- Ví dụ: Thực đơn tuần 1, Thứ 2, Bữa trưa
-- INSERT INTO menu_build_details (menu_build_id, week_number, day_of_week, menu_time_id, detail, note)
-- VALUES (
--     1, -- menu_build_id
--     1, -- week_number
--     2, -- day_of_week (Thứ 2)
--     5, -- menu_time_id (11h30-12h = Trưa)
--     '{
--         "courses": [
--             {"id": 1, "name": ""},
--             {"id": 2, "name": "Cơm trắng"},
--             {"id": 3, "name": "Thịt gà rang muối"}
--         ],
--         "listFood": [
--             {
--                 "id": 1,
--                 "course_id": 2,
--                 "food_id": 4,
--                 "name": "Gạo tẻ máy",
--                 "weight": 100,
--                 "order_index": 0
--             }
--         ]
--     }',
--     NULL
-- );

-- =====================================================
-- STEP 8: Verify changes
-- =====================================================
-- Kiểm tra cấu trúc mới
DESCRIBE menu_builds;
DESCRIBE menu_build_details;

-- Kiểm tra view
SELECT * FROM v_menu_build_details LIMIT 1;

-- =====================================================
-- Migration completed successfully!
-- =====================================================

