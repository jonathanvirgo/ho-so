-- Survey System Enhancements Migration
-- Date: 2025-08-28
-- Description: Thêm các tính năng conditional fields và repeatable field groups

-- Thêm cột field_group cho survey_fields
ALTER TABLE survey_fields 
ADD COLUMN field_group VARCHAR(100) NULL COMMENT 'Tên nhóm field để lặp lại' AFTER help_text;

-- Thêm cột conditional_logic cho survey_fields
ALTER TABLE survey_fields 
ADD COLUMN conditional_logic JSON NULL COMMENT 'Logic điều kiện ẩn/hiện field' AFTER field_group;

-- Cập nhật field_settings để hỗ trợ thêm cấu hình
-- (field_settings đã là JSON nên không cần thay đổi)

-- Tạo bảng survey_field_groups để quản lý nhóm field
CREATE TABLE IF NOT EXISTS survey_field_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_config_id INT NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    group_label VARCHAR(255) NOT NULL,
    is_repeatable TINYINT(1) DEFAULT 0 COMMENT '1 = có thể lặp lại, 0 = không',
    min_instances INT DEFAULT 1 COMMENT 'Số lượng tối thiểu',
    max_instances INT DEFAULT 10 COMMENT 'Số lượng tối đa',
    group_order INT DEFAULT 0,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (survey_config_id) REFERENCES survey_configs(id) ON DELETE CASCADE,
    INDEX idx_survey_config_group (survey_config_id, group_name),
    INDEX idx_group_order (group_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cập nhật bảng survey_response_data để hỗ trợ group instances
ALTER TABLE survey_response_data 
ADD COLUMN group_instance INT DEFAULT 0 COMMENT 'Instance của group (0 = không thuộc group)' AFTER field_name;

-- Tạo index cho group_instance
ALTER TABLE survey_response_data 
ADD INDEX idx_group_instance (survey_response_id, group_instance);

-- Cập nhật field_settings mẫu cho conditional logic
-- Ví dụ conditional_logic JSON structure:
-- {
--   "field": "field_name_to_watch",
--   "operator": "equals|not_equals|contains|not_contains",
--   "value": "value_to_compare"
-- }

-- Ví dụ field_group: "personal_info", "medical_history", etc.

-- Thêm một số ví dụ dữ liệu mẫu (tùy chọn)
-- INSERT INTO survey_field_groups (survey_config_id, group_name, group_label, is_repeatable, min_instances, max_instances) 
-- VALUES 
-- (1, 'daily_symptoms', 'Triệu chứng hàng ngày', 1, 1, 7),
-- (1, 'medication_schedule', 'Lịch uống thuốc', 1, 1, 5);

-- Cập nhật version
INSERT INTO system_migrations (migration_name, executed_at) 
VALUES ('2025_08_28_survey_enhancements', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();

-- Comments cho documentation
/*
Tính năng mới được thêm:

1. Conditional Fields:
   - Ẩn/hiện field dựa trên giá trị của field khác
   - Hỗ trợ các operator: equals, not_equals, contains, not_contains
   - Cấu hình trong conditional_logic JSON column

2. Field Groups:
   - Nhóm các field liên quan với nhau
   - Hỗ trợ lặp lại nhóm field (repeatable groups)
   - Cấu hình min/max instances

3. Group Instances:
   - Mỗi instance của group được lưu với group_instance khác nhau
   - Hỗ trợ nhập dữ liệu theo ngày, theo lần, etc.

Cách sử dụng:
1. Tạo field group trong survey_field_groups
2. Gán field_group cho các survey_fields
3. Cấu hình conditional_logic nếu cần
4. Form sẽ tự động render với tính năng lặp lại và conditional logic
*/
