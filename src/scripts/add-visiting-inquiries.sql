-- Additive only. Existing data stays.

USE rehab_center;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'visiting_name'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN visiting_name VARCHAR(120) NULL AFTER family_member_address',
  'SELECT ''students.visiting_name already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'visiting_address'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN visiting_address TEXT NULL AFTER visiting_name',
  'SELECT ''students.visiting_address already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'visiting_phone'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN visiting_phone VARCHAR(30) NULL AFTER visiting_address',
  'SELECT ''students.visiting_phone already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS inquiries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  address TEXT NULL,
  phone VARCHAR(30) NULL,
  inquiry_date DATE NOT NULL,
  notes TEXT NULL,
  added_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inquiries_date (inquiry_date),
  KEY idx_inquiries_phone (phone),
  CONSTRAINT fk_inquiries_added_by
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
