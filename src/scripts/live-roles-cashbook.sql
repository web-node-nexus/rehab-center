-- Rebirth live DB — ADDITIVE ONLY (safe re-run)
-- Roles + Admitted By + Psychologist report + Daily cashbook
-- No DROP / TRUNCATE / DELETE. Old data stays.

USE rehab_center;

-- -------------------------------------------------
-- 1) Roles: admin | doctor | staff | psychologist
-- -------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','doctor','staff','psychologist') NOT NULL DEFAULT 'admin';

-- -------------------------------------------------
-- 2) Admitted by (students)
-- -------------------------------------------------
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'admitted_by'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN admitted_by VARCHAR(120) NULL AFTER referred_by',
  'SELECT ''students.admitted_by already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------
-- 3) Psychologist reports
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS psychologist_reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  first_time_consuming TEXT NULL,
  reasons_inability_to_quit TEXT NULL,
  reasons_relapsing TEXT NULL,
  type_of_problem VARCHAR(200) NULL,
  mental_state TEXT NULL,
  cause_of_addiction TEXT NULL,
  notes TEXT NULL,
  added_by INT UNSIGNED NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_psychologist_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------
-- 4) Daily cashbook (incoming / outgoing)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_entries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type ENUM('incoming', 'outgoing') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  party_name VARCHAR(160) NOT NULL,
  purpose VARCHAR(255) NULL,
  entry_date DATE NOT NULL,
  method ENUM('cash', 'upi', 'bank', 'card', 'other') NOT NULL DEFAULT 'cash',
  notes TEXT NULL,
  added_by INT UNSIGNED NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_cash_entry_date (entry_date),
  KEY idx_cash_type (type),
  KEY idx_cash_party (party_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------
-- Verify
-- -------------------------------------------------
SELECT 'users' AS tbl, COUNT(*) AS rows_kept FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'psychologist_reports', COUNT(*) FROM psychologist_reports
UNION ALL SELECT 'cash_entries', COUNT(*) FROM cash_entries;

SHOW COLUMNS FROM users LIKE 'role';
SHOW COLUMNS FROM students LIKE 'admitted_by';
