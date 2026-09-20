USE rehab_center;

-- Allow multiple duties per team member (JSON array stored in duty)
ALTER TABLE team_members
  MODIFY COLUMN duty TEXT NULL;
