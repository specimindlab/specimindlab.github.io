#!/usr/bin/env node
// Builds the SPECIMIND catalog into site/_site (deployed by .github/workflows/pages.yml).
// Plain HTML + one inlined stylesheet, no framework, no dependencies, no third-party requests.
//
//   node site/build.mjs                       real build from data/catalog.json
//   node site/build.mjs --catalog site/fixtures/catalog.fixture.json --out /tmp/x   design fixture (never deploy)
//
// Pages: / (the drawer) · /<code>/ for every specimen and group · /about/ · /404.html · /llms.txt ·
// /sitemap.xml · /robots.txt. Catalog fields are documented in data/catalog.json ("fields").
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const catalogPath = arg("--catalog", join(root, "data/catalog.json"));
const out = arg("--out", join(here, "_site"));
const SITE = "https://specimindlab.github.io";
const HANDLE = "specimindlab";
const PROFILES = {
  YouTube: `https://www.youtube.com/@${HANDLE}`,
  Instagram: `https://www.instagram.com/${HANDLE}/`,
  X: `https://x.com/${HANDLE}`,
};
const read = (p) => readFileSync(p, "utf8");
const catalog = JSON.parse(read(catalogPath));
const FIXTURE = catalog.fixture === true;
const schedule = JSON.parse(read(join(root, "data/schedule.json")));
const metrics = JSON.parse(read(join(root, "video/src/system/caption-metrics.json")));
const CSS = read(join(here, "src/site.css")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, "\n").trim();
const minJs = (s) => s.replace(/^\s*\/\/.*$/gm, "").replace(/\n\s*\n/g, "\n").trim();
const DRAWER_JS = minJs(read(join(here, "src/drawer.js")));
const SPECIMEN_JS = minJs(read(join(here, "src/specimen.js")));
const today = new Date().toISOString().slice(0, 10);

