-- Migration: Create uploaded_files table
-- Date: 2025-08-28
-- Description: Create table to store uploaded file information

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id VARCHAR(36) PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(32) NOT NULL,
    survey_id VARCHAR(36) NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_uploaded_files_survey_id (survey_id),
    INDEX idx_uploaded_files_uploaded_by (uploaded_by),
    INDEX idx_uploaded_files_file_hash (file_hash),
    INDEX idx_uploaded_files_created_at (created_at)
);

-- Add foreign key constraints if the referenced tables exist
-- Note: These may need to be adjusted based on your actual table structure

-- Create uploads directory structure
-- This would typically be done by the application, but documenting here
-- uploads/
-- ├── survey-files/
-- └── thumbnails/
