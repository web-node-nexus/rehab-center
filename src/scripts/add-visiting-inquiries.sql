-- Additive only. Creates inquiries if missing, then adds looking_for if needed.

USE rehab_center;

CREATE TABLE IF NOT EXISTS inquiries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  address TEXT NULL,
  phone VARCHAR(30) NULL,
  looking_for VARCHAR(120) NULL,
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

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inquiries' AND COLUMN_NAME = 'looking_for'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE inquiries ADD COLUMN looking_for VARCHAR(120) NULL AFTER phone',
  'SELECT ''inquiries.looking_for already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