// ---------- validation: a bad catalog edit fails the build instead of shipping a broken page ----------
const VERDICTS = ["Captured", "Released", "Watch"];
const RATING = { Captured: 4, Watch: 3, Released: 2 }; // out of 5 (JSON-LD Review)
const KINDS = { P: "Plate", D: "Dissection", M: "Mimicry", W: "Drawer", X: "Extinction Watch" };
const KIND_LINE = {
  Plate: "Same input, three tools, ranked side by side.",
  Dissection: "One finished thing, made by chaining tools stage by stage.",
  Mimicry: "AI or real? Two images, one reveal.",
  Drawer: "The week's specimens, recapped in one drawer.",
  "Extinction Watch": "A tool that died or changed, and what replaced it.",
};
const specimens = catalog.specimens ?? [];
const groups = catalog.groups ?? [];
const errors = [];
const seen = new Set();
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d ?? "");
const isUrl = (u) => !u || /^https:\/\/[^\s"<>]+$/.test(u);
for (const s of specimens) {
  const at = `specimen ${s.code ?? "?"}`;
  if (!/^\d{3}$/.test(s.code ?? "")) errors.push(`${at}: code must be three digits`);
  if (seen.has(s.code)) errors.push(`${at}: duplicate code`);
  seen.add(s.code);
  if (!s.tool) errors.push(`${at}: tool is required`);
  if (!VERDICTS.includes(s.verdict)) errors.push(`${at}: verdict must be one of ${VERDICTS.join(", ")}`);
  if (s.verdict === "Watch" && s.mode !== "Field sketch") errors.push(`${at}: Watch is for Field sketches only`);
  if (!["Affiliate", "Unpaid"].includes(s.disclosure)) errors.push(`${at}: disclosure must be Affiliate or Unpaid`);
  if (!isDate(s.tested_on)) errors.push(`${at}: tested_on must be YYYY-MM-DD`);
  if (s.affiliate_url && s.disclosure !== "Affiliate") errors.push(`${at}: affiliate_url set but disclosure is not Affiliate`);
  for (const u of [s.affiliate_url, s.homepage, ...Object.values(s.links ?? {})]) if (!isUrl(u)) errors.push(`${at}: not an https URL: ${u}`);
}
for (const g of groups) {
  const at = `group ${g.code ?? "?"}`;
  if (!/^[PDMWX]\d{2}$/.test(g.code ?? "")) errors.push(`${at}: code must be P##, D##, M##, W## or X##`);
  else if (g.kind !== KINDS[g.code[0]]) errors.push(`${at}: kind must be "${KINDS[g.code[0]]}"`);
  if (seen.has(g.code)) errors.push(`${at}: duplicate code`);
  seen.add(g.code);
  if (!Array.isArray(g.members) || !g.members.length) errors.push(`${at}: members[] is required`);
  for (const m of g.members ?? []) if (m.code && !/^\d{3}$/.test(m.code)) errors.push(`${at}: member code ${m.code} is not a specimen code`);
  if (!["Affiliate", "Unpaid"].includes(g.disclosure)) errors.push(`${at}: disclosure must be Affiliate or Unpaid`);
  if (!isDate(g.tested_on)) errors.push(`${at}: tested_on must be YYYY-MM-DD`);
}
if (errors.length) {
  console.error(`catalog errors in ${catalogPath}:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
const byCode = new Map(specimens.map((s) => [s.code, s]));
const num = (s) => parseInt(s.code, 10);
const newest = [...specimens].sort((a, b) => (b.posted_on || b.tested_on).localeCompare(a.posted_on || a.tested_on) || num(b) - num(a))[0];

// ---------- helpers ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d) => (isDate(d) ? `${+d.slice(8)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : "");
const rot = (code) => {
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) % 997;
  return ((h / 997) * 5 - 2.5).toFixed(1); // -2.5..2.5 deg, stable per code (the video drawer's jitter)
};
// Drawer tones as in the video's Drawer: Captured ink, Watch steel, Released only the dashed outline
// of where its label was; the newest pin is red (unless it was released).
const tone = (s) => (s.verdict === "Released" ? "outline" : s === newest ? "red" : s.verdict === "Watch" ? "steel" : "ink");
const tag = (code, t = "red", r = rot(code)) => `<span class="pinned ${t}" style="--r:${r}deg" aria-hidden="true"><span class="tag">${esc(code)}</span></span>`;
const stamp = (verdict, extra = "") => `<span class="stamp ${verdict} ${extra}"><span>${esc(verdict)}</span></span>`;
const plain = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const sentence = (s) => {
  s = plain(s);
  return s && !/[.!?]$/.test(s) ? `${s}.` : s;
};
const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

// Edge-to-edge caption lines (the brand signature), sized with container units from the glyph
// metrics of the caption instance (wdth 60, wght 850), so line heights never shift when the font loads.
const G = metrics.glyphs;
const fitLine = (line) => {
  const chars = [...line.trim()];
  const g = (c) => G[c] ?? G["?"];
  const adv = chars.reduce((a, c) => a + g(c)[0], 0);
  const first = g(chars[0]);
  const last = g(chars[chars.length - 1]);
  const lsb = first[1];
  const ink = adv - lsb - (last[0] - last[2]);
  return `<span style="--k:${(1 / ink).toFixed(4)};--l:${lsb.toFixed(4)}">${esc(line.trim())}</span>`;
};
const fit = (lines, cls = "") => `<p class="fit ${cls}">${lines.filter(Boolean).map(fitLine).join(" ")}</p>`;

const INK_CIRCLE = `<svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M34 9C92-1 188 4 194 27c5 24-70 31-124 29C22 54 4 43 6 29 9 14 44 6 104 5"/></svg>`;
const ARROW = `<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 14 14 4M6 4h8v8" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`;
const PLAY = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5v13L14 8z" fill="currentColor"/></svg>`;
const MARK = `<svg viewBox="0 0 64 64" aria-hidden="true"><line x1="49" y1="31" x2="45.5" y2="54" stroke="#8C938D" stroke-width="1.6" stroke-linecap="round"/><g transform="rotate(-9 32 33)"><rect x="6" y="21" width="47" height="24" fill="#C4122F"/><rect x="7.7" y="22.7" width="43.6" height="20.6" fill="none" stroke="#F2F3EC" stroke-opacity=".85" stroke-width=".9"/><text x="13" y="39.5" font-family="Anybody,sans-serif" font-size="16" font-weight="900" font-stretch="140%" fill="#F2F3EC">Nº</text></g><line x1="54" y1="6" x2="49" y2="31" stroke="#8C938D" stroke-width="1.6" stroke-linecap="round"/><circle cx="54" cy="6" r="4.2" fill="#151612"/><circle cx="52.6" cy="4.6" r="1.1" fill="#F2F3EC" fill-opacity=".55"/></svg>`;

// ---------- affiliate links ----------
// Sub-ID parameter per network, detected from the tracking link. affiliate_subid_param in the
// catalog overrides it ("" = the network has no sub-IDs, leave the link alone).
const NETWORKS = [
  { name: "impact.com", param: "subId1", test: (u) => /^\/c\/\d+\/\d+\/\d+/.test(u.pathname) },
  { name: "PartnerStack", param: "sid", test: (u) => /(^|\.)(partnerlinks\.io|grsm\.io)$/.test(u.hostname) },
  { name: "FirstPromoter", param: "fp_sid", test: (u) => u.searchParams.has("fpr") },
  { name: "CJ", param: "sid", test: (u) => /(^|\.)(anrdoezrs\.net|dpbolvw\.net|jdoqocy\.com|kqzyfj\.com|tkqlhce\.com|qksrv\.net)$/.test(u.hostname) },
  { name: "ShareASale", param: "afftrack", test: (u) => /(^|\.)shareasale\.com$/.test(u.hostname) },
  { name: "Awin", param: "clickref", test: (u) => /(^|\.)awin1\.com$/.test(u.hostname) },
  { name: "Rakuten", param: "u1", test: (u) => /(^|\.)linksynergy\.com$/.test(u.hostname) },
];
const subidParam = (s) => {
  if (typeof s.affiliate_subid_param === "string") return s.affiliate_subid_param;
  const u = new URL(s.affiliate_url);
  return NETWORKS.find((n) => n.test(u))?.param ?? "";
};
const epNum = (s) => String(s.episode ?? s.code).replace(/^E/i, "").toLowerCase();
const tryLink = (s) => {
  if (s.affiliate_url) {
    const param = subidParam(s);
    const u = new URL(s.affiliate_url);
    if (param) u.searchParams.set(param, `p-web-e${epNum(s)}`);
    const sub = param ? ` data-subid="${esc(param)}" data-ep="${esc(epNum(s))}"` : "";
    return `<a class="btn" href="${esc(u.href)}" rel="sponsored noopener"${sub}>Try ${esc(s.tool)} ${ARROW}</a>
      <p class="btn-note">Affiliate link: SPECIMIND may earn a commission if you sign up. It costs you nothing extra.</p>`;
  }
  if (s.homepage) {
    return `<a class="btn" href="${esc(s.homepage)}" rel="noopener">Try ${esc(s.tool)} ${ARROW}</a>
      <p class="btn-note">Plain link to ${esc(s.tool)}'s homepage. SPECIMIND earns nothing from it.</p>`;
  }
  return "";
};

const disclosureText = (s) => {
  const tool = esc(s.tool ?? s.title);
  const more = ` <a href="/about/#disclosure">Full disclosure</a>.`;
  if (s.members && s.disclosure === "Affiliate") {
    return `<b>Disclosure.</b> Affiliate. SPECIMIND is an affiliate of at least one tool in this episode. This page has no affiliate links itself; a specimen's own page marks any affiliate link it carries. The commission never decides a ranking or a verdict.${more}`;
  }
  if (s.members) return `<b>Disclosure.</b> Unpaid. There are no affiliate links on this page, and no tool in it paid for this test.${more}`;
  if (s.disclosure === "Affiliate" && s.affiliate_url) {
    return `<b>Disclosure.</b> Some links on this page are affiliate links. If you sign up or pay through them, SPECIMIND may earn a commission, at no extra cost to you. The commission never decides the verdict: the test is run once, the flaw is shown either way, and a tool with an affiliate programme can still be Released.${more}`;
  }
  if (s.disclosure === "Affiliate") {
    return `<b>Disclosure.</b> Affiliate. SPECIMIND is an affiliate of ${tool} and may earn a commission from it in future. No link on this page is an affiliate link yet. The commission never decides the verdict.${more}`;
  }
  return `<b>Disclosure.</b> Unpaid. There are no affiliate links on this page, and ${tool} did not pay for this test.${more}`;
};

// ---------- page shell ----------
const page = ({ path, title, description, body, top = "", jsonld = [], js = "", image = "/brand/og.png", nav = "" }) => {
  const url = SITE + path;
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="preload" href="/brand/Anybody-VF-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="/brand/logo-mark.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/brand/avatar-400.png">
<meta name="theme-color" content="#D8DCCD">
<meta property="og:site_name" content="SPECIMIND">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}${image}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@${HANDLE}">
${FIXTURE ? '<meta name="robots" content="noindex">' : ""}
<script>document.documentElement.className="js"</script>
<style>${CSS}</style>${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${FIXTURE ? '<div class="fixture-banner">Design fixture: placeholder data, not research</div>' : ""}${top}
<header class="wrap bar">
<a class="brand" href="/">${MARK}SPECIMIND</a>
<nav aria-label="Site"><a href="/"${nav === "drawer" ? ' aria-current="page"' : ""}>Drawer</a><a href="/about/"${nav === "about" ? ' aria-current="page"' : ""}>About</a></nav>
</header>
<main id="main">
${body}
</main>
<footer class="wrap foot">
<ul><li><a href="/">The drawer</a></li><li><a href="/about/">The Specimen Code</a></li><li><a href="/about/#disclosure">Disclosure</a></li><li><a href="/llms.txt">llms.txt</a></li>${Object.entries(PROFILES).map(([k, v]) => `<li><a href="${v}" rel="me noopener">${k}</a></li>`).join("")}</ul>
<p>SPECIMIND is a field guide to new AI tools: one real test per tool, one attempt, one honest flaw. No cookies, no tracking, no third-party scripts on this site. Catalog numbers are permanent.</p>
</footer>
${js ? `<script>${js}</script>` : ""}
</body>
</html>
`;
};

const write = (rel, content) => {
  const p = join(out, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
};

// ---------- cells ----------
const searchText = (s) => [s.code, s.tool, s.genus, s.pillar, s.verdict, s.flaw, s.series, s.title, ...(s.members ?? []).map((m) => m.tool)].filter(Boolean).join(" ").toLowerCase();
const cell = (s, keep = false) => `<li class="cell" data-code="${s.code}" data-pillar="${esc(s.pillar)}" data-verdict="${s.verdict}" data-search="${esc(searchText(s))}">
<a href="/${s.code}/"${keep ? " data-keep" : ""}>${tag(s.code, tone(s))}<span class="tool">${esc(s.tool)}<span class="sr">, specimen number ${s.code}</span></span><span class="meta">${s.verdict} · ${esc(s.pillar)}</span>${s.flaw ? `<span class="flaw">Flaw: ${esc(lowerFirst(plain(s.flaw)))}</span>` : ""}</a></li>`;

// ---------- / : the drawer ----------
const CELLS = 10; // one drawer = 5 x 2 cells, as in the video's Drawer
const buildHome = () => {
  const maxN = Math.max(0, ...specimens.map(num));
  const nDrawers = Math.max(1, Math.ceil(maxN / CELLS));
  const drawers = [];
  for (let d = 0; d < nDrawers; d++) {
    const lo = d * CELLS + 1;
    const hi = lo + CELLS - 1;
    const cells = [];
    for (let n = lo; n <= hi; n++) {
      const s = byCode.get(String(n).padStart(3, "0"));
      cells.push(s ? cell(s) : `<li class="cell empty${n > maxN && maxN > 0 ? " tail" : ""}" aria-hidden="true"></li>`);
    }
    drawers.push(`<section class="drawer" aria-labelledby="dr${d + 1}"><h2 id="dr${d + 1}">Drawer ${String(d + 1).padStart(2, "0")} · ${String(lo).padStart(3, "0")}–${String(hi).padStart(3, "0")}</h2><ul class="cells">${cells.join("")}</ul></section>`);
  }
  const pillars = [...new Set(specimens.map((s) => s.pillar).filter(Boolean))].sort();
  const count = (v) => specimens.filter((s) => s.verdict === v).length;
  const chips = (name, label, values) =>
    `<fieldset class="chips"><legend>${label}</legend>${["", ...values]
      .map((v, i) => `<input type="radio" name="${name}" id="${name}${i}" value="${esc(v)}"${i ? "" : " checked"}><label for="${name}${i}">${esc(v || "All")}</label>`)
      .join("")}</fieldset>`;
  const start = schedule.calendar_start;
  const opens = specimens.length
    ? ""
    : `<div class="opens"><p><b>The drawer is empty.</b> ${
        start && start > today
          ? `It opens on ${fmtDate(start)}, when the first specimen, Nº 001, is pinned.`
          : "The first specimen is being prepared."
      }</p><p>Every tool we test gets a permanent number and a page here, with the conditions of the test, the price, the one flaw we found and the verdict.</p></div>`;
  const shelf = groups.length
    ? `<section class="shelf" aria-labelledby="shelf"><h2 id="shelf">Plates, dissections and mimicry</h2><p>Episodes with more than one tool. Each one links to the specimens involved.</p><ul>${groups
        .map((g) => `<li class="shelf-item" data-code="${g.code}" data-pillar="${esc(g.pillar)}" data-verdict="${g.verdict ?? ""}" data-search="${esc(searchText(g))}"><a href="/${g.code}/">${tag(g.code, "ink")}<span><span class="t">${esc(g.title)}</span><br><span class="m">${g.kind} · ${fmtDate(g.posted_on || g.tested_on)}</span></span></a></li>`)
        .join("")}</ul></section>`
    : "";
  const body = `<div class="wrap">
<section class="masthead" aria-labelledby="title">
<h1 id="title">SPECIMIND</h1>
<p class="dek">A field guide to new AI tools. One real test per tool, one attempt, one honest flaw circled in red ink.</p>
<ul class="tally" aria-label="Catalog totals"><li><b>${specimens.length}</b>pinned</li><li><b>${count("Captured")}</b>captured</li><li><b>${count("Released")}</b>released</li><li><b>${count("Watch")}</b>on watch</li></ul>
</section>
<form class="finder" id="finder" role="search" action="/" method="get">
<label for="q" class="lab">Find a specimen by number or tool. “47” and “047” both work.</label>
<div class="search"><span class="no" aria-hidden="true">Nº</span><input id="q" name="q" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="047" enterkeyhint="go"><button type="submit">Open</button></div>
<p class="status" id="status" role="status" aria-live="polite"></p>
${specimens.length ? `<div class="filters">${chips("pillar", "Pillar", pillars)}${chips("verdict", "Verdict", VERDICTS)}</div>` : ""}
</form>
${opens}
${drawers.join("\n")}
<ul class="legend" aria-label="Key"><li><i></i>Newest</li><li><i class="ink"></i>Captured</li><li><i class="steel"></i>Watch (field sketch)</li><li><i class="outline"></i>Released</li></ul>
${shelf}
</div>`;
  const jsonld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "SPECIMIND", url: `${SITE}/`, description: "A field guide to new AI tools." },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "The SPECIMIND drawer",
      itemListElement: [...specimens].sort((a, b) => num(a) - num(b)).map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${s.code}/`, name: `Nº${s.code} ${s.tool}` })),
    },
  ];
  write(
    "index.html",
    page({
      path: "/",
      title: "SPECIMIND · a field guide to new AI tools",
      description: `Every AI tool SPECIMIND has tested, pinned in one drawer: ${specimens.length} specimens, each with one real attempt, the price, one honest flaw and a verdict.`,
      body,
      jsonld,
      js: DRAWER_JS,
      nav: "drawer",
    }),
  );
};

