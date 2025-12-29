-- Add choline column to food_info table
ALTER TABLE `food_info` 
ADD COLUMN `choline` double DEFAULT NULL COMMENT 'Choline (mg)';
