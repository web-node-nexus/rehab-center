USE rehab_center;

-- Admission pickup person + charges (additive only)

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'pickup_by'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN pickup_by VARCHAR(120) NULL AFTER admitted_by',
  'SELECT ''students.pickup_by already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'pickup_charges'
);
SET @sql2 := IF(
  @col2 = 0,
  'ALTER TABLE students ADD COLUMN pickup_charges DECIMAL(10,2) NULL AFTER pickup_by',
  'SELECT ''students.pickup_charges already exists'' AS info'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;