// ---------- shared specimen/group parts ----------
const yt = (url) => url && (url.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([\w-]{11})/) ?? [])[1];
const coverOut = (s) => (s.cover && existsSync(join(root, s.cover)) ? `/${s.code}/cover${extname(s.cover)}` : "");
const shortBlock = (s, label) => {
  const id = yt(s.links?.youtube);
  const cover = coverOut(s);
  const img = cover ? `<img src="${cover}" width="1080" height="1920" loading="lazy" decoding="async" alt="">` : "";
  const when = fmtDate(s.posted_on || s.tested_on);
  if (id) {
    return `<a class="short${img ? "" : " poster"}" href="${esc(s.links.youtube)}" data-yt="${id}" data-title="${esc(label)}">${img || `<span class="wide" aria-hidden="true">Nº${esc(s.code)}</span>`}<span class="play">${PLAY}Play the Short<span class="sr">: ${esc(label)}</span></span></a>
      <p class="short-meta">The player loads from youtube-nocookie.com only when you press play.</p>`;
  }
  if (img) return `<div class="short">${img.replace('alt=""', `alt="Cover of the ${esc(label)} Short"`)}</div><p class="short-meta">The Short ${s.posted_on && s.posted_on <= today ? "was posted" : "posts"} ${when ? `on ${when}` : "soon"}.</p>`;
  return "";
};
const watchLinks = (s) => {
  const l = s.links ?? {};
  const items = [
    ["YouTube", l.youtube],
    ["Instagram", l.instagram],
    ["X", l.x],
  ].filter(([, u]) => u);
  return items.length ? `<section><h2>Watch it on</h2><ul class="watch">${items.map(([k, u]) => `<li><a href="${esc(u)}" rel="noopener">${k}</a></li>`).join("")}</ul></section>` : "";
};
const errata = (s) =>
  (s.corrections ?? []).map((c) => `<div class="erratum" role="note"><p><b>Erratum, ${fmtDate(c.date)}.</b> ${esc(c.text)}</p></div>`).join("");
