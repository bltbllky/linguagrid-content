#!/usr/bin/env bash
# Post-deploy check for T-339: 200 for audio/index.json and one file per level; prints the public/ size.
# Usage: bash scripts/check-pages.sh [base-url]   (run after `npm run build-site` to get the size line)
set -euo pipefail
BASE="${1:-https://bltbllky.github.io/linguagrid-content}"
BASE="${BASE%/}"
cd "$(dirname "$0")/.."
fail=0
check() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -I "$BASE/$1")
  echo "$code $1"
  [ "$code" = 200 ] || fail=1
}
check audio/index.json
for level in A1 A2 B1; do
  first=$(node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('audio/$level/index.json','utf8')).files)[0])")
  check "audio/$level/$first.m4a"
done
if [ -d public ]; then
  kb=$(du -sk public | cut -f1)
  echo "public/ size: $((kb / 1024)) MB of 1024 MB (Pages limit 1 GB)"
fi
echo "checked at $(date -u +%FT%TZ)"
exit $fail
