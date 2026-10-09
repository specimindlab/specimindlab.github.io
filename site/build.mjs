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
  Dissection: "One finished thing, made by chaining tools step by step.",
  Mimicry: "AI or real? Two images, one reveal.",
  Drawer: "Every tool we've covered so far, ranked.",
  "Extinction Watch": "A tool that shut down, and what to use instead.",
};
// What the reader sees (prompts/voice.md v3: plain words); the catalog keeps the internal names.
const SAYS = { Captured: "Worth it", Released: "Skip it", Watch: "Not tested" };
const KIND_SAYS = { Plate: "Head to head", Dissection: "Workflow", Mimicry: "AI or real?", Drawer: "Roundup", "Extinction Watch": "Shut down" };
const DISC_SAYS = { Unpaid: "Not sponsored", Affiliate: "Affiliate link" };
const modeSays = (live) => (live ? "Tested by us" : "Not tested · research only");
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
  if (s.score !== undefined) {
    const t = s.score?.total;
    if (!Number.isInteger(t) || t < 0 || t > 100) errors.push(`${at}: score.total must be an integer 0-100`);
    if (s.mode === "Field sketch") errors.push(`${at}: Field sketches get no score (data/score.md)`);
    const sum = (s.score?.parts ?? []).reduce((a, p) => a + p.value, 0);
    if (s.score?.parts?.length && sum !== t) errors.push(`${at}: score parts add up to ${sum}, not ${t}`);
  }
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

