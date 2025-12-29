-- Migration: Add price field to food_info table
-- Date: 2025-10-12
-- Description: Add price per kg field for cost calculation

ALTER TABLE `food_info` 
ADD COLUMN `price` DECIMAL(10,2) NULL DEFAULT NULL COMMENT 'Đơn giá (VNĐ/kg)' AFTER `edible`;

-- Add index for price queries
ALTER TABLE `food_info` 
ADD INDEX `idx_price` (`price`);

