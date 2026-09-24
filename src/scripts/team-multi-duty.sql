USE rehab_center;

-- duty pe index hai — TEXT ke liye pehle drop, phir prefix index
ALTER TABLE team_members DROP INDEX idx_team_duty;

ALTER TABLE team_members
  MODIFY COLUMN duty TEXT NULL;

ALTER TABLE team_members
  ADD INDEX idx_team_duty (duty(191));