const videoLd = (s, name, description) => {
  const id = yt(s.links?.youtube);
  const cover = coverOut(s);
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl: [cover ? SITE + cover : id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : `${SITE}/brand/og.png`],
    uploadDate: s.posted_on || s.tested_on,
    ...(id ? { embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, url: s.links.youtube } : { url: `${SITE}/${s.code}/` }),
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "SPECIMIND", url: `${SITE}/`, logo: { "@type": "ImageObject", url: `${SITE}/brand/avatar-400.png` } },
  };
};

// ---------- /<code>/ : a specimen ----------
const buildSpecimen = (s) => {
  const hook = s.hook_lines?.length ? s.hook_lines : [s.tool];
  const label = `Specimen Nº${s.code}: ${s.tool}`;
  const notes = s.field_notes?.length
    ? s.field_notes
    : [
        { key: "Free tier", value: s.free_tier || "Not published" },
        { key: "Paid from", value: s.paid_from || "Not published" },
        { key: "Weakness", value: s.flaw },
      ];
  const flawRow = notes.findIndex((r) => r.key === "Weakness");
  const rows = (list, circle = -1) =>
    `<dl class="rows">${list.map((r, i) => `<div><dt>${esc(r.key)}</dt><dd>${i === circle ? `<span class="circled">${esc(r.value)}${INK_CIRCLE}</span>` : esc(r.value)}</dd></div>`).join("")}</dl>`;
  const live = s.mode !== "Field sketch";
  const cond = s.conditions?.length
    ? `<section class="cond card" aria-labelledby="cond"><h2 id="cond">Collection conditions</h2>${rows(s.conditions)}</section>`
    : `<section class="cond card" aria-labelledby="cond"><h2 id="cond">Collection conditions</h2><dl class="rows"><div><dt>Mode</dt><dd>Field sketch — not hands-on</dd></div><div><dt>Built from</dt><dd>The tool's public pages, listed under Sources</dd></div></dl></section>`;
  const flawCaption = s.flaw_caption || s.flaw;
  const flawSource =
    s.flaw_source === "research"
      ? `This is the most important limitation documented in the sources below${live ? "; nothing visibly failed in our attempt" : ", because a Field sketch is not hands-on"}.`
      : `We saw it in our own attempt${s.flaw_at ? ` (${esc(s.flaw_at)} into the recording)` : ""}. One attempt, no retries${s.conditions?.find((r) => r.key === "Attempts" && r.value !== "1") ? " beyond those listed in the conditions" : ""}.`;
  const sameP = specimens.filter((o) => o !== s && o.pillar === s.pillar).sort((a, b) => (b.tested_on || "").localeCompare(a.tested_on || "") || num(b) - num(a)).slice(0, 3);
  const inGroups = groups.filter((g) => g.members.some((m) => m.code === s.code));
  const sources = (s.sources ?? []).filter((x) => x.url);
  const more = [
    errata(s),
    watchLinks(s),
    inGroups.length
      ? `<section><h2>Also appears in</h2><ul class="watch">${inGroups.map((g) => `<li><a href="/${g.code}/" data-keep>${g.code} · ${esc(g.title)}</a></li>`).join("")}</ul></section>`
      : "",
    sources.length
      ? `<section><h2>Sources</h2><ol class="sources">${sources.map((x) => `<li><a href="${esc(x.url)}" rel="noopener">${esc(x.label || new URL(x.url).hostname)}</a>${x.accessed ? `, accessed ${fmtDate(x.accessed)}` : ""}</li>`).join("")}</ol>${s.credits ? `<p class="lab" style="margin-top:12px">${esc(s.credits)}</p>` : ""}</section>`
      : "",
    sameP.length ? `<section><h2>More from the ${esc(s.pillar)} drawer</h2><ul class="mini-cells">${sameP.map((o) => cell(o, true)).join("")}</ul></section>` : "",
  ].join("");
  const body = `<article class="wrap spec">
<header class="spec-head">${tag(s.code, "red", "-3")}<div><p class="kicker">Specimen Nº${s.code}</p><h1>${esc(s.tool)}</h1>${s.genus ? `<p class="genus">${esc(s.genus)}</p>` : ""}<div class="badges"><span class="badge">${live ? "Live specimen" : "Field sketch — not hands-on"}</span><span class="badge${s.disclosure === "Affiliate" ? " aff" : ""}">${s.disclosure}</span>${s.pillar ? `<span class="badge">${esc(s.pillar)}</span>` : ""}</div></div></header>
<div class="hook">${fit(hook)}</div>
<section class="verdict" aria-label="Verdict">${stamp(s.verdict, "lands")}<div><p class="why">${esc(s.verdict_reason || VERDICT_LINE[s.verdict])}</p><p class="lab">${live ? "Tested" : "Desk study"} ${fmtDate(s.tested_on)}${s.seconds_to_result ? ` · ${s.seconds_to_result} s to result` : ""}</p><div class="try">${tryLink(s)}</div></div></section>
<section class="notes card" aria-labelledby="notes"><h2 id="notes">Field notes</h2>${rows(notes, flawRow)}</section>
${cond}
<section class="flaw-sec" aria-labelledby="flaw"><h2 id="flaw" class="sr">The honest flaw</h2>${fit(["Honest flaw:", sentence(flawCaption)])}<p>${flawSource}</p></section>
<aside class="short-wrap" aria-label="The Short">${shortBlock(s, label)}</aside>
<div class="more">${more}</div>
</article>`;
  const description = `${s.tool}${s.genus ? ` (${s.genus.toLowerCase()})` : ""}, tested once by SPECIMIND on ${fmtDate(s.tested_on)}. Verdict: ${s.verdict}. Honest flaw: ${lowerFirst(plain(s.flaw))}. Free tier: ${s.free_tier || "not published"}. Paid from: ${s.paid_from || "not published"}.`;
  const name = `${s.tool}: ${plain(hook.join(" "))} | Specimen Nº${s.code}`;
  const jsonld = [
    videoLd(s, name, description),
    {
      "@context": "https://schema.org",
      "@type": "Review",
      name: `${s.tool}: ${s.verdict} (Specimen Nº${s.code})`,
      url: `${SITE}/${s.code}/`,
      datePublished: s.posted_on || s.tested_on,
      itemReviewed: { "@type": "SoftwareApplication", name: s.tool, applicationCategory: s.genus || s.pillar, ...(s.homepage ? { url: s.homepage } : {}) },
      reviewRating: { "@type": "Rating", ratingValue: RATING[s.verdict], bestRating: 5, worstRating: 1, ratingExplanation: s.verdict },
      reviewBody: `Verdict: ${s.verdict}. ${sentence(s.verdict_reason)} Honest flaw: ${sentence(lowerFirst(plain(s.flaw)))}`.replace(/\s+/g, " ").trim(),
      author: { "@type": "Organization", name: "SPECIMIND", url: `${SITE}/` },
      publisher: { "@type": "Organization", name: "SPECIMIND", url: `${SITE}/` },
    },
  ];
  const cover = coverOut(s);
  if (cover) cpSync(join(root, s.cover), join(out, cover));
  write(
    `${s.code}/index.html`,
    page({
      path: `/${s.code}/`,
      title: `${s.tool}: ${s.verdict} · Specimen Nº${s.code} · SPECIMIND`,
      description,
      top: `<div class="disclosure"><div class="wrap"><p>${disclosureText(s)}</p></div></div>`,
      body,
      jsonld,
      js: SPECIMEN_JS,
      image: cover || "/brand/og.png",
    }),
  );
};
const VERDICT_LINE = {
  Captured: "Captured: it did what we tested, in one attempt, well enough to use.",
  Released: "Released: it did not pass our one-attempt test.",
  Watch: "Watch: a desk study, not hands-on, so we do not judge it yet.",
};

