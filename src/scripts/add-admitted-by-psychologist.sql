USE rehab_center;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'admitted_by'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE students ADD COLUMN admitted_by VARCHAR(120) NULL AFTER referred_by',
  'SELECT ''students.admitted_by already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

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
