/**
 * Publish digest notes to aff-saas via GitHub REST / Git Data API (no git CLI).
 * Writes:
 *   content/digest/_posts/YYYY-MM-DD-slug.md  — Markdown + YAML frontmatter
 *   site/digest/YYYY-MM-DD-slug/index.html    — live GitHub Pages page
 *
 * Auth: env.GITHUB_TOKEN (wrangler secret). Optional: GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH.
 */

const HUB = "https://antidetect-automation.github.io";
const BOT = "https://t.me/antidetect_automation_bot";
const AFF = "https://multilogin.com?a_aid=saas";

const DEFAULT_OWNER = "antidetect-automation";
const DEFAULT_REPO = "aff-saas";
const DEFAULT_BRANCH = "main";

/** Desk CTA — matches current affiliate funnel (no bypass claims). */
export const AFFILIATE_CTA_MD = [
  "> **Multilogin desk deal (~50% off)**",
  "> - Browser → promo code **SAAS50**",
  "> - Cloud Phone → promo code **MIN50**",
  `> - Grab codes: ${BOT}?start=aa_digest`,
  `> - Open Multilogin (partner): ${AFF}`,
  `> - Deal notes: ${HUB}/deal/`,
  ">",
  "> Independent partner desk — not Multilogin Support.",
].join("\n");

function cfg(env) {
  return {
    token: String(env.GITHUB_TOKEN || "").trim(),
    owner: String(env.GITHUB_OWNER || DEFAULT_OWNER).trim(),
    repo: String(env.GITHUB_REPO || DEFAULT_REPO).trim(),
    branch: String(env.GITHUB_BRANCH || DEFAULT_BRANCH).trim(),
  };
}

