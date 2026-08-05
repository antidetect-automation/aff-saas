#!/usr/bin/env python3
"""Publish queued articles to Hashnode (requires publication Pro for mutations)."""
from __future__ import annotations

import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENV = ROOT / ".secrets" / "hashnode.env"
RESULTS = ROOT / "content" / "published" / "HASHNODE_RESULTS.json"
GAP_SEC = 20  # Hashnode less aggressive than Dev.to; still be polite

QUEUE = [
    ("pricing-2026.md", "Multilogin pricing 2026: Free 5 profiles and Pro from ~$7/mo",
     "https://antidetect-automation.github.io/pricing/", ["multilogin", "pricing", "antidetect"]),
    ("vs-adspower.md", "Multilogin vs AdsPower in 2026: API farms vs RPA desks",
     "https://antidetect-automation.github.io/vs/adspower/", ["multilogin", "adspower", "antidetect"]),
    ("playwright-mlx.md", "Playwright + Multilogin X: start a profile and connectOverCDP",
     "https://antidetect-automation.github.io/guides/playwright-mlx/", ["multilogin", "playwright", "javascript"]),
    ("deal-saas50.md", "Multilogin coupon codes SAAS50 and MIN50 (2026)",
     "https://antidetect-automation.github.io/deal/", ["multilogin", "coupon", "antidetect"]),
    ("tools.md", "Free client-side tools for antidetect and Multilogin ops",
     "https://antidetect-automation.github.io/tools/", ["multilogin", "webgl", "proxy"]),
    ("vs-gologin.md", "Multilogin vs GoLogin in 2026: when to graduate",
     "https://antidetect-automation.github.io/vs/gologin/", ["multilogin", "gologin", "antidetect"]),
    ("vs-dolphin.md", "Multilogin vs Dolphin Anty (2026): media-buying SOPs vs scripts",
     "https://antidetect-automation.github.io/vs/dolphin-anty/", ["multilogin", "dolphin", "antidetect"]),
    ("vs-octo.md", "Multilogin vs Octo Browser: social SOPs vs automation spine",
     "https://antidetect-automation.github.io/vs/octo-browser/", ["multilogin", "octo", "antidetect"]),
]


def load_env() -> dict:
    raw = ENV.read_text()
    out = {}
    for line in raw.splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def gql(env: dict, query: str, variables: dict | None = None) -> dict:
    payload = {"query": query, "variables": variables or {}}
    req = urllib.request.Request(
        env["HASHNODE_ENDPOINT"],
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": env["HASHNODE_TOKEN"],
            "User-Agent": "aa-hashnode-pub/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())


def main() -> None:
    env = load_env()
    for need in ("HASHNODE_TOKEN", "HASHNODE_PUBLICATION_ID", "HASHNODE_ENDPOINT"):
        if need not in env:
            sys.exit(f"missing {need} in {ENV}")

    me = gql(env, "query { me { username } }")
    print("me", me)

    results = json.loads(RESULTS.read_text()) if RESULTS.exists() else []
    done = {r["title"] for r in results if r.get("ok")}

    first = True
    for file, title, canonical, tags in QUEUE:
        if title in done:
            print("skip", title)
            continue
        if not first:
            time.sleep(GAP_SEC)
        first = False
        body = (ROOT / "content" / "published" / file).read_text()
        # Prefer originalArticleURL when supported; fall back if schema rejects
        create = gql(
            env,
            """
            mutation($input: CreateDraftInput!) {
              createDraft(input: $input) { draft { id } }
            }
            """,
            {
                "input": {
                    "title": title,
                    "contentMarkdown": body
                    + f"\n\n---\nCanonical: [{canonical}]({canonical})\n",
                    "publicationId": env["HASHNODE_PUBLICATION_ID"],
                    "originalArticleURL": canonical,
                    "tags": [{"slug": t, "name": t} for t in tags[:3]],
                }
            },
        )
        if create.get("errors"):
            # retry without originalArticleURL / tags if validation fails
            err = create["errors"][0].get("message", "")
            print("create err:", err)
            if "Pro plan" in err:
                sys.exit(
                    "Hashnode publication needs Pro for API writes. "
                    "Upgrade at blog dashboard → Billing, then re-run."
                )
            create = gql(
                env,
                """
                mutation($input: CreateDraftInput!) {
                  createDraft(input: $input) { draft { id } }
                }
                """,
                {
                    "input": {
                        "title": title,
                        "contentMarkdown": body + f"\n\nCanonical: {canonical}\n",
                        "publicationId": env["HASHNODE_PUBLICATION_ID"],
                    }
                },
            )
            if create.get("errors"):
                print(json.dumps(create, indent=2)[:1500])
                sys.exit(1)

        draft_id = create["data"]["createDraft"]["draft"]["id"]
        pub = gql(
            env,
            """
            mutation($input: PublishDraftInput!) {
              publishDraft(input: $input) {
                post { id url title }
              }
            }
            """,
            {"input": {"draftId": draft_id}},
        )
        if pub.get("errors"):
            print(json.dumps(pub, indent=2)[:1500])
            sys.exit(1)
        post = pub["data"]["publishDraft"]["post"]
        row = {"ok": True, "title": title, "url": post.get("url"), "id": post.get("id")}
        results.append(row)
        RESULTS.write_text(json.dumps(results, indent=2) + "\n")
        print("OK", post.get("url"))

    print("done")


if __name__ == "__main__":
    main()