// Leaderboards: every scored specimen, ranked inside its drawer (pillar).
const slug = (x) => String(x ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const scored = (pillar) => specimens.filter((o) => o.score && (!pillar || o.pillar === pillar)).sort((a, b) => b.score.total - a.score.total || num(a) - num(b));
const rankOf = (s) => (s.score ? scored(s.pillar).indexOf(s) + 1 : 0);
const PILLARS = [...new Set(specimens.map((o) => o.pillar).filter(Boolean))].sort();

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
const stamp = (verdict, extra = "") => `<span class="stamp ${verdict} ${extra}"><span>${esc(SAYS[verdict] ?? verdict)}</span></span>`;
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
  if (s.members) return `<b>Disclosure.</b> Not sponsored. There are no affiliate links on this page, and no tool in it paid for this.${more}`;
  if (s.disclosure === "Affiliate" && s.affiliate_url) {
    return `<b>Disclosure.</b> Some links on this page are affiliate links. If you sign up or pay through them, SPECIMIND may earn a commission, at no extra cost to you. The commission never decides the verdict: we test once, we show the catch either way, and a tool with an affiliate programme can still get "Skip it".${more}`;
  }
  if (s.disclosure === "Affiliate") {
    return `<b>Disclosure.</b> Affiliate. SPECIMIND is an affiliate of ${tool} and may earn a commission from it in future. No link on this page is an affiliate link yet. The commission never decides the verdict.${more}`;
  }
  return `<b>Disclosure.</b> Not sponsored. There are no affiliate links on this page, and ${tool} didn't pay for this test.${more}`;
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
<nav aria-label="Site"><a href="/"${nav === "drawer" ? ' aria-current="page"' : ""}>Tests</a><a href="/best/"${nav === "best" ? ' aria-current="page"' : ""}>Rankings</a><a href="/about/"${nav === "about" ? ' aria-current="page"' : ""}>About</a></nav>
</header>
<main id="main">
${body}
</main>
<footer class="wrap foot">
<ul><li><a href="/">All tests</a></li><li><a href="/about/">How we test</a></li><li><a href="/about/#disclosure">Disclosure</a></li><li><a href="/llms.txt">llms.txt</a></li>${Object.entries(PROFILES).map(([k, v]) => `<li><a href="${v}" rel="me noopener">${k}</a></li>`).join("")}</ul>
<p>SPECIMIND tests new AI tools: one real try each, the catch circled, the price, a plain verdict. No cookies, no tracking, no third-party scripts on this site.</p>
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
<a href="/${s.code}/"${keep ? " data-keep" : ""}>${tag(s.code, tone(s))}<span class="tool">${esc(s.tool)}<span class="sr">, test number ${s.code}</span></span><span class="meta">${s.score ? `<b>${s.score.total}</b>/100 · ` : ""}${SAYS[s.verdict] ?? s.verdict} · ${esc(s.pillar)}</span>${s.flaw ? `<span class="flaw">The catch: ${esc(lowerFirst(plain(s.flaw)))}</span>` : ""}</a></li>`;

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
    drawers.push(`<section class="drawer" aria-labelledby="dr${d + 1}"><h2 id="dr${d + 1}">Tests #${String(lo).padStart(3, "0")}–#${String(hi).padStart(3, "0")}</h2><ul class="cells">${cells.join("")}</ul></section>`);
  }
  const pillars = [...new Set(specimens.map((s) => s.pillar).filter(Boolean))].sort();
  const count = (v) => specimens.filter((s) => s.verdict === v).length;
  const chips = (name, label, values) =>
    `<fieldset class="chips"><legend>${label}</legend>${["", ...values]
      .map((v, i) => `<input type="radio" name="${name}" id="${name}${i}" value="${esc(v)}"${i ? "" : " checked"}><label for="${name}${i}">${esc(SAYS[v] ?? (v || "All"))}</label>`)
      .join("")}</fieldset>`;
  const start = schedule.calendar_start;
  const opens = specimens.length
    ? ""
    : `<div class="opens"><p><b>No tests here yet.</b> The first one, #001, is on its way.</p><p>Every tool we test gets a number and a page here: how we tested it, the price, the catch we found and whether it's worth using.</p></div>`;
  const shelf = groups.length
    ? `<section class="shelf" aria-labelledby="shelf"><h2 id="shelf">Roundups and head-to-heads</h2><p>Videos with more than one tool. Each one links to the tools in it.</p><ul>${groups
        .map((g) => `<li class="shelf-item" data-code="${g.code}" data-pillar="${esc(g.pillar)}" data-verdict="${g.verdict ?? ""}" data-search="${esc(searchText(g))}"><a href="/${g.code}/">${tag(g.code, "ink")}<span><span class="t">${esc(g.title)}</span><br><span class="m">${KIND_SAYS[g.kind] ?? g.kind}</span></span></a></li>`)
        .join("")}</ul></section>`
    : "";
  const body = `<div class="wrap">
<section class="masthead" aria-labelledby="title">
<h1 id="title">SPECIMIND</h1>
<p class="dek">We test new AI tools, one real try each, and tell you plainly: is it worth using, what's the catch, and what does it cost?</p>
<ul class="tally" aria-label="Totals"><li><b>${specimens.length}</b>tools</li><li><b>${count("Captured")}</b>worth it</li><li><b>${count("Released")}</b>skip it</li><li><b>${count("Watch")}</b>not tested</li></ul>
</section>
<form class="finder" id="finder" role="search" action="/" method="get">
<label for="q" class="lab">Find a test by its number or the tool's name. “47” and “047” both work.</label>
<div class="search"><span class="no" aria-hidden="true">#</span><input id="q" name="q" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="047" enterkeyhint="go"><button type="submit">Open</button></div>
<p class="status" id="status" role="status" aria-live="polite"></p>
${specimens.length ? `<div class="filters">${chips("pillar", "Kind of tool", pillars)}${chips("verdict", "Our verdict", VERDICTS)}</div>` : ""}
</form>
${opens}
${drawers.join("\n")}
<ul class="legend" aria-label="Key"><li><i></i>Newest</li><li><i class="ink"></i>Worth it</li><li><i class="steel"></i>Not tested (research only)</li><li><i class="outline"></i>Skip it</li></ul>
${shelf}
</div>`;
  const jsonld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "SPECIMIND", url: `${SITE}/`, description: "A field guide to new AI tools." },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Every AI tool SPECIMIND has tested",
      itemListElement: [...specimens].sort((a, b) => num(a) - num(b)).map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${s.code}/`, name: `#${s.code} ${s.tool}` })),
    },
  ];
  write(
    "index.html",
    page({
      path: "/",
      title: "SPECIMIND · new AI tools, tested plainly",
      description: `Every AI tool SPECIMIND has tested: ${specimens.length} so far, each with one real try, the price, the catch and whether it's worth using.`,
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
  if (id) {
    return `<a class="short${img ? "" : " poster"}" href="${esc(s.links.youtube)}" data-yt="${id}" data-title="${esc(label)}">${img || `<span class="wide" aria-hidden="true">#${esc(s.code)}</span>`}<span class="play">${PLAY}Play the video<span class="sr">: ${esc(label)}</span></span></a>
      <p class="short-meta">The player loads from youtube-nocookie.com only when you press play.</p>`;
  }
  if (img) return `<div class="short">${img.replace('alt=""', `alt="Cover of the ${esc(label)} video"`)}</div>`;
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
  const label = `#${s.code}: ${s.tool}`;
  const notes = s.field_notes?.length
    ? s.field_notes
    : [
        { key: "Free plan", value: s.free_tier || "Not published" },
        { key: "Paid", value: s.paid_from || "Not published" },
        { key: "The catch", value: s.flaw },
      ];
  const flawRow = notes.findIndex((r) => r.key === "The catch" || r.key === "Weakness");
  const rows = (list, circle = -1) =>
    `<dl class="rows">${list.map((r, i) => `<div><dt>${esc(r.key)}</dt><dd>${i === circle ? `<span class="circled">${esc(r.value)}${INK_CIRCLE}</span>` : esc(r.value)}</dd></div>`).join("")}</dl>`;
  const live = s.mode !== "Field sketch";
  const cond = s.conditions?.length
    ? `<section class="cond card" aria-labelledby="cond"><h2 id="cond">How we tested</h2>${rows(s.conditions)}</section>`
    : `<section class="cond card" aria-labelledby="cond"><h2 id="cond">How we tested</h2><dl class="rows"><div><dt>Tested?</dt><dd>No: there's no free plan, so this is research only</dd></div><div><dt>Built from</dt><dd>The tool's own public pages, listed under Sources</dd></div></dl></section>`;
  const flawCaption = s.flaw_caption || s.flaw;
  const flawSource =
    s.flaw_source === "research"
      ? `This is the biggest limitation in the tool's own pages (sources below)${live ? "; nothing visibly went wrong in our try" : ". We didn't test it, so we can't show it happening"}.`
      : `We saw it in our own try${s.flaw_at ? ` (${esc(s.flaw_at)} into the recording)` : ""}. One try, no retries.`;
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
    sameP.length ? `<section><h2>More ${esc(s.pillar)} tools we tested</h2><ul class="mini-cells">${sameP.map((o) => cell(o, true)).join("")}</ul></section>` : "",
  ].join("");
  const body = `<article class="wrap spec">
<header class="spec-head">${tag(s.code, "red", "-3")}<div><p class="kicker">Test #${s.code}</p><h1>${esc(s.tool)}</h1>${s.genus ? `<p class="genus">${esc(s.genus)}</p>` : ""}<div class="badges"><span class="badge">${modeSays(live)}</span><span class="badge${s.disclosure === "Affiliate" ? " aff" : ""}">${DISC_SAYS[s.disclosure] ?? s.disclosure}</span>${s.pillar ? `<span class="badge">${esc(s.pillar)}</span>` : ""}</div></div></header>
<div class="hook">${fit(hook)}</div>
<section class="verdict" aria-label="Verdict">${stamp(s.verdict, "lands")}<div><p class="why">${esc(s.verdict_reason || VERDICT_LINE[s.verdict])}</p><p class="lab">${live ? "Tested" : "Researched"} ${fmtDate(s.tested_on)}${s.seconds_to_result ? ` · made in ${s.seconds_to_result} seconds` : ""}</p><div class="try">${tryLink(s)}</div></div></section>
${scoreBlock(s)}
${decisionBlock(s)}
<section class="notes card" aria-labelledby="notes"><h2 id="notes">The facts</h2>${rows(notes, flawRow)}</section>
${cond}
<section class="flaw-sec" aria-labelledby="flaw"><h2 id="flaw" class="sr">The catch</h2>${fit(["The catch:", sentence(flawCaption)])}<p>${flawSource}</p></section>
<aside class="short-wrap" aria-label="The video">${shortBlock(s, label)}</aside>
<div class="more">${more}</div>
</article>`;
  const description = `${s.tool}${s.genus ? ` (${s.genus.toLowerCase()})` : ""}: ${live ? "tested once by SPECIMIND" : "researched by SPECIMIND, not tested"}. Our verdict: ${SAYS[s.verdict] ?? s.verdict}. The catch: ${lowerFirst(plain(s.flaw))}. Free plan: ${s.free_tier || "not published"}. Paid: ${s.paid_from || "not published"}.`;
  const hookText = plain(hook.join(" "));
  const name = `${hookText.toLowerCase().startsWith(s.tool.toLowerCase()) ? hookText : `${s.tool}: ${hookText}`} | SPECIMIND #${s.code}`;
  const jsonld = [
    videoLd(s, name, description),
    {
      "@context": "https://schema.org",
      "@type": "Review",
      name: `${s.tool}: ${SAYS[s.verdict] ?? s.verdict} (SPECIMIND #${s.code})`,
      url: `${SITE}/${s.code}/`,
      datePublished: s.posted_on || s.tested_on,
      itemReviewed: { "@type": "SoftwareApplication", name: s.tool, applicationCategory: s.genus || s.pillar, ...(s.homepage ? { url: s.homepage } : {}) },
      reviewRating: { "@type": "Rating", ratingValue: RATING[s.verdict], bestRating: 5, worstRating: 1, ratingExplanation: SAYS[s.verdict] ?? s.verdict },
      reviewBody: `Our verdict: ${SAYS[s.verdict] ?? s.verdict}. ${sentence(s.verdict_reason)} The catch: ${sentence(lowerFirst(plain(s.flaw)))}`.replace(/\s+/g, " ").trim(),
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
      title: `${s.tool}: ${SAYS[s.verdict] ?? s.verdict} · #${s.code} · SPECIMIND`,
      description,
      top: `<div class="disclosure"><div class="wrap"><p>${disclosureText(s)}</p></div></div>`,
      body,
      jsonld,
      js: SPECIMEN_JS,
      image: cover || "/brand/og.png",
    }),
  );
};
// The SPECIMIND Score (data/score.md) with its parts and the specimen's rank in its drawer.
const scoreBlock = (s) => {
  if (!s.score) return "";
  const r = rankOf(s);
  const n = scored(s.pillar).length;
  return `<section class="score card" aria-labelledby="score"><h2 id="score">SPECIMIND score</h2>
<p class="score-num"><b>${s.score.total}</b><span>/ 100</span></p>
<p class="lab">#${r} of ${n} in our <a href="/best/${slug(s.pillar)}/">${esc(s.pillar)} ranking</a> · <a href="/about/#score">how we score</a></p>
<dl class="bars">${(s.score.parts ?? []).map((p) => `<div><dt>${esc(p.key)}</dt><dd><span class="meter"><i style="width:${Math.round((100 * p.value) / p.max)}%"></i></span><span>${p.value}/${p.max}</span></dd></div>`).join("")}</dl></section>`;
};

// The decision: use it for / skip it if / the lesson, and, when we earn nothing from this tool or
// it failed, the best-scoring Captured alternatives in the same drawer (their Try links).
const decisionBlock = (s) => {
  const rows = [
    s.use_for ? `<div><dt>Good for</dt><dd>${esc(s.use_for)}</dd></div>` : "",
    s.skip_if ? `<div><dt>Not for</dt><dd>${esc(s.skip_if)}</dd></div>` : "",
    s.lesson ? `<div><dt>Tip</dt><dd>${esc(s.lesson)}</dd></div>` : "",
  ].join("");
  const alts = s.disclosure !== "Affiliate" || s.verdict === "Released"
    ? scored(s.pillar).filter((o) => o !== s && o.verdict === "Captured").slice(0, 3)
    : [];
  const altHtml = alts.length
    ? `<h3 class="alts-h">Also worth trying in ${esc(s.pillar)}</h3><ul class="alts">${alts.map((o) => `<li><a href="/${o.code}/" data-keep>#${o.code} ${esc(o.tool)}</a> <b>${o.score.total}</b>/100${o.affiliate_url ? ` · ${tryLinkInline(o)}` : ""}</li>`).join("")}</ul>`
    : "";
  return rows || altHtml ? `<section class="decide card" aria-labelledby="decide"><h2 id="decide">Should you use it?</h2>${rows ? `<dl class="rows">${rows}</dl>` : ""}${altHtml}</section>` : "";
};
const tryLinkInline = (o) => {
  const param = subidParam(o);
  const u = new URL(o.affiliate_url);
  if (param) u.searchParams.set(param, `p-web-e${epNum(o)}`);
  return `<a href="${esc(u.href)}" rel="sponsored noopener"${param ? ` data-subid="${esc(param)}" data-ep="${esc(epNum(o))}"` : ""}>Try it</a> (affiliate)`;
};

const VERDICT_LINE = {
  Captured: "Worth it: it did what we tested, in one try, well enough to use.",
  Released: "Skip it: it didn't pass our one-try test.",
  Watch: "Not tested: no free plan, so this is research only and we don't judge it.",
};

// ---------- /<P01|D01|M01|W01|X01>/ : a group ----------
const buildGroup = (g) => {
  const ranked = g.kind === "Plate" || g.kind === "Dissection";
  const members = [...g.members].sort((a, b) => (ranked ? (a.rank ?? 9) - (b.rank ?? 9) : 0));
  const item = (m, i) => {
    const s = m.code && byCode.get(m.code);
    const name = s ? `<a href="/${s.code}/" data-keep>#${s.code} · ${esc(s.tool)}</a>` : esc(m.tool ?? m.code);
    const verdict = m.verdict ?? s?.verdict;
    const note = m.note ?? (s ? `${s.score ? `${s.score.total}/100 · ` : ""}The catch: ${lowerFirst(plain(s.flaw))}` : "");
    const n = g.kind === "Dissection" ? `Step ${i + 1}` : g.kind === "Plate" ? `Rank ${m.rank ?? i + 1}` : "";
    const lead = ranked ? `<span class="rank" aria-hidden="true">${m.rank ?? i + 1}</span>` : s ? `<span aria-hidden="true">${tag(s.code, tone(s), "0")}</span>` : `<span class="rank" aria-hidden="true">·</span>`;
    return `<li style="${ranked ? "" : "grid-template-columns:84px 1fr"}">${lead}<div>${n ? `<span class="sr">${n}: </span>` : ""}<span class="t">${name}</span>${verdict ? ` <span class="badge">${SAYS[verdict] ?? verdict}</span>` : ""}${note ? `<div class="n">${esc(note)}</div>` : ""}${!s && m.tool ? `<div class="n">No page of its own yet.</div>` : ""}</div></li>`;
  };
  const hook = g.hook_lines?.length ? g.hook_lines : [g.title];
  const label = `${KIND_SAYS[g.kind] ?? g.kind} ${g.code}: ${g.title}`;
  const body = `<article class="wrap spec">
<header class="spec-head">${tag(g.code, "ink", "-3")}<div><p class="kicker">${KIND_SAYS[g.kind] ?? g.kind} ${g.code}</p><h1>${esc(g.title)}</h1><p class="genus">${KIND_LINE[g.kind]}</p><div class="badges"><span class="badge">${g.kind === "Extinction Watch" ? modeSays(false) : g.kind === "Drawer" ? "Made from our own tests" : modeSays(true)}</span><span class="badge${g.disclosure === "Affiliate" ? " aff" : ""}">${DISC_SAYS[g.disclosure] ?? g.disclosure}</span></div></div></header>
<div class="hook">${fit(hook)}</div>
<section class="notes" aria-labelledby="members"><h2 id="members" style="margin-bottom:10px">${g.kind === "Plate" ? "The ranking" : g.kind === "Dissection" ? "The steps" : g.kind === "Drawer" ? "The ranking" : g.kind === "Extinction Watch" ? "What to use instead" : "The tools"}</h2><ol class="members">${members.map(item).join("")}</ol></section>
${g.flaw ? `<section class="flaw-sec" aria-labelledby="flaw"><h2 id="flaw" class="sr">The catch</h2>${fit(["The catch:", sentence(lowerFirst(g.flaw))])}</section>` : ""}
${g.verdict ? `<section class="verdict" aria-label="Verdict">${stamp(g.verdict, "lands")}<p class="why">${esc(g.verdict_reason || VERDICT_LINE[g.verdict])}</p></section>` : ""}
<aside class="short-wrap" aria-label="The video">${shortBlock(g, label)}</aside>
<div class="more">${errata(g)}${watchLinks(g)}<p class="lab">${g.kind === "Drawer" ? "Made" : g.kind === "Extinction Watch" ? "Researched" : "Tested"} ${fmtDate(g.tested_on)}</p></div>
</article>`;
  const description = `${KIND_SAYS[g.kind] ?? g.kind} ${g.code} by SPECIMIND: ${g.title}. ${KIND_LINE[g.kind]} ${members.map((m) => m.tool ?? byCode.get(m.code)?.tool).filter(Boolean).join(", ")}.`;
  const jsonld = [
    videoLd(g, `${g.title} | ${KIND_SAYS[g.kind] ?? g.kind} ${g.code}`, description),
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

// ---------- /best/ : the leaderboards (the money pages) ----------
const buildBest = () => {
  const table = (list) =>
    list.length
      ? `<ol class="board">${list
          .map(
            (o, i) => `<li><span class="rank" aria-hidden="true">${i + 1}</span><a class="who" href="/${o.code}/">${tag(o.code, tone(o), "0")}<span><span class="t">${esc(o.tool)}</span><span class="m">${SAYS[o.verdict] ?? o.verdict} · ${esc(o.genus || o.pillar)} · free: ${esc(o.free_tier || "not published")}</span></span></a><span class="pts"><b>${o.score.total}</b>/100</span>${
              o.affiliate_url ? `<span class="go">${tryLinkInline(o)}</span>` : o.homepage ? `<span class="go"><a href="${esc(o.homepage)}" rel="noopener">Try it</a></span>` : ""
            }</li>`,
          )
          .join("")}</ol>`
      : `<p>No scored tools of this kind yet.</p>`;
  const intro = `<p class="dek">Every tool we've tested, ranked by its SPECIMIND score: one real try, the measured speed, what the free plan really gives you, and the cheapest price. <a href="/about/#score">How the score works</a>.</p>`;
  const disc = `<div class="disclosure"><div class="wrap"><p><b>Disclosure.</b> Some Try links on this page are affiliate links (marked); SPECIMIND may earn a commission at no extra cost to you. Rankings come from the score only. <a href="/about/#disclosure">Full disclosure</a>.</p></div></div>`;
  write(
    "best/index.html",
    page({
      path: "/best/",
      title: "The best AI tools, ranked by test · SPECIMIND",
      description: "Every AI tool SPECIMIND has tested, ranked by the SPECIMIND Score in its drawer: 3D, video, image, audio, work and build.",
      top: disc,
      nav: "best",
      body: `<div class="wrap prose wide-prose"><h1>Rankings</h1>${intro}${PILLARS.map((p) => `<h2><a href="/best/${slug(p)}/">Best ${esc(p)} AI tools</a></h2>${table(scored(p).slice(0, 5))}`).join("") || "<p>The first scores arrive with the first tests.</p>"}</div>`,
      js: SPECIMEN_JS,
    }),
  );
  for (const p of PILLARS) {
    const list = scored(p);
    write(
      `best/${slug(p)}/index.html`,
      page({
        path: `/best/${slug(p)}/`,
        title: `Best ${p} AI tools, ranked by real tests · SPECIMIND`,
        description: `${list.length} ${p} AI tools tested once each and ranked by the SPECIMIND Score${list[0] ? `. #1: ${list[0].tool} (${list[0].score.total}/100)` : ""}.`,
        top: disc,
        nav: "best",
        body: `<div class="wrap prose wide-prose"><p class="kicker"><a href="/best/">Rankings</a></p><h1>Best ${esc(p)} AI tools</h1>${intro}${table(list)}</div>`,
        jsonld: [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Best ${p} AI tools (SPECIMIND Score)`,
            itemListOrder: "https://schema.org/ItemListOrderDescending",
            itemListElement: list.map((o, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${o.code}/`, name: `${o.tool} (${o.score.total}/100)` })),
          },
        ],
        js: SPECIMEN_JS,
      }),
    );
  }
};

