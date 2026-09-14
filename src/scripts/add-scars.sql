USE rehab_center;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'scars_from_injury'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN scars_from_injury TEXT NULL AFTER weight',
  'SELECT ''students.scars_from_injury already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
