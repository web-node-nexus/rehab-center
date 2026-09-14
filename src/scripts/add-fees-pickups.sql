USE rehab_center;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'father_name'
);
SET @sql := IF(@col = 0, 'ALTER TABLE students ADD COLUMN father_name VARCHAR(120) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'mother_name'
);
SET @sql := IF(@col = 0, 'ALTER TABLE students ADD COLUMN mother_name VARCHAR(120) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'agreed_fee'
);
SET @sql := IF(@col = 0, 'ALTER TABLE students ADD COLUMN agreed_fee DECIMAL(10,2) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'monthly_fee'
);
SET @sql := IF(@col = 0, 'ALTER TABLE students ADD COLUMN monthly_fee DECIMAL(10,2) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS pickups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  form_date DATE NOT NULL,
  requester_name VARCHAR(160) NULL,
  patient_name VARCHAR(160) NULL,
  father_name VARCHAR(120) NULL,
  mother_name VARCHAR(120) NULL,
  pickup_address TEXT NULL,
  pincode VARCHAR(12) NULL,
  phone VARCHAR(30) NULL,
  pickup_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
  monthly_rehab_charges DECIMAL(10,2) NULL,
  starting_date DATE NULL,
  pickup_members TEXT NULL,
  pickup_incharge VARCHAR(160) NULL,
  guardian_name VARCHAR(160) NULL,
  notes TEXT NULL,
  is_paid TINYINT(1) NOT NULL DEFAULT 0,
  added_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pickups_student (student_id),
  KEY idx_pickups_date (form_date),
  CONSTRAINT fk_pickups_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pickups_added_by
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
