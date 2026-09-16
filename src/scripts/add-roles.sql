USE rehab_center;

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'doctor', 'staff', 'psychologist') NOT NULL DEFAULT 'admin';
