-- Demo data for Menu Build feature
-- This file creates sample menu builds for testing

-- Insert sample menu builds
INSERT INTO menu_builds (name, description, view_type, selected_week, start_date, end_date, status, note, created_by, campaign_id, created_at) VALUES
('Thực đơn tháng 10/2025', 'Thực đơn cân bằng dinh dưỡng cho tháng 10', 'month', NULL, '2025-10-01', '2025-10-31', 'active', 'Thực đơn đa dạng, phù hợp mọi lứa tuổi', 1, 1, NOW()),
('Thực đơn tuần 1 - Tháng 11', 'Thực đơn tuần đầu tháng 11', 'week', 1, '2025-11-01', '2025-11-07', 'draft', 'Đang soạn thảo', 1, 1, NOW()),
('Thực đơn ăn kiêng', 'Thực đơn cho người ăn kiêng, giảm cân', 'month', NULL, '2025-10-15', '2025-11-15', 'active', 'Ít calo, nhiều rau xanh', 1, 1, NOW());

-- Get the IDs of inserted menus (assuming auto-increment starts from 1)
SET @menu1_id = LAST_INSERT_ID();
SET @menu2_id = @menu1_id + 1;
SET @menu3_id = @menu1_id + 2;

-- Sample menu details for Menu 1 (Thực đơn tháng 10/2025)
-- Week 1
INSERT INTO menu_build_details (menu_build_id, week_number, day_of_week, dish_category_id, dish_id, dish_name, created_at) VALUES
-- Thứ 2
(@menu1_id, 1, 2, 1, 1, 'Cơm gà', NOW()),
(@menu1_id, 1, 2, 2, 5, 'Thịt kho tàu', NOW()),
(@menu1_id, 1, 2, 3, 10, 'Canh chua', NOW()),
(@menu1_id, 1, 2, 4, 15, 'Rau muống xào tỏi', NOW()),

-- Thứ 3
(@menu1_id, 1, 3, 1, 2, 'Cơm sườn', NOW()),
(@menu1_id, 1, 3, 2, 6, 'Cá kho', NOW()),
(@menu1_id, 1, 3, 3, 11, 'Canh rau', NOW()),
(@menu1_id, 1, 3, 4, 16, 'Đậu xào', NOW()),

-- Thứ 4
(@menu1_id, 1, 4, 1, 3, 'Cơm chiên', NOW()),
(@menu1_id, 1, 4, 2, 7, 'Gà xào sả ớt', NOW()),
(@menu1_id, 1, 4, 3, 12, 'Canh bí đỏ', NOW()),
(@menu1_id, 1, 4, 4, 17, 'Cải xào', NOW()),

-- Thứ 5
(@menu1_id, 1, 5, 1, 4, 'Cơm tấm', NOW()),
(@menu1_id, 1, 5, 2, 8, 'Bò xào', NOW()),
(@menu1_id, 1, 5, 3, 13, 'Canh cải', NOW()),
(@menu1_id, 1, 5, 4, 18, 'Rau luộc', NOW()),

-- Thứ 6
(@menu1_id, 1, 6, 1, 1, 'Cơm gà', NOW()),
(@menu1_id, 1, 6, 2, 9, 'Tôm rim', NOW()),
(@menu1_id, 1, 6, 3, 14, 'Canh khổ qua', NOW()),
(@menu1_id, 1, 6, 4, 19, 'Bông cải xào', NOW()),

-- Thứ 7
(@menu1_id, 1, 7, 1, 2, 'Cơm sườn', NOW()),
(@menu1_id, 1, 7, 2, 5, 'Thịt kho', NOW()),
(@menu1_id, 1, 7, 3, 10, 'Canh chua', NOW()),
(@menu1_id, 1, 7, 4, 15, 'Rau xào', NOW()),

-- Chủ nhật
(@menu1_id, 1, 8, 1, 3, 'Cơm chiên', NOW()),
(@menu1_id, 1, 8, 2, 6, 'Cá kho', NOW()),
(@menu1_id, 1, 8, 3, 11, 'Canh rau', NOW()),
(@menu1_id, 1, 8, 4, 16, 'Đậu xào', NOW());

-- Week 2 (similar pattern)
INSERT INTO menu_build_details (menu_build_id, week_number, day_of_week, dish_category_id, dish_id, dish_name, created_at) VALUES
-- Thứ 2
(@menu1_id, 2, 2, 1, 4, 'Cơm tấm', NOW()),
(@menu1_id, 2, 2, 2, 7, 'Gà xào', NOW()),
(@menu1_id, 2, 2, 3, 12, 'Canh bí', NOW()),
(@menu1_id, 2, 2, 4, 17, 'Cải xào', NOW()),