// ---------- /<P01|D01|M01|W01|X01>/ : a group ----------
const buildGroup = (g) => {
  const ranked = g.kind === "Plate" || g.kind === "Dissection";
  const members = [...g.members].sort((a, b) => (ranked ? (a.rank ?? 9) - (b.rank ?? 9) : 0));
  const item = (m, i) => {
    const s = m.code && byCode.get(m.code);
    const name = s ? `<a href="/${s.code}/" data-keep>Nº${s.code} · ${esc(s.tool)}</a>` : esc(m.tool ?? m.code);
    const verdict = m.verdict ?? s?.verdict;
    const note = m.note ?? (s ? `Flaw: ${lowerFirst(plain(s.flaw))}` : "");
    const n = g.kind === "Dissection" ? `Stage ${i + 1}` : g.kind === "Plate" ? `Rank ${m.rank ?? i + 1}` : "";
    const lead = ranked ? `<span class="rank" aria-hidden="true">${m.rank ?? i + 1}</span>` : s ? `<span aria-hidden="true">${tag(s.code, tone(s), "0")}</span>` : `<span class="rank" aria-hidden="true">·</span>`;
    return `<li style="${ranked ? "" : "grid-template-columns:84px 1fr"}">${lead}<div>${n ? `<span class="sr">${n}: </span>` : ""}<span class="t">${name}</span>${verdict ? ` <span class="badge">${verdict}</span>` : ""}${note ? `<div class="n">${esc(note)}</div>` : ""}${!s && m.tool ? `<div class="n">No specimen page of its own yet.</div>` : ""}</div></li>`;
  };
  const hook = g.hook_lines?.length ? g.hook_lines : [g.title];
  const label = `${g.kind} ${g.code}: ${g.title}`;
  const body = `<article class="wrap spec">
<header class="spec-head">${tag(g.code, "ink", "-3")}<div><p class="kicker">${g.kind} ${g.code}</p><h1>${esc(g.title)}</h1><p class="genus">${KIND_LINE[g.kind]}</p><div class="badges"><span class="badge">${g.kind === "Extinction Watch" ? "Field sketch — not hands-on" : g.kind === "Drawer" ? "Built from the week's specimens" : "Live specimen"}</span><span class="badge${g.disclosure === "Affiliate" ? " aff" : ""}">${g.disclosure}</span></div></div></header>
<div class="hook">${fit(hook)}</div>
<section class="notes" aria-labelledby="members"><h2 id="members" style="margin-bottom:10px">${g.kind === "Plate" ? "The ranking" : g.kind === "Dissection" ? "The stages" : g.kind === "Drawer" ? "In this week's drawer" : g.kind === "Extinction Watch" ? "The successors" : "The specimens"}</h2><ol class="members">${members.map(item).join("")}</ol></section>
${g.flaw ? `<section class="flaw-sec" aria-labelledby="flaw"><h2 id="flaw" class="sr">The honest flaw</h2>${fit(["Honest flaw:", sentence(lowerFirst(g.flaw))])}</section>` : ""}
${g.verdict ? `<section class="verdict" aria-label="Verdict">${stamp(g.verdict, "lands")}<p class="why">${esc(g.verdict_reason || VERDICT_LINE[g.verdict])}</p></section>` : ""}
<aside class="short-wrap" aria-label="The Short">${shortBlock(g, label)}</aside>
<div class="more">${errata(g)}${watchLinks(g)}<p class="lab">${g.kind === "Drawer" ? "Recapped" : g.kind === "Extinction Watch" ? "Desk study" : "Tested"} ${fmtDate(g.tested_on)}</p></div>
</article>`;
  const description = `${g.kind} ${g.code} by SPECIMIND: ${g.title}. ${KIND_LINE[g.kind]} ${members.map((m) => m.tool ?? byCode.get(m.code)?.tool).filter(Boolean).join(", ")}.`;
  const jsonld = [
    videoLd(g, `${g.title} | ${g.kind} ${g.code}`, description),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: label,
      itemListOrder: ranked ? "https://schema.org/ItemListOrderAscending" : "https://schema.org/ItemListUnordered",
      itemListElement: members.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: m.tool ?? byCode.get(m.code)?.tool, ...(m.code && byCode.has(m.code) ? { url: `${SITE}/${m.code}/` } : {}) })),
    },
  ];
  const cover = coverOut(g);
  if (cover) cpSync(join(root, g.cover), join(out, cover));
  write(
    `${g.code}/index.html`,
    page({
      path: `/${g.code}/`,
      title: `${g.title} · ${g.kind} ${g.code} · SPECIMIND`,
      description,
      top: `<div class="disclosure"><div class="wrap"><p>${disclosureText(g)}</p></div></div>`,
      body,
      jsonld,
      js: SPECIMEN_JS,
      image: cover || "/brand/og.png",
    }),
  );
};

