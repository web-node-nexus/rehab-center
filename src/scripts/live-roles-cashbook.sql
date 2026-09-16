-- ============================================================
-- Rebirth LIVE migration — ADDITIVE ONLY
-- SAFE for existing data. Safe to re-run.
--
-- Does NOT contain:
--   DROP / TRUNCATE / DELETE / UPDATE of student/payment rows
--
-- Does ONLY:
--   1) Expand users.role ENUM (keeps all existing users)
--   2) ADD COLUMN students.admitted_by if missing
--   3) CREATE TABLE psychologist_reports if missing
--   4) CREATE TABLE cash_entries if missing
--
-- DO NOT run on live:
--   npm run db:sync
--   npm run setup
--   npm run seed
-- ============================================================

USE rehab_center;

-- Snapshot BEFORE (compare with AFTER at the end)
SELECT 'BEFORE' AS stage, 'users' AS tbl, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'BEFORE', 'students', COUNT(*) FROM students
UNION ALL SELECT 'BEFORE', 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'BEFORE', 'doctor_visits', COUNT(*) FROM doctor_visits
UNION ALL SELECT 'BEFORE', 'monthly_records', COUNT(*) FROM monthly_records
UNION ALL SELECT 'BEFORE', 'initial_reports', COUNT(*) FROM initial_reports
UNION ALL SELECT 'BEFORE', 'family_meetings', COUNT(*) FROM family_meetings
UNION ALL SELECT 'BEFORE', 'monthly_photos', COUNT(*) FROM monthly_photos
UNION ALL SELECT 'BEFORE', 'inquiries', COUNT(*) FROM inquiries
UNION ALL SELECT 'BEFORE', 'pickups', COUNT(*) FROM pickups;

-- -------------------------------------------------
-- 1) Roles ENUM expand (admin/doctor stay valid)
--    Only ADDS staff + psychologist. No row delete.
-- -------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','doctor','staff','psychologist') NOT NULL DEFAULT 'admin';

-- -------------------------------------------------
-- 2) Admitted by — ADD COLUMN only if missing
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
  'SELECT ''students.admitted_by already exists — skipped'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------
-- 3) Psychologist reports — CREATE IF NOT EXISTS
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
-- 4) Daily cashbook — CREATE IF NOT EXISTS
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

-- Snapshot AFTER — users/students/payments counts must MATCH BEFORE
SELECT 'AFTER' AS stage, 'users' AS tbl, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'AFTER', 'students', COUNT(*) FROM students
UNION ALL SELECT 'AFTER', 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'AFTER', 'doctor_visits', COUNT(*) FROM doctor_visits
UNION ALL SELECT 'AFTER', 'monthly_records', COUNT(*) FROM monthly_records
UNION ALL SELECT 'AFTER', 'initial_reports', COUNT(*) FROM initial_reports
UNION ALL SELECT 'AFTER', 'family_meetings', COUNT(*) FROM family_meetings
UNION ALL SELECT 'AFTER', 'monthly_photos', COUNT(*) FROM monthly_photos
UNION ALL SELECT 'AFTER', 'inquiries', COUNT(*) FROM inquiries
UNION ALL SELECT 'AFTER', 'pickups', COUNT(*) FROM pickups
UNION ALL SELECT 'AFTER', 'psychologist_reports', COUNT(*) FROM psychologist_reports
UNION ALL SELECT 'AFTER', 'cash_entries', COUNT(*) FROM cash_entries;

SHOW COLUMNS FROM users LIKE 'role';
SHOW COLUMNS FROM students LIKE 'admitted_by';
