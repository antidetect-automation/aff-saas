#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 scripts/rebuild_sitemap.py
python3 scripts/quality_check.py
bash scripts/sync_github_io.sh
(cd worker-bot && npm run deploy)
python3 scripts/indexnow_ping.py
echo "ship complete"
