#!/usr/bin/env bash
# Run ON THE LIVE SERVER to fix staff/doctor/psych permissions immediately.
set -euo pipefail

ROOT="${1:-/var/www/rehab-center/rehab-center}"
cd "$ROOT"

echo "==> Pulling latest backend..."
git fetch origin main
git checkout main
git pull origin main

echo "==> Restarting API..."
cd backend
npm install --omit=dev
pm2 restart rehab-api --update-env
pm2 save

echo "==> Verifying staff can() locally..."
node -e "
const { can } = require('./src/utils/access');
const checks = [
  ['staff','students', true],
  ['staff','student.basic', true],
  ['staff','inquiries', true],
  ['staff','payments', false],
  ['staff','students.manage', false],
  ['doctor','doctorReport', true],
  ['doctor','payments', false],
  ['psychologist','psychologistReport', true],
  ['psychologist','payments', false],
  ['admin','payments', true],
];
let ok = true;
for (const [role, perm, expect] of checks) {
  const got = can(role, perm);
  const pass = got === expect;
  if (!pass) ok = false;
  console.log((pass ? 'OK ' : 'FAIL'), role, perm, '=>', got, '(want', expect + ')');
}
if (!ok) process.exit(1);
console.log('All permission checks passed.');
"

echo ""
echo "✅ Deploy done. Staff must LOG OUT and LOG IN again, then open Students."
