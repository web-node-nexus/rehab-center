-- Additive only. Existing student rows stay intact.

USE rehab_center;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'aadhar_image'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN aadhar_image VARCHAR(500) NULL AFTER address',
  'SELECT ''students.aadhar_image already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'family_aadhar_image'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN family_aadhar_image VARCHAR(500) NULL AFTER family_member_address',
  'SELECT ''students.family_aadhar_image already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
