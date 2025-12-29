-- Add visible_categories column to menu_builds table
-- This stores which dish categories are visible for this menu

ALTER TABLE menu_builds
ADD COLUMN visible_categories LONGTEXT NULL AFTER visible_meal_times;

