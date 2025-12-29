-- Migration: Cleanup Survey System Database
-- Date: 2025-09-05
-- Description: Loại bỏ các bảng và cột không cần thiết cho hệ thống khảo sát đơn giản

-- ========================================
-- 1. XÓA CÁC BẢNG AUTOMATION KHÔNG CẦN THIẾT
-- ========================================

-- Xóa bảng automation_rules
DROP TABLE IF EXISTS automation_rules;

-- Xóa bảng webhook_logs
DROP TABLE IF EXISTS webhook_logs;

-- Xóa bảng survey_invitations
DROP TABLE IF EXISTS survey_invitations;

-- Xóa bảng automation_logs
DROP TABLE IF EXISTS automation_logs;

-- Xóa bảng email_templates
DROP TABLE IF EXISTS email_templates;

-- ========================================
-- 2. XÓA CÁC BẢNG CONDITIONAL LOGIC KHÔNG CẦN THIẾT
-- ========================================

-- Xóa bảng survey_field_groups
DROP TABLE IF EXISTS survey_field_groups;

-- ========================================
-- 3. XÓA CÁC CỘT AUTOMATION TRONG survey_configs
-- ========================================

-- Xóa các cột automation trong survey_configs
ALTER TABLE survey_configs DROP COLUMN IF EXISTS reminder_enabled;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS max_reminders;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS reminder_interval_hours;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS webhook_url;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS webhook_secret;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS webhook_headers;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS daily_reports;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS report_recipients;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS expiry_date;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS closed_at;
ALTER TABLE survey_configs DROP COLUMN IF EXISTS close_reason;

-- ========================================
-- 4. XÓA CÁC CỘT CONDITIONAL LOGIC TRONG survey_fields
-- ========================================

-- Xóa cột field_group
ALTER TABLE survey_fields DROP COLUMN IF EXISTS field_group;

-- Xóa cột conditional_logic
ALTER TABLE survey_fields DROP COLUMN IF EXISTS conditional_logic;

-- ========================================
-- 5. XÓA CỘT group_instance TRONG survey_response_data
-- ========================================

-- Xóa index trước
DROP INDEX IF EXISTS idx_group_instance ON survey_response_data;

-- Xóa cột group_instance
ALTER TABLE survey_response_data DROP COLUMN IF EXISTS group_instance;

-- ========================================
-- 6. XÓA CỘT form_config TRONG survey_configs (nếu không sử dụng form builder)
-- ========================================

-- Xóa index trước
DROP INDEX IF EXISTS idx_survey_configs_form_config ON survey_configs;

-- Xóa cột form_config
ALTER TABLE survey_configs DROP COLUMN IF EXISTS form_config;

-- ========================================
-- 7. CẬP NHẬT CÁC CỘT EMAIL TRONG survey_configs
-- ========================================

-- Đặt require_email = 0 cho tất cả survey configs
UPDATE survey_configs SET require_email = 0 WHERE require_email = 1;

-- Đặt allow_multiple_responses = 1 cho tất cả survey configs (vì không track email)
UPDATE survey_configs SET allow_multiple_responses = 1 WHERE allow_multiple_responses = 0;

-- ========================================
-- 8. XÓA DỮ LIỆU EMAIL VÀ IP TRONG survey_responses
-- ========================================

-- Xóa dữ liệu email và IP address hiện có
UPDATE survey_responses SET 
    respondent_email = NULL,
    respondent_ip = NULL
WHERE respondent_email IS NOT NULL OR respondent_ip IS NOT NULL;

-- ========================================
-- 9. XÓA CÁC BẢNG TEMPLATE KHÔNG CẦN THIẾT
-- ========================================

-- Xóa bảng survey_templates nếu không sử dụng
DROP TABLE IF EXISTS survey_templates;

-- ========================================
-- 10. CẬP NHẬT SYSTEM MIGRATIONS
-- ========================================

-- Ghi lại migration này
INSERT INTO system_migrations (migration_name, executed_at) 
VALUES ('2025_09_05_cleanup_survey_system', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();

-- ========================================
-- COMMENTS VÀ DOCUMENTATION
-- ========================================

/*
TỔNG KẾT CÁC THAY ĐỔI:

✅ ĐÃ XÓA:
1. Bảng automation_rules - Không cần automation
2. Bảng webhook_logs - Không cần webhook
3. Bảng survey_invitations - Không gửi email mời
4. Bảng automation_logs - Không cần automation logs
5. Bảng email_templates - Không gửi email
6. Bảng survey_field_groups - Không cần field groups
7. Bảng survey_templates - Không cần templates
8. Cột field_group trong survey_fields - Không cần nhóm field
9. Cột conditional_logic trong survey_fields - Không cần logic điều kiện
10. Cột group_instance trong survey_response_data - Không cần group instances
11. Các cột automation trong survey_configs - Không cần automation
12. Cột form_config trong survey_configs - Không cần form builder

✅ ĐÃ CẬP NHẬT:
1. require_email = 0 - Không yêu cầu email
2. allow_multiple_responses = 1 - Cho phép nhiều phản hồi
3. Xóa dữ liệu email và IP address hiện có

🎯 KẾT QUẢ:
- Database gọn gàng hơn
- Chỉ giữ lại các bảng cần thiết cho khảo sát đơn giản
- Loại bỏ hoàn toàn tính năng automation và conditional logic
- Hệ thống tập trung vào: Tạo khảo sát → Thu thập dữ liệu → Xuất Excel
*/
