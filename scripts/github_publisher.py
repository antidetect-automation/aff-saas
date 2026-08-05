#!/usr/bin/env python3
"""
Local/Actions helper: publish a digest Markdown+HTML pair to aff-saas via GitHub API.
Mirrors worker-bot/src/githubPublisher.js — no git CLI.

Env (.env or shell):
  GITHUB_TOKEN   required
  GITHUB_OWNER   default antidetect-automation
  GITHUB_REPO    default aff-saas
  GITHUB_BRANCH  default main

Usage:
  python3 scripts/github_publisher.py --title "..." --body-file /tmp/post.txt
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HUB = "https://antidetect-automation.github.io"
BOT = "https://t.me/antidetect_automation_bot"
AFF = "https://multilogin.com?a_aid=saas"

AFFILIATE_CTA_MD = "\n".join(
    [
        "> **Multilogin desk deal (~50% off)**",
        "> - Browser → promo code **SAAS50**",
        "> - Cloud Phone → promo code **MIN50**",
        f"> - Grab codes: {BOT}?start=aa_digest",
        f"> - Open Multilogin (partner): {AFF}",
        f"> - Deal notes: {HUB}/deal/",
        ">",
        "> Independent partner desk — not Multilogin Support.",
    ]
)


def load_dotenv() -> None:
    for candidate in (Path(".env"), Path("worker-bot/.env"), Path("/tmp/aa-bot-secrets.env")):
        if not candidate.is_file():
            continue
        for line in candidate.read_text().splitlines():
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def slugify(title: str) -> str:
    s = re.sub(r"[\u0300-\u036f]", "", title.lower())
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return (s or "desk-note")[:80]


def yaml_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


def telegram_to_md(body: str) -> str:
    t = re.sub(r"\n———[\s\S]*$", "", body.strip())
    out: list[str] = []
    first = True
    for line in t.splitlines():
        s = line.strip()
        if not s:
            out.append("")
            continue
        if re.match(r"^(#[\w]+(?:\s+#[\w]+)*)$", s, re.I):
            continue
        if first and not s.startswith(("•", "-", ">")):
            headline = re.sub(r"^\*\*(.+)\*\*$", r"\1", s)
            out.append(f"# {headline}")
            first = False
            continue
        first = False
        if s.startswith("•"):
            out.append(f"- {s[1:].strip()}")
        else:
            out.append(s)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()


def build_markdown(title: str, body: str, date_iso: str) -> str:
    tags = ["multilogin", "antidetect"]
    fm = "\n".join(
        [
            "---",
            f'title: "{yaml_escape(title)}"',
            f"date: {date_iso}",
            "categories: [Antidetect, E-commerce]",
            f"tags: [{', '.join(tags)}]",
            "layout: post",
            f"canonical: {HUB}/digest/{slugify(title)}/",
            "---",
            "",
        ]
    )
    return f"{fm}{telegram_to_md(body)}\n\n{AFFILIATE_CTA_MD}\n"


def gh(method: str, path: str, token: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "aa-github-publisher-py",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:400]
        raise SystemExit(f"GitHub API {e.code}: {err}") from e


def commit_files(token: str, owner: str, repo: str, branch: str, files: list[dict], message: str) -> str:
    ref = gh("GET", f"/repos/{owner}/{repo}/git/ref/heads/{branch}", token)
    base_sha = ref["object"]["sha"]
    base_commit = gh("GET", f"/repos/{owner}/{repo}/git/commits/{base_sha}", token)
    base_tree = base_commit["tree"]["sha"]
    tree = []
    for f in files:
        blob = gh(
            "POST",
            f"/repos/{owner}/{repo}/git/blobs",
            token,
            {
                "content": base64.b64encode(f["content"].encode()).decode(),
                "encoding": "base64",
            },
        )
        tree.append({"path": f["path"], "mode": "100644", "type": "blob", "sha": blob["sha"]})
    new_tree = gh(
        "POST",
        f"/repos/{owner}/{repo}/git/trees",
        token,
        {"base_tree": base_tree, "tree": tree},
    )
    new_commit = gh(
        "POST",
        f"/repos/{owner}/{repo}/git/commits",
        token,
        {"message": message, "tree": new_tree["sha"], "parents": [base_sha]},
    )
    gh(
        "PATCH",
        f"/repos/{owner}/{repo}/git/refs/heads/{branch}",
        token,
        {"sha": new_commit["sha"]},
    )
    return new_commit["sha"]


def main() -> None:
    load_dotenv()
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--body-file", required=True)
    args = p.parse_args()

    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        sys.exit("Set GITHUB_TOKEN")
    owner = os.environ.get("GITHUB_OWNER", "antidetect-automation")
    repo = os.environ.get("GITHUB_REPO", "aff-saas")
    branch = os.environ.get("GITHUB_BRANCH", "main")

    body = Path(args.body_file).read_text()
    now = datetime.now(timezone.utc)
    day = now.strftime("%Y-%m-%d")
    slug = f"{day}-{slugify(args.title)}"
    md = build_markdown(args.title, body, now.isoformat())
    # Minimal HTML shell — prefer Worker path for full template
    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>{args.title}</title>
<link rel="canonical" href="{HUB}/digest/{slug}/"/><link rel="stylesheet" href="/assets/site.css"/></head>
<body><article class="long"><h1>{args.title}</h1><pre>{telegram_to_md(body)}</pre>
<p><a href="{BOT}?start=aa_digest">Get SAAS50 / MIN50</a> · <a href="{AFF}">Multilogin</a></p>
</article></body></html>
"""
    sha = commit_files(
        token,
        owner,
        repo,
        branch,
        [
            {"path": f"content/digest/_posts/{slug}.md", "content": md},
            {"path": f"site/digest/{slug}/index.html", "content": html},
        ],
        f"content(digest): {slugify(args.title)[:60]}",
    )
    print(json.dumps({"ok": True, "commit": sha, "url": f"{HUB}/digest/{slug}/"}, indent=2))


if __name__ == "__main__":
    main()
