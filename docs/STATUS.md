# Project status

Updated: 2026-08-05 Google-quality wave 20

## Goal
Maximize Google checklist / CWV / helpful-content readiness (heuristic score in `scripts/google_quality_audit.py`).

## Wave 20
- Compressed social image → `og.jpg` (~69KB; was ~1.4MB PNG)
- CSS: contrast, focus-visible, 44px touch, reduced-motion
- Home: Why #1 + Quick FAQ + FAQPage schema; CSS preload
- Hubs deepened; pricing/deal FAQ schema; sitewide apple-touch + theme-color + robots
- Privacy / security / humans already present; audit hooked into `ship.sh`

## Owner wake-up (still outside code)
1. Confirm GSC ownership + submit sitemap
2. CrUX/CWV field data appears after traffic (PSI lab ≠ ranking alone)
3. Syndication / bot avatar

## Score
Run: `python3 scripts/google_quality_audit.py`