-- Thứ 3
(@menu1_id, 2, 3, 1, 1, 'Cơm gà', NOW()),
(@menu1_id, 2, 3, 2, 8, 'Bò xào', NOW()),
(@menu1_id, 2, 3, 3, 13, 'Canh cải', NOW()),
(@menu1_id, 2, 3, 4, 18, 'Rau luộc', NOW()),

-- Thứ 4
(@menu1_id, 2, 4, 1, 2, 'Cơm sườn', NOW()),
(@menu1_id, 2, 4, 2, 9, 'Tôm rim', NOW()),
(@menu1_id, 2, 4, 3, 14, 'Canh khổ qua', NOW()),
(@menu1_id, 2, 4, 4, 19, 'Bông cải xào', NOW()),

-- Thứ 5
(@menu1_id, 2, 5, 1, 3, 'Cơm chiên', NOW()),
(@menu1_id, 2, 5, 2, 5, 'Thịt kho', NOW()),
(@menu1_id, 2, 5, 3, 10, 'Canh chua', NOW()),
(@menu1_id, 2, 5, 4, 15, 'Rau xào', NOW()),

-- Thứ 6
(@menu1_id, 2, 6, 1, 4, 'Cơm tấm', NOW()),
(@menu1_id, 2, 6, 2, 6, 'Cá kho', NOW()),
(@menu1_id, 2, 6, 3, 11, 'Canh rau', NOW()),
(@menu1_id, 2, 6, 4, 16, 'Đậu xào', NOW()),

-- Thứ 7
(@menu1_id, 2, 7, 1, 1, 'Cơm gà', NOW()),
(@menu1_id, 2, 7, 2, 7, 'Gà xào', NOW()),
(@menu1_id, 2, 7, 3, 12, 'Canh bí', NOW()),
(@menu1_id, 2, 7, 4, 17, 'Cải xào', NOW()),

-- Chủ nhật
(@menu1_id, 2, 8, 1, 2, 'Cơm sườn', NOW()),
(@menu1_id, 2, 8, 2, 8, 'Bò xào', NOW()),
(@menu1_id, 2, 8, 3, 13, 'Canh cải', NOW()),
(@menu1_id, 2, 8, 4, 18, 'Rau luộc', NOW());

-- Week 3
INSERT INTO menu_build_details (menu_build_id, week_number, day_of_week, dish_category_id, dish_id, dish_name, created_at) VALUES
-- Thứ 2
(@menu1_id, 3, 2, 1, 3, 'Cơm chiên', NOW()),
(@menu1_id, 3, 2, 2, 9, 'Tôm rim', NOW()),
(@menu1_id, 3, 2, 3, 14, 'Canh khổ qua', NOW()),
(@menu1_id, 3, 2, 4, 19, 'Bông cải xào', NOW()),

-- Thứ 3
(@menu1_id, 3, 3, 1, 4, 'Cơm tấm', NOW()),
(@menu1_id, 3, 3, 2, 5, 'Thịt kho', NOW()),
(@menu1_id, 3, 3, 3, 10, 'Canh chua', NOW()),
(@menu1_id, 3, 3, 4, 15, 'Rau xào', NOW()),

-- Thứ 4
(@menu1_id, 3, 4, 1, 1, 'Cơm gà', NOW()),
(@menu1_id, 3, 4, 2, 6, 'Cá kho', NOW()),
(@menu1_id, 3, 4, 3, 11, 'Canh rau', NOW()),
(@menu1_id, 3, 4, 4, 16, 'Đậu xào', NOW()),

-- Thứ 5
(@menu1_id, 3, 5, 1, 2, 'Cơm sườn', NOW()),
(@menu1_id, 3, 5, 2, 7, 'Gà xào', NOW()),
(@menu1_id, 3, 5, 3, 12, 'Canh bí', NOW()),
(@menu1_id, 3, 5, 4, 17, 'Cải xào', NOW()),

-- Thứ 6
(@menu1_id, 3, 6, 1, 3, 'Cơm chiên', NOW()),
(@menu1_id, 3, 6, 2, 8, 'Bò xào', NOW()),
(@menu1_id, 3, 6, 3, 13, 'Canh cải', NOW()),
(@menu1_id, 3, 6, 4, 18, 'Rau luộc', NOW()),