// ---------- /about/ ----------
const buildAbout = () => {
  const body = `<div class="wrap prose">
${tag("#", "red", "-4")}
<h1>How we test</h1>
<p class="dek">We try new AI tools so you don't have to guess. Every video and every page here follows the same simple rules.</p>
<ol class="code-list">
<li><span><b>We show what it made first.</b>Every video opens on the real result of our test, not on a title card or a promise.</span></li>
<li><span><b>One try.</b>We run the test once, on the plan we name (usually the free one), and show what came out, good or bad. If a test ever needs more than one try, we say how many.</span></li>
<li><span><b>The catch, circled in red.</b>Every test shows one real problem, circled on screen. If nothing went wrong in our try, we name the biggest limitation from the tool's own pages and say so.</span></li>
<li><span><b>The price, on screen.</b>What the free plan gives you and what the cheapest paid plan costs, from the tool's own pages, with sources on its page here. If a number isn't published, we say so. We never guess.</span></li>
<li><span><b>A plain verdict.</b><em>Worth it</em>: it did what we tested, well enough to use. <em>Skip it</em>: it didn't. <em>Not tested</em>: the tool has no free plan, so we only researched it and we don't judge it.</span></li>
<li><span><b>Always labelled.</b>“Tested by us” means we ran the test ourselves and the footage is our own recording. “Not tested · research only” means the video is built from the tool's public pages, with diagrams we drew ourselves. The label stays on screen for the whole video.</span></li>
<li><span><b>Numbers in the order videos come out.</b>Each video gets the next number (#001, #002 …) when it's made. A number is never changed or reused. If we get something wrong, the page keeps its number and gets a dated correction.</span></li>
<li><span><b>Nothing borrowed.</b>No narration, no AI voice, no copyrighted music, no other creators' footage, no tool logos as the main picture. Our music is made in code.</span></li>
<li><span><b>Disclosure from start to finish.</b>“Affiliate link” or “Not sponsored” stays on screen for the whole video, and the disclosure is at the top of every page here.</span></li>
</ol>
<h2 id="score">The SPECIMIND score</h2>
<p>Every tool we test gets one number out of 100, so you can compare tools of the same kind at a glance. It comes from the test, by fixed rules, and we never adjust it:</p>
<ul>
<li><b>Quality, 50 points.</b> Each try starts at 50 and loses points for what went wrong (for 3D: broken into pieces, thin parts lost, extra bits, wrong shape). Failed tries count.</li>
<li><b>Speed, 15 points.</b> How many seconds it took, measured, compared with other tools of the same kind.</li>
<li><b>Free plan, 25 points.</b> Whether you need an account or a card, how much the free plan gives you each day, and whether the main feature is locked.</li>
<li><b>Price, 10 points.</b> The cheapest paid plan per month.</li>
</ul>
<p>Tools we couldn't test get no score. Our <a href="/best/">rankings</a> list every scored tool by kind.</p>
<h2 id="disclosure">Affiliate disclosure</h2>
<p>Some links on this site are affiliate links. If you sign up for or pay for a tool through one of them, SPECIMIND may earn a commission. You pay the same price either way.</p>
<p><b>What the labels mean.</b> <em>Affiliate link</em> means we've joined that tool's affiliate programme, so the “Try” link on its page may earn us a commission. <em>Not sponsored</em> means there's no affiliate link and no payment of any kind: the button goes to the tool's homepage.</p>
<p><b>Money never decides a verdict.</b> The verdict comes from the one try in the video. A tool with an affiliate programme can still get “Skip it”, and its catch is shown either way. No tool has paid us. If that ever changes, the word “Sponsored” will appear where the disclosure sits, in the video and on the page.</p>
<p><b>Sub-IDs.</b> Where the affiliate network supports it, our links carry a short tag such as <code>p-yt-e001</code>: the platform you came from (YouTube, Instagram, X or this website) and the episode number. It tells us which videos are useful. It contains nothing about you.</p>
<p><b>Where the disclosure appears.</b> On screen for the whole video, at the top of every page, next to every affiliate button, and in each post's caption. We follow India's ASCI guidelines for influencer advertising and the US FTC's Endorsement Guides.</p>
<h2 id="privacy">Privacy</h2>
<p>This site sets no cookies, runs no analytics, loads no tracking pixels and no third-party scripts. The font is served from this site. The only outside content is the YouTube player on a test's page, which loads from youtube-nocookie.com only after you press play. Once you follow a “Try” link you are on the tool's or the affiliate network's site, under their privacy policy.</p>
<h2>Find a test</h2>
<p>Type the number after the slash: <a href="/001/">specimindlab.github.io/001</a>. Head-to-heads, workflows, AI-or-real videos and roundups use P, D, M and W: <code>/P01</code>, <code>/D01</code>, <code>/M01</code>, <code>/W01</code>. Machines can read the whole list at <a href="/llms.txt">/llms.txt</a>.</p>
<p>Follow <b>@${HANDLE}</b> on ${Object.entries(PROFILES).map(([k, v]) => `<a href="${v}" rel="me noopener">${k}</a>`).join(", ").replace(/, ([^,]*)$/, " and $1")}.</p>
</div>`;
  write(
    "about/index.html",
    page({
      path: "/about/",
      title: "How we test, and our disclosure · SPECIMIND",
      description: "How SPECIMIND tests AI tools: the real result first, one try, the catch circled, prices with sources, a plain verdict. Plus our full affiliate disclosure.",
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
if (code) msg.textContent = "#" + code + " isn't here yet.";
const q = document.getElementById("q");
if (raw && !code) q.value = raw.replace(/[-_/]+/g, " ");
})();`;
  const body = `<div class="wrap prose">
${tag("404", "outline", "-4")}
<h1>Not in the drawer</h1>
<p id="msg">There is no page at this address.</p>
<form class="finder" action="/" method="get" role="search"><label for="q" class="lab">Search by number or tool</label><div class="search"><span class="no" aria-hidden="true">#</span><input id="q" name="q" type="search" autocomplete="off" spellcheck="false" placeholder="047"><button type="submit">Search</button></div></form>
<p><a href="/">See all our tests</a>.</p>
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
    "> SPECIMIND tests new AI tools. Each entry is one real test of one tool: one try, the price, the catch, and a plain verdict (Worth it, Skip it, or Not tested for tools with no free plan, which we only research).",
    "",
    "Format: number, tool, verdict, score, the catch, URL. Prices, how we tested and sources are on each page. How we test and the affiliate disclosure: " + `${SITE}/about/`,
    "",
    "## Tests",
    "",
    ...(ordered.length
      ? ordered.map((s) => `- [#${s.code} ${s.tool}](${SITE}/${s.code}/): ${SAYS[s.verdict] ?? s.verdict}${s.score ? `, SPECIMIND score ${s.score.total}/100` : ""}. The catch: ${lowerFirst(plain(s.flaw))}. ${modeSays(s.mode !== "Field sketch")}; ${s.pillar}; ${DISC_SAYS[s.disclosure] ?? s.disclosure}.`)
      : ["No tests yet."]),
  ];
  if (groups.length) {
    lines.push("", "## Roundups and head-to-heads", "");
    for (const g of groups) {
      const who = g.members.map((m) => (m.code && byCode.has(m.code) ? `#${m.code} ${byCode.get(m.code).tool}` : m.tool ?? m.code)).join(", ");
      lines.push(`- [${g.code} ${g.title}](${SITE}/${g.code}/): ${KIND_SAYS[g.kind] ?? g.kind}. ${who}.${g.flaw ? ` The catch: ${lowerFirst(plain(g.flaw))}.` : ""}`);
    }
  }
  lines.push("", "## Optional", "", `- [How we test, and our disclosure](${SITE}/about/)`, "");
  write("llms.txt", lines.join("\n"));
  const urls = [
    ["/", today],
    ["/about/", today],
    ["/best/", today],
    ...PILLARS.map((p) => [`/best/${slug(p)}/`, today]),
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
buildBest();
buildAbout();
build404();
buildText();
console.log(`built ${out}: ${specimens.length} specimens, ${groups.length} groups${FIXTURE ? " (DESIGN FIXTURE, do not deploy)" : ""}`);
