USE rehab_center;

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
