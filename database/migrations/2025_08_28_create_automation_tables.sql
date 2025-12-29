-- Migration: Create automation and notification tables
-- Date: 2025-08-28
-- Description: Create tables for automation rules, webhook logs, and survey invitations

-- Create automation_rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_config TEXT NOT NULL, -- JSON configuration
    active BOOLEAN DEFAULT 1,
    last_executed DATETIME NULL,
    execution_count INTEGER DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_automation_rules_active (active),
    INDEX idx_automation_rules_created_by (created_by),
    INDEX idx_automation_rules_last_executed (last_executed)
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    webhook_url TEXT NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'POST',
    payload TEXT NOT NULL, -- JSON payload
    response_status INTEGER NULL,
    response_data TEXT NULL, -- JSON response
    error_message TEXT NULL,
    error_code VARCHAR(50) NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    success BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_webhook_logs_url (webhook_url),
    INDEX idx_webhook_logs_success (success),
    INDEX idx_webhook_logs_created_at (created_at)
);

-- Create survey_invitations table
CREATE TABLE IF NOT EXISTS survey_invitations (
    id VARCHAR(36) PRIMARY KEY,
    survey_config_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent DATETIME NULL,
    responded_at DATETIME NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_survey_invitations_survey_config (survey_config_id),
    INDEX idx_survey_invitations_email (email),
    INDEX idx_survey_invitations_token (invitation_token),
    INDEX idx_survey_invitations_sent_at (sent_at),
    UNIQUE KEY unique_survey_email (survey_config_id, email)
);

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS automation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_rule_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_config TEXT, -- JSON configuration
    success BOOLEAN NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    execution_time_ms INTEGER NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_automation_logs_rule_id (automation_rule_id),
    INDEX idx_automation_logs_action_type (action_type),
    INDEX idx_automation_logs_success (success),
    INDEX idx_automation_logs_created_at (created_at)
);

-- Add columns to survey_configs for automation features
ALTER TABLE survey_configs ADD COLUMN reminder_enabled BOOLEAN DEFAULT 0;
ALTER TABLE survey_configs ADD COLUMN max_reminders INTEGER DEFAULT 3;
ALTER TABLE survey_configs ADD COLUMN reminder_interval_hours INTEGER DEFAULT 24;
ALTER TABLE survey_configs ADD COLUMN webhook_url TEXT NULL;
ALTER TABLE survey_configs ADD COLUMN webhook_secret VARCHAR(255) NULL;
ALTER TABLE survey_configs ADD COLUMN webhook_headers TEXT NULL; -- JSON
ALTER TABLE survey_configs ADD COLUMN daily_reports BOOLEAN DEFAULT 0;
ALTER TABLE survey_configs ADD COLUMN report_recipients TEXT NULL; -- Comma-separated emails
ALTER TABLE survey_configs ADD COLUMN expiry_date DATETIME NULL;
ALTER TABLE survey_configs ADD COLUMN closed_at DATETIME NULL;
ALTER TABLE survey_configs ADD COLUMN close_reason VARCHAR(255) NULL;

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NULL,
    variables TEXT NULL, -- JSON array of available variables
    template_type VARCHAR(50) NOT NULL, -- invitation, reminder, completion, report, admin
    active BOOLEAN DEFAULT 1,
    created_by VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email_templates_type (template_type),
    INDEX idx_email_templates_active (active)
);

-- Insert default email templates
INSERT OR IGNORE INTO email_templates (id, name, subject, html_content, template_type, variables, created_by) VALUES
('template_invitation', 'Default Survey Invitation', 'Invitation: {{surveyName}}', 
'<h2>{{surveyName}}</h2><p>You have been invited to participate in our survey.</p><a href="{{surveyUrl}}">Take Survey</a>', 
'invitation', '["surveyName", "surveyUrl", "senderName", "customMessage", "expiryDate"]', 'system'),

('template_reminder', 'Default Survey Reminder', 'Reminder: {{surveyName}}', 
'<h2>{{surveyName}}</h2><p>This is a reminder that you have a pending survey to complete.</p><a href="{{surveyUrl}}">Complete Survey</a>', 
'reminder', '["surveyName", "surveyUrl", "reminderNumber", "expiryDate"]', 'system'),

('template_completion', 'Default Completion Notification', 'New Response: {{surveyName}}', 
'<h2>New Survey Response</h2><p>A new response has been submitted for {{surveyName}}.</p><p>Respondent: {{respondentEmail}}</p>', 
'completion', '["surveyName", "respondentEmail", "submissionTime", "responseData"]', 'system');

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    survey_config_id VARCHAR(36) NULL, -- NULL for global settings
    notification_type VARCHAR(50) NOT NULL, -- email, webhook, sms
    event_type VARCHAR(50) NOT NULL, -- response_received, survey_completed, reminder_due
    enabled BOOLEAN DEFAULT 1,
    settings TEXT NULL, -- JSON configuration
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_notification_settings_user (user_id),
    INDEX idx_notification_settings_survey (survey_config_id),
    INDEX idx_notification_settings_type (notification_type),
    INDEX idx_notification_settings_event (event_type),
    UNIQUE KEY unique_user_survey_notification (user_id, survey_config_id, notification_type, event_type)
);
