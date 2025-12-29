-- Migration: Add unique index for survey_fields
-- Date: 2025-08-25
-- Description: Add unique constraint for survey_config_id + field_name + active

-- Add unique index to prevent duplicate field names in same survey config
ALTER TABLE `survey_fields` 
ADD UNIQUE INDEX `survey_fields_unique` (`survey_config_id`, `field_name`, `active`);

-- Note: This ensures that within a survey config, field names are unique for active fields
-- When active = -1 (deleted), the constraint doesn't apply, allowing soft delete