// ---------- /about/ ----------
const buildAbout = () => {
  const body = `<div class="wrap prose">
${tag("Nº", "red", "-4")}
<h1>The Specimen Code</h1>
<p class="dek">SPECIMIND tests new AI tools the way a naturalist collects specimens: one real sample, labelled with where and how it was taken, pinned in a drawer with a permanent number. These are the rules every video and every page here follows.</p>
<ol class="code-list">
<li><span><b>Output first.</b>Every video opens on what the tool actually made in our test, not on a title card or a promise.</span></li>
<li><span><b>One attempt.</b>We run the test once, on the plan we name (usually the free tier), and show what came out. If a test ever needs more than one attempt, the Collection conditions card says exactly how many.</span></li>
<li><span><b>One honest flaw, circled in red.</b>Every specimen has one flaw, shown on screen and circled in red ink. If nothing visibly went wrong, we name the most important documented limitation instead and say that it came from research.</span></li>
<li><span><b>The price, on screen.</b>The free-tier limit and the cheapest paid plan, taken from the tool's own pages in the week we test, with the sources listed on its page here. When a number is not published, we write “not published”. We never guess.</span></li>
<li><span><b>Three verdicts.</b><em>Captured</em>: it did what we tested, well enough to use. <em>Released</em>: it did not pass our test; roughly one in eight live specimens is released. <em>Watch</em>: a desk study we cannot judge hands-on yet.</span></li>
<li><span><b>Two modes, always labelled.</b><em>Live specimen</em>: we ran the test ourselves, and the footage is our own capture (a screen recording, or a run on a public demo). <em>Field sketch — not hands-on</em>: built from public information, with diagrams we redrew ourselves. The label stays on screen for the whole video.</span></li>
<li><span><b>Permanent numbers.</b>A catalog number is never changed and never reused. If we get something wrong, the page keeps its number and gets a dated erratum.</span></li>
<li><span><b>Nothing borrowed.</b>No narration, no AI voice, no copyrighted music, no other creators' footage, no tool logos as hero images. Every sound is generated in code.</span></li>
<li><span><b>Disclosure from first frame to last.</b>“Affiliate” or “Unpaid” stays on screen for the whole video, and the disclosure sits at the top of every specimen page here.</span></li>
</ol>
<h2 id="disclosure">Affiliate disclosure</h2>
<p>Some links on this site are affiliate links. If you sign up for or pay for a tool through one of them, SPECIMIND may earn a commission. You pay the same price either way.</p>
<p><b>What the labels mean.</b> <em>Affiliate</em> means we have joined that tool's affiliate programme, so the “Try” link on its page may earn us a commission. <em>Unpaid</em> means there is no affiliate link and no payment of any kind: the button goes to the tool's homepage.</p>
<p><b>Commission never decides a verdict.</b> The verdict comes from the one attempt in the video. A tool with an affiliate programme can be Released, and its flaw is shown either way. No tool has paid for a specimen. If that ever changes, the word “Sponsored” will appear where the disclosure word sits, in the video and on the page.</p>
<p><b>Sub-IDs.</b> Where the affiliate network supports it, our links carry a short tag such as <code>p-yt-e001</code>: the platform you came from (YouTube, Instagram, X or this website) and the episode number. It tells us which videos are useful. It contains nothing about you.</p>
<p><b>Where the disclosure appears.</b> On screen for the whole video, at the top of every specimen page, next to every affiliate button, and in each post's caption. We follow India's ASCI guidelines for influencer advertising and the US FTC's Endorsement Guides.</p>
<h2 id="privacy">Privacy</h2>
<p>This site sets no cookies, runs no analytics, loads no tracking pixels and no third-party scripts. The font is served from this site. The only outside content is the YouTube player on a specimen page, which loads from youtube-nocookie.com only after you press play. Once you follow a “Try” link you are on the tool's or the affiliate network's site, under their privacy policy.</p>
<h2>Find a specimen</h2>
<p>Type the number after the slash: <a href="/001/">specimindlab.github.io/001</a>. Plates, dissections and mimicry episodes use P, D and M: <code>/P01</code>, <code>/D01</code>, <code>/M01</code>. Machines can read the whole catalog at <a href="/llms.txt">/llms.txt</a>.</p>
<p>Follow <b>@${HANDLE}</b> on ${Object.entries(PROFILES).map(([k, v]) => `<a href="${v}" rel="me noopener">${k}</a>`).join(", ").replace(/, ([^,]*)$/, " and $1")}.</p>
</div>`;
  write(
    "about/index.html",
    page({
      path: "/about/",
      title: "The Specimen Code and disclosure · SPECIMIND",
      description: "How SPECIMIND tests AI tools: output first, one attempt, one honest flaw, prices with sources, permanent catalog numbers. Plus our full affiliate disclosure.",
      body,
      nav: "about",
    }),
  );
};