-- Thứ 7
(@menu1_id, 3, 7, 1, 4, 'Cơm tấm', NOW()),
(@menu1_id, 3, 7, 2, 9, 'Tôm rim', NOW()),
(@menu1_id, 3, 7, 3, 14, 'Canh khổ qua', NOW()),
(@menu1_id, 3, 7, 4, 19, 'Bông cải xào', NOW()),

-- Chủ nhật
(@menu1_id, 3, 8, 1, 1, 'Cơm gà', NOW()),
(@menu1_id, 3, 8, 2, 5, 'Thịt kho', NOW()),
(@menu1_id, 3, 8, 3, 10, 'Canh chua', NOW()),
(@menu1_id, 3, 8, 4, 15, 'Rau xào', NOW());

-- Week 4
INSERT INTO menu_build_details (menu_build_id, week_number, day_of_week, dish_category_id, dish_id, dish_name, created_at) VALUES
-- Thứ 2
(@menu1_id, 4, 2, 1, 2, 'Cơm sườn', NOW()),
(@menu1_id, 4, 2, 2, 6, 'Cá kho', NOW()),
(@menu1_id, 4, 2, 3, 11, 'Canh rau', NOW()),
(@menu1_id, 4, 2, 4, 16, 'Đậu xào', NOW()),

-- Thứ 3
(@menu1_id, 4, 3, 1, 3, 'Cơm chiên', NOW()),
(@menu1_id, 4, 3, 2, 7, 'Gà xào', NOW()),
(@menu1_id, 4, 3, 3, 12, 'Canh bí', NOW()),
(@menu1_id, 4, 3, 4, 17, 'Cải xào', NOW()),

-- Thứ 4
(@menu1_id, 4, 4, 1, 4, 'Cơm tấm', NOW()),
(@menu1_id, 4, 4, 2, 8, 'Bò xào', NOW()),
(@menu1_id, 4, 4, 3, 13, 'Canh cải', NOW()),
(@menu1_id, 4, 4, 4, 18, 'Rau luộc', NOW()),

-- Thứ 5
(@menu1_id, 4, 5, 1, 1, 'Cơm gà', NOW()),
(@menu1_id, 4, 5, 2, 9, 'Tôm rim', NOW()),
(@menu1_id, 4, 5, 3, 14, 'Canh khổ qua', NOW()),
(@menu1_id, 4, 5, 4, 19, 'Bông cải xào', NOW()),

-- Thứ 6
(@menu1_id, 4, 6, 1, 2, 'Cơm sườn', NOW()),
(@menu1_id, 4, 6, 2, 5, 'Thịt kho', NOW()),
(@menu1_id, 4, 6, 3, 10, 'Canh chua', NOW()),
(@menu1_id, 4, 6, 4, 15, 'Rau xào', NOW()),

-- Thứ 7
(@menu1_id, 4, 7, 1, 3, 'Cơm chiên', NOW()),
(@menu1_id, 4, 7, 2, 6, 'Cá kho', NOW()),
(@menu1_id, 4, 7, 3, 11, 'Canh rau', NOW()),
(@menu1_id, 4, 7, 4, 16, 'Đậu xào', NOW()),

-- Chủ nhật
(@menu1_id, 4, 8, 1, 4, 'Cơm tấm', NOW()),
(@menu1_id, 4, 8, 2, 7, 'Gà xào', NOW()),
(@menu1_id, 4, 8, 3, 12, 'Canh bí', NOW()),
(@menu1_id, 4, 8, 4, 17, 'Cải xào', NOW());

-- Sample data for Menu 2 (Week 1 only)
INSERT INTO menu_build_details (menu_build_id, week_number, day_of_week, dish_category_id, dish_id, dish_name, created_at) VALUES
-- Thứ 2
(@menu2_id, 1, 2, 1, 1, 'Cơm gà', NOW()),
(@menu2_id, 1, 2, 3, 10, 'Canh chua', NOW()),

-- Thứ 3
(@menu2_id, 1, 3, 1, 2, 'Cơm sườn', NOW()),
(@menu2_id, 1, 3, 3, 11, 'Canh rau', NOW()),

-- Thứ 4
(@menu2_id, 1, 4, 1, 3, 'Cơm chiên', NOW()),
(@menu2_id, 1, 4, 3, 12, 'Canh bí', NOW());

-- Note: Menu 3 (Thực đơn ăn kiêng) is left empty for user to fill in

-- Verify data
SELECT 
    mb.name,
    mb.view_type,
    mb.status,
    COUNT(mbd.id) as dish_count
FROM menu_builds mb
LEFT JOIN menu_build_details mbd ON mb.id = mbd.menu_build_id
GROUP BY mb.id, mb.name, mb.view_type, mb.status;

