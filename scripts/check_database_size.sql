-- Script: Kiểm tra kích thước database và số lượng bảng
-- Date: 2025-09-05
-- Description: Kiểm tra kích thước database trước và sau khi cleanup

-- ========================================
-- 1. KIỂM TRA KÍCH THƯỚC DATABASE
-- ========================================

SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)',
    COUNT(*) AS 'Number of Tables'
FROM information_schema.tables 
WHERE table_schema = DATABASE()
GROUP BY table_schema;

-- ========================================
-- 2. KIỂM TRA KÍCH THƯỚC TỪNG BẢNG
-- ========================================

SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
    table_rows AS 'Rows'
FROM information_schema.TABLES 
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC;

-- ========================================
-- 3. KIỂM TRA CÁC BẢNG AUTOMATION (TRƯỚC KHI XÓA)
-- ========================================

SELECT 'AUTOMATION TABLES CHECK' AS 'Status';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('Table exists with ', COUNT(*), ' rows')
        ELSE 'Table does not exist'
    END AS 'automation_rules'
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'automation_rules';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('Table exists with ', COUNT(*), ' rows')
        ELSE 'Table does not exist'
    END AS 'webhook_logs'
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'webhook_logs';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('Table exists with ', COUNT(*), ' rows')
        ELSE 'Table does not exist'
    END AS 'survey_invitations'
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'survey_invitations';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('Table exists with ', COUNT(*), ' rows')
        ELSE 'Table does not exist'
    END AS 'email_templates'
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'email_templates';

-- ========================================
-- 4. KIỂM TRA CÁC CỘT AUTOMATION TRONG survey_configs
-- ========================================

SELECT 'SURVEY_CONFIGS COLUMNS CHECK' AS 'Status';

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'survey_configs'
    AND COLUMN_NAME IN (
        'reminder_enabled', 'max_reminders', 'reminder_interval_hours',
        'webhook_url', 'webhook_secret', 'webhook_headers',
        'daily_reports', 'report_recipients', 'expiry_date',
        'closed_at', 'close_reason', 'form_config'
    );

-- ========================================
-- 5. KIỂM TRA CÁC CỘT CONDITIONAL LOGIC TRONG survey_fields
-- ========================================

SELECT 'SURVEY_FIELDS COLUMNS CHECK' AS 'Status';

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'survey_fields'
    AND COLUMN_NAME IN ('field_group', 'conditional_logic');

-- ========================================
-- 6. KIỂM TRA DỮ LIỆU EMAIL TRONG survey_responses
-- ========================================

SELECT 'EMAIL DATA CHECK' AS 'Status';

SELECT 
    COUNT(*) AS 'Total Responses',
    COUNT(respondent_email) AS 'Responses with Email',
    COUNT(respondent_ip) AS 'Responses with IP'
FROM survey_responses;

-- ========================================
-- 7. KIỂM TRA CÁC BẢNG CÒN LẠI SAU CLEANUP
-- ========================================

SELECT 'REMAINING TABLES AFTER CLEANUP' AS 'Status';

SELECT 
    table_name AS 'Table Name',
    table_comment AS 'Comment'
FROM information_schema.tables 
WHERE table_schema = DATABASE()
    AND table_name LIKE '%survey%'
ORDER BY table_name;

-- ========================================
-- 8. TỔNG KẾT
-- ========================================

SELECT 'DATABASE CLEANUP SUMMARY' AS 'Status';

SELECT 
    'Before cleanup, check tables and columns listed above' AS 'Instructions',
    'Run the cleanup migration: 2025_09_05_cleanup_survey_system.sql' AS 'Next Step',
    'Then run this script again to see the difference' AS 'Verification';