export function slugifyTitle(title) {
  const s = String(title || "desk-note")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (s || "desk-note").slice(0, 80);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yamlEscape(s) {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");
}

/** Telegram body → Markdown (light). Drops emoji-heavy footer if present. */
export function telegramBodyToMarkdown(body) {
  let t = String(body || "").trim();
  t = t.replace(/\n———[\s\S]*$/m, "").trim();
  const lines = t.split("\n");
  const out = [];
  let first = true;
  for (const line of lines) {
    const s = line.trim();
    if (!s) {
      out.push("");
      continue;
    }
    if (/^(#[\w]+(?:\s+#[\w]+)*)$/i.test(s)) {
      // skip hashtag-only lines in MD body (tags go in frontmatter)
      continue;
    }
    if (first && !s.startsWith("•") && !s.startsWith("-") && !s.startsWith(">")) {
      const headline = s.replace(/^\*\*(.+)\*\*$/, "$1");
      out.push(`# ${headline}`);
      first = false;
      continue;
    }
    first = false;
    if (s.startsWith("•")) {
      out.push(`- ${s.slice(1).trim()}`);
      continue;
    }
    out.push(s.replace(/\*\*(.+?)\*\*/g, "**$1**"));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function tagsFromItem(item, hashtagLine) {
  const fromHash = String(hashtagLine || "")
    .match(/#[a-z0-9_]+/gi)
    ?.map((t) => t.slice(1).toLowerCase()) || [];
  const fromCats = (item.categories || [])
    .map((c) =>
      String(c)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    )
    .filter(Boolean);
  return [...new Set(["multilogin", "antidetect", ...fromCats, ...fromHash])].slice(
    0,
    12
  );
}

export function buildDigestMarkdown({ title, dateIso, body, item, tags, slug }) {
  const date = dateIso || new Date().toISOString();
  const mdBody = telegramBodyToMarkdown(body);
  const tagList = tags || tagsFromItem(item, body);
  const pageSlug = slug || `${date.slice(0, 10)}-${slugifyTitle(title)}`;
  const fm = [
    "---",
    `title: "${yamlEscape(title)}"`,
    `date: ${date}`,
    "categories: [Antidetect, E-commerce]",
    `tags: [${tagList.map((t) => yamlEscape(t)).join(", ")}]`,
    "layout: post",
    `canonical: ${HUB}/digest/${pageSlug}/`,
    "---",
    "",
  ].join("\n");
  return `${fm}${mdBody}\n\n${AFFILIATE_CTA_MD}\n`;
}

function mdInlineToHtml(line) {
  return escapeHtml(line).replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );
}

export function buildDigestHtml({ title, dateIso, body, slug }) {
  const date = (dateIso || new Date().toISOString()).slice(0, 10);
  const md = telegramBodyToMarkdown(body);
  const parts = [];
  for (const line of md.split("\n")) {
    const s = line.trim();
    if (!s) continue;
    if (s.startsWith("# ")) {
      parts.push(`<h1>${mdInlineToHtml(s.slice(2))}</h1>`);
      continue;
    }
    if (s.startsWith("- ")) {
      parts.push(`<li>${mdInlineToHtml(s.slice(2))}</li>`);
      continue;
    }
    parts.push(`<p>${mdInlineToHtml(s)}</p>`);
  }
  // Wrap consecutive <li>
  let htmlBody = "";
  let inUl = false;
  for (const p of parts) {
    if (p.startsWith("<li>")) {
      if (!inUl) {
        htmlBody += "<ul>\n";
        inUl = true;
      }
      htmlBody += `  ${p}\n`;
    } else {
      if (inUl) {
        htmlBody += "</ul>\n";
        inUl = false;
      }
      htmlBody += `${p}\n`;
    }
  }
  if (inUl) htmlBody += "</ul>\n";

  const desc = escapeHtml(
    telegramBodyToMarkdown(body)
      .replace(/^#\s+.+\n*/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155)
  );
  const safeTitle = escapeHtml(title);
  const path = `/digest/${slug}/`;
  const url = `${HUB}${path}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0c1117" />
  <title>${safeTitle} — antidetect-automation</title>
  <meta name="description" content="${desc}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${HUB}/assets/og.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/site.css" />
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":${JSON.stringify(title)},"datePublished":${JSON.stringify(date)},"url":${JSON.stringify(url)}}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="top">
    <a class="brand" href="/">antidetect-automation</a>
    <nav>
      <a href="/digest/">Digest</a>
      <a href="/deal/">Deal</a>
      <a href="/pricing/">Pricing</a>
    </nav>
  </header>
  <article id="main" class="long">
    <p class="eyebrow">Desk digest · ${escapeHtml(date)}</p>
${htmlBody}
    <div class="note">
      <strong>Multilogin desk deal (~50% off)</strong><br />
      Browser → <code>SAAS50</code> · Cloud Phone → <code>MIN50</code><br />
      <a class="btn primary" href="${BOT}?start=aa_digest">Get codes on Telegram</a>
      <a class="btn ghost" href="${AFF}">Open Multilogin</a>
      <a class="btn ghost" href="/deal/">How the deal works</a>
    </div>
    <p class="lede">Independent partner desk — not Multilogin Support. We may earn a commission via codes/links.</p>
  </article>
  <footer class="foot"><p><a href="/digest/">All digests</a> · <a href="/">Hub</a></p></footer>
</body>
</html>
`;
}

async function ghJson(env, path, { method = "GET", body } = {}) {
  const { token } = cfg(env);
  if (!token) throw new Error("missing_GITHUB_TOKEN");
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "aa-mlx-digest-publisher",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    const msg = data?.message || text.slice(0, 200) || res.statusText;
    const err = new Error(`github_${res.status}: ${msg}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function b64(str) {
  // Workers: btoa needs binary string; handle UTF-8
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Multi-file commit on a branch using Git Data API (no local git).
 * @param {object} env
 * @param {{ path: string, content: string }[]} files
 * @param {string} message
 */
export async function commitFiles(env, files, message) {
  const { owner, repo, branch } = cfg(env);
  if (!files?.length) return { ok: false, reason: "no_files" };

  const ref = await ghJson(env, `/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const baseSha = ref.object?.sha;
  if (!baseSha) throw new Error("github_no_base_sha");

  const baseCommit = await ghJson(env, `/repos/${owner}/${repo}/git/commits/${baseSha}`);
  const baseTree = baseCommit.tree?.sha;
  if (!baseTree) throw new Error("github_no_base_tree");

  const tree = [];
  for (const f of files) {
    const blob = await ghJson(env, `/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      body: { content: b64(f.content), encoding: "base64" },
    });
    tree.push({
      path: f.path.replace(/^\/+/, ""),
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const newTree = await ghJson(env, `/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: { base_tree: baseTree, tree },
  });

  const newCommit = await ghJson(env, `/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: {
      message,
      tree: newTree.sha,
      parents: [baseSha],
    },
  });

  await ghJson(env, `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: { sha: newCommit.sha },
  });

  return {
    ok: true,
    owner,
    repo,
    branch,
    commit_sha: newCommit.sha,
    paths: files.map((f) => f.path),
  };
}

/**
 * After Telegram success: publish Markdown + HTML into aff-saas.
 */
export async function publishDigestToGithub(env, { title, body, item }) {
  if (!cfg(env).token) {
    return { ok: false, skipped: "no_GITHUB_TOKEN" };
  }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const slugBase = slugifyTitle(title);
  const slug = `${day}-${slugBase}`;
  const dateIso = now.toISOString();

  const markdown = buildDigestMarkdown({
    title,
    dateIso,
    body,
    item,
    slug,
  });
  const html = buildDigestHtml({
    title,
    dateIso,
    body,
    slug,
  });

  const mdPath = `content/digest/_posts/${slug}.md`;
  const htmlPath = `site/digest/${slug}/index.html`;

  try {
    const result = await commitFiles(
      env,
      [
        { path: mdPath, content: markdown },
        { path: htmlPath, content: html },
      ],
      `content(digest): ${slugBase.slice(0, 60)}`
    );
    return {
      ...result,
      slug,
      url: `${HUB}/digest/${slug}/`,
      markdown_path: mdPath,
      html_path: htmlPath,
    };
  } catch (e) {
    return {
      ok: false,
      error: String(e?.message || e),
      status: e?.status,
      slug,
      markdown_path: mdPath,
      html_path: htmlPath,
    };
  }
}
