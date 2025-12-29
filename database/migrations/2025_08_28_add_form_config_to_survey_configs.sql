-- Migration: Add form_config column to survey_configs table
-- Date: 2025-08-28
-- Description: Add form_config column to store form builder configuration

-- Add form_config column to survey_configs table
ALTER TABLE survey_configs 
ADD COLUMN form_config TEXT NULL 
COMMENT 'JSON configuration for form builder';

-- Add index for better performance
CREATE INDEX idx_survey_configs_form_config ON survey_configs(id, form_config(100));

-- Update existing records to have empty form config
UPDATE survey_configs 
SET form_config = NULL 
WHERE form_config IS NULL;
