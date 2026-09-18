#!/usr/bin/env bash
# ONE-SHOT live fix — run on the server that serves http://94.103.163.218/rehab-api
set -euo pipefail

echo "==> Finding rehab-api process..."
pm2 describe rehab-api 2>/dev/null | sed -n '1,40p' || true
echo ""
echo "PM2 cwd candidates:"
pm2 jlist 2>/dev/null | node -e '
let d="";
process.stdin.on("data",c=>d+=c);
process.stdin.on("end",()=>{
  try {
    const list=JSON.parse(d);
    for (const p of list) {
      if (String(p.name||"").includes("rehab")) {
        console.log(p.name, "status="+p.pm2_env?.status, "cwd="+(p.pm2_env?.pm_cwd||p.pm2_env?.cwd), "script="+p.pm2_env?.pm_exec_path);
      }
    }
  } catch(e) { console.log("parse fail", e.message); }
});
' || true

# Prefer known path, else pm2 cwd
ROOT=""
for cand in \
  /var/www/rehab-center/rehab-center \
  /var/www/rehab-center \
  /home/*/rehab-center/rehab-center \
  /root/rehab-center/rehab-center
do
  if [ -f "$cand/backend/server.js" ] || [ -f "$cand/server.js" ]; then
    ROOT="$cand"
    break
  fi
done

if [ -z "$ROOT" ]; then
  ROOT="$(pm2 jlist 2>/dev/null | node -e '
let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{
  try{
    const list=JSON.parse(d);
    const p=list.find(x=>String(x.name||"").includes("rehab"));
    const cwd=p?.pm2_env?.pm_cwd||"";
    process.stdout.write(cwd);
  }catch{}
});')"
fi

echo "==> Using ROOT=$ROOT"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  echo "ERROR: cannot locate rehab project root"
  exit 1
fi

cd "$ROOT"
if [ -d backend ]; then
  APP="$ROOT/backend"
else
  APP="$ROOT"
fi

echo "==> APP=$APP"
cd "$APP"

if [ -d .git ] || [ -d ../.git ]; then
  echo "==> git pull"
  (cd "$ROOT" && git fetch origin main && git checkout main && git pull origin main) || true
fi

echo "==> Writing access.js hard allow (belt + suspenders)..."
# Ensure files from git are loaded; delete require cache via full restart
npm install --omit=dev 2>/dev/null || true

echo "==> Hard PM2 restart (delete + start to clear require cache)"
pm2 delete rehab-api 2>/dev/null || true
pm2 start server.js --name rehab-api --update-env
pm2 save

sleep 1
echo "==> Local can() check"
node -e "
const { can } = require('./src/utils/access');
console.log('staff students', can('staff','students'));
console.log('staff inquiries', can('staff','inquiries'));
if (!can('staff','students') || !can('staff','inquiries')) process.exit(1);
"

echo "==> Hit public health (should show accessVersion roles-v4)"
curl -sS http://127.0.0.1:\${PORT:-5000}/api/health 2>/dev/null || curl -sS http://127.0.0.1:4000/api/health 2>/dev/null || true
echo ""
echo "Also check: curl -sS http://94.103.163.218/rehab-api/api/health"
echo "DONE. Staff must logout/login once."
