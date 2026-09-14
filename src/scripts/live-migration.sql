-- Rebirth live DB — ADDITIVE ONLY
-- Existing students, users, visits, reports stay untouched.
-- Safe to re-run. No DROP / TRUNCATE / DELETE.

USE rehab_center;

-- -------------------------------------------------
-- 1) Doctor checkup report column (existing table)
-- -------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'doctor_visits'
    AND COLUMN_NAME = 'checkup_report'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE doctor_visits ADD COLUMN checkup_report VARCHAR(500) NULL AFTER prescription_image',
  'SELECT ''doctor_visits.checkup_report already exists'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -------------------------------------------------
-- 2) Payments
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  for_month INT UNSIGNED NOT NULL,
  for_year INT UNSIGNED NOT NULL,
  method ENUM('cash','upi','bank','card','other') NOT NULL DEFAULT 'cash',
  receipt_no VARCHAR(80) NULL,
  receipt_image VARCHAR(500) NULL,
  notes TEXT NULL,
  received_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_student (student_id),
  KEY idx_payments_date (payment_date),
  KEY idx_payments_period (for_year, for_month),
  CONSTRAINT fk_payments_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payments_received_by
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------
-- 3) Family meetings (max 4 per student in app)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS family_meetings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_no INT UNSIGNED NOT NULL DEFAULT 1,
  attendees VARCHAR(255) NULL,
  notes TEXT NULL,
  next_meeting_date DATE NULL,
  added_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_family_meetings_student (student_id),
  KEY idx_family_meetings_date (meeting_date),
  CONSTRAINT fk_family_meetings_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_family_meetings_added_by
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------
-- 4) Monthly student photos
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_photos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  month INT UNSIGNED NOT NULL,
  year INT UNSIGNED NOT NULL,
  photo VARCHAR(500) NOT NULL,
  notes TEXT NULL,
  taken_at DATE NULL,
  added_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY monthly_photos_student_period_unique (student_id, year, month),
  CONSTRAINT fk_monthly_photos_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_monthly_photos_added_by
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------
-- Verify (old + new counts)
-- -------------------------------------------------
SELECT 'users' AS tbl, COUNT(*) AS rows_kept FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'initial_reports', COUNT(*) FROM initial_reports
UNION ALL SELECT 'monthly_records', COUNT(*) FROM monthly_records
UNION ALL SELECT 'doctor_visits', COUNT(*) FROM doctor_visits
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'family_meetings', COUNT(*) FROM family_meetings
UNION ALL SELECT 'monthly_photos', COUNT(*) FROM monthly_photos;
