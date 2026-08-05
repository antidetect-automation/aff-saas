#!/usr/bin/env bash
# Sync aff-saas/site → antidetect-automation.github.io (preserves .github)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="${TMPDIR:-/tmp}/aa-gh-pages-sync"
rm -rf "$TMP"
git clone --depth 1 https://github.com/antidetect-automation/antidetect-automation.github.io.git "$TMP"
find "$TMP" -mindepth 1 -maxdepth 1 ! -name '.git' ! -name '.github' -exec rm -rf {} +
cp -R "$ROOT/site/." "$TMP/"
if [[ -f "$ROOT/.github/pages-site-workflow/pages.yml" ]]; then
  mkdir -p "$TMP/.github/workflows"
  cp "$ROOT/.github/pages-site-workflow/pages.yml" "$TMP/.github/workflows/pages.yml"
fi
cd "$TMP"
git add -A
if git diff --cached --quiet; then
  echo "No site changes"
  exit 0
fi
git commit -m "chore: sync site from aff-saas"
git push origin HEAD:main
echo "Synced to github.io"
