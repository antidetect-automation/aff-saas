#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 scripts/rebuild_sitemap.py
python3 scripts/quality_check.py
python3 scripts/google_quality_audit.py || true
bash scripts/sync_github_io.sh
(cd worker-bot && npm run deploy)
python3 scripts/indexnow_ping.py
python3 scripts/health_check.py
echo "ship complete"
