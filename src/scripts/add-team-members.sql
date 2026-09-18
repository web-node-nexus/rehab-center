USE rehab_center;

CREATE TABLE IF NOT EXISTS team_members (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  photo VARCHAR(500) NULL,
  name VARCHAR(160) NOT NULL,
  mobile VARCHAR(30) NULL,
  date_of_birth DATE NULL,
  sober_since DATE NULL,
  qualification VARCHAR(200) NULL,
  staff_id VARCHAR(40) NULL,
  duty VARCHAR(80) NULL,
  duty_other VARCHAR(160) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  added_by INT UNSIGNED NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_team_status (status),
  KEY idx_team_duty (duty),
  KEY idx_team_staff_id (staff_id),
  KEY idx_team_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