// ---------- /404.html : also turns /47, /p1 or /tripo into the right page ----------
const build404 = () => {
  const index = Object.fromEntries([...specimens, ...groups].map((s) => [s.code, (s.tool ?? s.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")]));
  const js = `(() => {
const index = ${JSON.stringify(index)};
const raw = decodeURIComponent(location.pathname).replace(/^\\/+|\\/+$/g, "").replace(/\\/index\\.html$/, "");
let s = raw.toUpperCase().replace(/^(?:N\\s*[º°O]\\.?|#)\\s*(?=\\d)/, "");
let m = s.match(/^0*(\\d{1,3})$/), code = m ? m[1].padStart(3, "0") : null;
if (!code && (m = s.match(/^([PDMWX])-?0*(\\d{1,2})$/))) code = m[1] + m[2].padStart(2, "0");
if (!code) { const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-"); code = Object.keys(index).find((c) => index[c] === slug) || null; }
if (code && index[code] !== undefined) return location.replace("/" + code + "/" + location.search);
const msg = document.getElementById("msg");
if (code) msg.textContent = "Nº " + code + " is not in the drawer yet.";
const q = document.getElementById("q");
if (raw && !code) q.value = raw.replace(/[-_/]+/g, " ");
})();`;
  const body = `<div class="wrap prose">
${tag("404", "outline", "-4")}
<h1>Not in the drawer</h1>
<p id="msg">There is no page at this address.</p>
<form class="finder" action="/" method="get" role="search"><label for="q" class="lab">Search the drawer by number or tool</label><div class="search"><span class="no" aria-hidden="true">Nº</span><input id="q" name="q" type="search" autocomplete="off" spellcheck="false" placeholder="047"><button type="submit">Search</button></div></form>
<p><a href="/">Open the drawer</a> to see every specimen.</p>
</div>`;
  write("404.html", page({ path: "/404.html", title: "Not in the drawer · SPECIMIND", description: "This page is not in the SPECIMIND drawer.", body, js }));
};

// ---------- /llms.txt, /sitemap.xml, /robots.txt ----------
const buildText = () => {
  const ordered = [...specimens].sort((a, b) => num(a) - num(b));
  const start = schedule.calendar_start;
  const lines = [
    "# SPECIMIND",
    "",
    "> A field guide to new AI tools. Each specimen is one real test of one tool: one attempt, the price on screen, one honest flaw, and a verdict (Captured, Released, or Watch for desk studies that are not hands-on). Catalog numbers are permanent.",
    "",
    "Format: code, tool, verdict, flaw, date tested, URL. Prices, test conditions and sources are on each page. The Specimen Code and the affiliate disclosure: " + `${SITE}/about/`,
    "",
    "## Specimens",
    "",
    ...(ordered.length
      ? ordered.map((s) => `- [Nº${s.code} ${s.tool}](${SITE}/${s.code}/): ${s.verdict}. Flaw: ${lowerFirst(plain(s.flaw))}. Tested ${s.tested_on}. ${s.mode === "Field sketch" ? "Field sketch, not hands-on" : "Live specimen"}; ${s.pillar}; ${s.disclosure}.`)
      : [`No specimens are pinned yet.${start && start > today ? ` The first is pinned on ${start}.` : ""}`]),
  ];
  if (groups.length) {
    lines.push("", "## Plates, dissections, mimicry and recaps", "");
    for (const g of groups) {
      const who = g.members.map((m) => (m.code && byCode.has(m.code) ? `Nº${m.code} ${byCode.get(m.code).tool}` : m.tool ?? m.code)).join(", ");
      lines.push(`- [${g.code} ${g.title}](${SITE}/${g.code}/): ${g.kind}. ${who}.${g.flaw ? ` Flaw: ${lowerFirst(plain(g.flaw))}.` : ""} Tested ${g.tested_on}.`);
    }
  }
  lines.push("", "## Optional", "", `- [The Specimen Code and disclosure](${SITE}/about/)`, "");
  write("llms.txt", lines.join("\n"));
  const urls = [
    ["/", today],
    ["/about/", today],
    ...ordered.map((s) => [`/${s.code}/`, s.updated_on || s.posted_on || s.tested_on]),
    ...groups.map((g) => [`/${g.code}/`, g.updated_on || g.posted_on || g.tested_on]),
  ];
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `<url><loc>${SITE}${u}</loc><lastmod>${d}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  write("robots.txt", FIXTURE ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
};

// ---------- go ----------
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "brand"), { recursive: true });
for (const [from, to] of [
  ["brand/reference/Anybody-VF-latin.woff2", "brand/Anybody-VF-latin.woff2"],
  ["video/public/fonts/OFL.txt", "brand/OFL.txt"],
  ["brand/logo/logo-mark.svg", "brand/logo-mark.svg"],
  ["brand/social/avatar-400.png", "brand/avatar-400.png"],
  ["brand/social/x-header-1500x500.png", "brand/og.png"],
]) cpSync(join(root, from), join(out, to));
writeFileSync(join(out, ".nojekyll"), "");
buildHome();
specimens.forEach(buildSpecimen);
groups.forEach(buildGroup);
buildAbout();
build404();
buildText();
console.log(`built ${out}: ${specimens.length} specimens, ${groups.length} groups${FIXTURE ? " (DESIGN FIXTURE, do not deploy)" : ""}`);
