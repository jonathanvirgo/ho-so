-- Hệ thống quản lý dự án và khảo sát
-- Created: 2025-08-19

-- 1) Bảng dự án
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Tên dự án',
  description TEXT NULL COMMENT 'Mô tả dự án',
  start_date DATE NULL COMMENT 'Ngày bắt đầu',
  end_date DATE NULL COMMENT 'Ngày kết thúc',
  google_sheet_id VARCHAR(255) NULL COMMENT 'ID của Google Sheet để lưu dữ liệu',
  google_sheet_url TEXT NULL COMMENT 'URL của Google Sheet',
  sqlite_db_path TEXT NULL COMMENT 'Đường dẫn file SQLite database',
  created_by INT NOT NULL COMMENT 'ID người tạo',
  campaign_id INT NULL COMMENT 'ID chiến dịch',
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2) Bảng cấu hình khảo sát
CREATE TABLE IF NOT EXISTS survey_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT 'ID dự án',
  name VARCHAR(255) NOT NULL COMMENT 'Tên cấu hình khảo sát',
  description TEXT NULL COMMENT 'Mô tả khảo sát',
  survey_url_slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'Slug URL cho khảo sát công khai',
  allow_multiple_responses TINYINT DEFAULT 0 COMMENT '1: Cho phép nhiều phản hồi, 0: Chỉ 1 lần',
  require_email TINYINT DEFAULT 0 COMMENT '1: Bắt buộc email, 0: Không bắt buộc',
  success_message TEXT NULL COMMENT 'Thông báo sau khi submit thành công',
  settings JSON NULL COMMENT 'Các cài đặt khác (theme, validation, etc.)',
  created_by INT NOT NULL COMMENT 'ID người tạo',
  campaign_id INT NULL COMMENT 'ID chiến dịch',
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_created_by (created_by),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_survey_url_slug (survey_url_slug),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3) Bảng các trường khảo sát
CREATE TABLE IF NOT EXISTS survey_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_config_id INT NOT NULL COMMENT 'ID cấu hình khảo sát',
  field_name VARCHAR(255) NOT NULL COMMENT 'Tên trường (dùng làm name attribute)',
  field_label VARCHAR(255) NOT NULL COMMENT 'Nhãn hiển thị',
  field_type ENUM('text', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'datetime', 'date', 'time', 'number', 'email', 'url') NOT NULL COMMENT 'Loại trường',
  field_options JSON NULL COMMENT 'Các tùy chọn cho select, radio, checkbox (array of {value, label})',
  is_required TINYINT DEFAULT 0 COMMENT '1: Bắt buộc, 0: Không bắt buộc',
  placeholder VARCHAR(255) NULL COMMENT 'Placeholder text',
  help_text TEXT NULL COMMENT 'Text hướng dẫn',
  validation_rules JSON NULL COMMENT 'Các rule validation (min, max, pattern, etc.)',
  field_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  field_settings JSON NULL COMMENT 'Cài đặt riêng cho từng loại field',
  created_by INT NOT NULL COMMENT 'ID người tạo',
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_config_id) REFERENCES survey_configs(id) ON DELETE CASCADE,
  INDEX idx_survey_config_id (survey_config_id),
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4) Bảng phản hồi khảo sát
CREATE TABLE IF NOT EXISTS survey_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_config_id INT NOT NULL COMMENT 'ID cấu hình khảo sát',
  respondent_email VARCHAR(255) NULL COMMENT 'Email người trả lời (nếu có)',
  respondent_ip VARCHAR(45) NULL COMMENT 'IP address người trả lời',
  user_agent TEXT NULL COMMENT 'User agent của browser',
  session_id VARCHAR(255) NULL COMMENT 'Session ID để track multiple responses',
  is_completed TINYINT DEFAULT 0 COMMENT '1: Hoàn thành, 0: Chưa hoàn thành',
  submitted_at DATETIME NULL COMMENT 'Thời gian submit',
  google_sheet_row_id INT NULL COMMENT 'ID dòng trong Google Sheet',
  metadata JSON NULL COMMENT 'Metadata khác (referrer, utm params, etc.)',
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_config_id) REFERENCES survey_configs(id) ON DELETE CASCADE,
  INDEX idx_survey_config_id (survey_config_id),
  INDEX idx_respondent_email (respondent_email),
  INDEX idx_submitted_at (submitted_at),
  INDEX idx_is_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5) Bảng dữ liệu phản hồi chi tiết
CREATE TABLE IF NOT EXISTS survey_response_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_response_id INT NOT NULL COMMENT 'ID phản hồi khảo sát',
  survey_field_id INT NOT NULL COMMENT 'ID trường khảo sát',
  field_name VARCHAR(255) NOT NULL COMMENT 'Tên trường (để backup)',
  field_value TEXT NULL COMMENT 'Giá trị trả lời',
  field_value_json JSON NULL COMMENT 'Giá trị dạng JSON (cho multiselect, checkbox)',
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
  FOREIGN KEY (survey_field_id) REFERENCES survey_fields(id) ON DELETE CASCADE,
  INDEX idx_survey_response_id (survey_response_id),
  INDEX idx_survey_field_id (survey_field_id),
  INDEX idx_field_name (field_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6) Bảng template khảo sát (để tái sử dụng)
CREATE TABLE IF NOT EXISTS survey_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Tên template',
  description TEXT NULL COMMENT 'Mô tả template',
  template_data JSON NOT NULL COMMENT 'Dữ liệu template (fields, settings)',
  category VARCHAR(100) NULL COMMENT 'Danh mục template',
  is_public TINYINT DEFAULT 0 COMMENT '1: Public, 0: Private',
  usage_count INT DEFAULT 0 COMMENT 'Số lần sử dụng',
  created_by INT NOT NULL COMMENT 'ID người tạo',
  campaign_id INT NULL COMMENT 'ID chiến dịch',
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_category (category),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
