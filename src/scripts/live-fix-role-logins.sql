USE rehab_center;

-- Device sessions (active mobile logins). Additive only.
CREATE TABLE IF NOT EXISTS device_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  device_id VARCHAR(80) NOT NULL,
  device_name VARCHAR(160) NULL,
  platform VARCHAR(40) NULL,
  app_version VARCHAR(40) NULL,
  last_seen_at DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_device (user_id, device_id),
  KEY idx_device_user (user_id),
  KEY idx_device_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure role ENUM supports staff/psychologist
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','doctor','staff','psychologist') NOT NULL DEFAULT 'admin';

-- Create / reset role accounts (passwords: Doctor@123, Staff@123, Psych@123)
-- Hashes generated with bcrypt; does NOT delete any existing student/payment data.

INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES
  ('Doctor', 'doctor@rehabcenter.com', '$2a$10$dD.7/lx2Ztdp7MdZPgQKRult/L/RPlvyp5oIikmmn3S3veLa6o09a', 'doctor', NOW(), NOW()),
  ('Staff', 'staff@rehabcenter.com', '$2a$10$sQiRL/96RslacAuV0ePG3eWFOp5YLzYB/hzunw5JULV5q067K9.AG', 'staff', NOW(), NOW()),
  ('Psychologist', 'psychologist@rehabcenter.com', '$2a$10$OsoXXJZqRdkOy3DTLAS28endNYAbFIibktf0KJPe7Uquv8WmQlGr.', 'psychologist', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role = VALUES(role),
  name = VALUES(name),
  updated_at = NOW();

SELECT id, name, email, role FROM users ORDER BY id;
