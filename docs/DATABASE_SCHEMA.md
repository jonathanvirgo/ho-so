# 🗄️ Database Schema - Cấu trúc Cơ sở Dữ liệu

## 📋 Tổng quan Database

Hệ thống sử dụng **Dual Database Architecture**:
- **MySQL**: Database chính cho dữ liệu hệ thống
- **SQLite**: Database phụ cho dữ liệu khảo sát

## 🏥 MySQL Database - Core System

### 👤 User Management Tables

#### users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role_id JSON, -- Array of role IDs [1,3,7]
  active BOOLEAN DEFAULT 1,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### user_tokens (Multi-device Support)
```sql
CREATE TABLE user_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_id VARCHAR(64) UNIQUE NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_tokens_user_id (user_id),
  INDEX idx_user_tokens_token_id (token_id),
  INDEX idx_user_tokens_active (is_active)
);
```

### 🏥 Medical Data Tables

#### hepatitis (Viêm gan)
```sql
CREATE TABLE hepatitis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  patient_id VARCHAR(50),
  diagnosis TEXT,
  treatment_plan TEXT,
  status VARCHAR(50),
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_hepatitis_created_by (created_by),
  INDEX idx_hepatitis_campaign (campaign_id)
);
```

#### tetanus (Uốn ván)
```sql
CREATE TABLE tetanus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  patient_id VARCHAR(50),
  vaccination_date DATE,
  vaccination_type VARCHAR(100),
  next_vaccination DATE,
  status VARCHAR(50),
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_tetanus_created_by (created_by),
  INDEX idx_tetanus_vaccination_date (vaccination_date)
);
```

#### liver_surgery (Phẫu thuật gan)
```sql
CREATE TABLE liver_surgery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  patient_id VARCHAR(50),
  surgery_date DATE,
  surgery_type VARCHAR(100),
  surgeon VARCHAR(255),
  status VARCHAR(50),
  notes TEXT,
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_liver_surgery_created_by (created_by),
  INDEX idx_liver_surgery_date (surgery_date)
);
```

#### research (Nghiên cứu)
```sql
CREATE TABLE research (
  id INT AUTO_INCREMENT PRIMARY KEY,
  research_title VARCHAR(255) NOT NULL,
  research_type VARCHAR(100),
  participant_count INT,
  status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_research_created_by (created_by),
  INDEX idx_research_status (status)
);
```

#### standards (Tiêu chuẩn)
```sql
CREATE TABLE standards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  standard_name VARCHAR(255) NOT NULL,
  standard_code VARCHAR(50),
  category VARCHAR(100),
  description TEXT,
  status VARCHAR(50),
  effective_date DATE,
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_standards_created_by (created_by),
  INDEX idx_standards_code (standard_code)
);
```

### 📊 Survey System Tables

#### projects
```sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  google_sheet_id VARCHAR(255),
  google_sheet_url TEXT,
  sqlite_db_path TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_projects_created_by (created_by),
  INDEX idx_projects_status (status)
);
```

#### survey_configs
```sql
CREATE TABLE survey_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  allow_multiple_responses BOOLEAN DEFAULT 0,
  require_email BOOLEAN DEFAULT 0,
  success_message TEXT,
  google_sheet_tab VARCHAR(255),
  closed_at DATETIME NULL,
  close_reason VARCHAR(255) NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_survey_configs_project (project_id),
  INDEX idx_survey_configs_slug (slug),
  INDEX idx_survey_configs_active (is_active)
);
```

#### survey_fields
```sql
CREATE TABLE survey_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_config_id INT NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- text, email, select, radio, etc.
  field_options TEXT, -- JSON for select/radio options
  is_required BOOLEAN DEFAULT 0,
  field_order INT DEFAULT 0,
  validation_rules TEXT, -- JSON validation rules
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (survey_config_id) REFERENCES survey_configs(id) ON DELETE CASCADE,
  INDEX idx_survey_fields_config (survey_config_id),
  INDEX idx_survey_fields_order (field_order)
);
```

#### survey_responses
```sql
CREATE TABLE survey_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_config_id INT NOT NULL,
  response_id VARCHAR(36) UNIQUE NOT NULL,
  respondent_email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (survey_config_id) REFERENCES survey_configs(id) ON DELETE CASCADE,
  INDEX idx_survey_responses_config (survey_config_id),
  INDEX idx_survey_responses_email (respondent_email),
  INDEX idx_survey_responses_submitted (submitted_at)
);
```

#### survey_response_data
```sql
CREATE TABLE survey_response_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id VARCHAR(36) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (response_id) REFERENCES survey_responses(response_id) ON DELETE CASCADE,
  INDEX idx_survey_response_data_response (response_id),
  INDEX idx_survey_response_data_field (field_name)
);
```

### 🍽️ Food Management Tables

#### food_items
```sql
CREATE TABLE food_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  calories_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(8,2),
  carbs_per_100g DECIMAL(8,2),
  fat_per_100g DECIMAL(8,2),
  fiber_per_100g DECIMAL(8,2),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_food_items_category (category),
  INDEX idx_food_items_name (name)
);
```

#### dishes
```sql
CREATE TABLE dishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  recipe TEXT,
  serving_size VARCHAR(50),
  total_calories DECIMAL(8,2),
  created_by INT NOT NULL,
  campaign_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_dishes_created_by (created_by)
);
```

### 🔧 System Tables

#### automation_rules
```sql
CREATE TABLE automation_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_config TEXT NOT NULL, -- JSON configuration
  active BOOLEAN DEFAULT 1,
  last_executed DATETIME NULL,
  execution_count INTEGER DEFAULT 0,
  created_by VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_automation_rules_active (active),
  INDEX idx_automation_rules_created_by (created_by)
);
```

#### webhook_logs
```sql
CREATE TABLE webhook_logs (
  id VARCHAR(36) PRIMARY KEY,
  webhook_url VARCHAR(500) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  request_headers TEXT,
  request_body TEXT,
  response_status INTEGER,
  response_body TEXT,
  execution_time INTEGER, -- milliseconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_webhook_logs_created_at (created_at),
  INDEX idx_webhook_logs_status (response_status)
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_created_at (created_at)
);
```

## 📱 SQLite Database - Survey Data

### Dynamic Tables per Project
Mỗi project tạo một SQLite database riêng với cấu trúc:

```sql
-- Table chứa responses
CREATE TABLE survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id TEXT UNIQUE NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  respondent_email TEXT,
  ip_address TEXT
);

-- Dynamic columns based on survey fields
-- Ví dụ: ALTER TABLE survey_responses ADD COLUMN field_name TEXT;
```

## 🔗 Relationships & Constraints

### Key Relationships
1. **users** ← **user_tokens** (1:N)
2. **users** ← **projects** (1:N) 
3. **projects** ← **survey_configs** (1:N)
4. **survey_configs** ← **survey_fields** (1:N)
5. **survey_configs** ← **survey_responses** (1:N)
6. **survey_responses** ← **survey_response_data** (1:N)

### Role-based Data Access
- **created_by**: Liên kết record với user tạo
- **campaign_id**: Phân nhóm dữ liệu theo chiến dịch
- **role_id**: JSON array chứa multiple roles per user

## 🔐 Security Features

### Data Protection
- **Soft Delete**: Sử dụng status thay vì DELETE
- **Audit Trail**: Ghi log mọi thay đổi
- **Encryption**: Sensitive fields được mã hóa
- **Access Control**: Role-based filtering

### Performance Optimization
- **Indexing**: Tất cả foreign keys và search fields
- **Partitioning**: Separate SQLite per project
- **Connection Pooling**: MySQL connection management
