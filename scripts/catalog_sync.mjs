#!/usr/bin/env node
// Upserts finished episodes into data/catalog.json (Playbook P, last step), from the episode's
// brief.json + facts.json + script.json. Fields the human fills later (links, affiliate_url,
// affiliate_subid_param, corrections) are never overwritten. Catalog numbers are permanent: an
// episode cannot move to another code and a code cannot be taken by another episode.
//
//   node scripts/catalog_sync.mjs E001 [E002 ...]     write data/catalog.json
//   node scripts/catalog_sync.mjs E001 --dry-run      print the entries instead
//   node scripts/catalog_sync.mjs E001 --root <dir>   another repo root (tests)
//
// Then `node site/build.mjs` validates the catalog and builds the pages.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const root = opt("--root") ?? join(dirname(fileURLToPath(import.meta.url)), "..");
const ids = argv.filter((a, i) => /^E\d{3}$/i.test(a) && argv[i - 1] !== "--root").map((a) => a.toUpperCase());
if (!ids.length) {
  console.error("usage: node scripts/catalog_sync.mjs E001 [E002 ...] [--dry-run]");
  process.exit(2);
}
const catalogPath = join(root, "data/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
catalog.specimens ??= [];
catalog.groups ??= [];
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);
const HUMAN = ["links", "affiliate_url", "affiliate_subid_param", "corrections", "posted_on"];
const GROUP_KIND = { Plate: "Plate", Dissection: "Dissection", Mimicry: "Mimicry", Drawer: "Drawer", ExtinctionWatch: "Extinction Watch" };
const str = (v) => (v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : String(v));
const orNP = (v) => str(v) || "Not published";

const beat = (script, type) => script?.beats?.find((b) => b.type === type);
const firstLines = (script) => script?.beats?.find((b) => b.lines?.length)?.lines ?? [];
const flawCaption = (script) => {
  // "Honest flaw:" may stand alone on its line or start it ("Honest flaw: chrome" / "lamp shattered.").
  for (const b of script?.beats ?? []) {
    const text = (b.lines ?? []).join(" ").replace(/\s+/g, " ").trim();
    const m = text.match(/^(?:honest flaw|the catch):\s*(.+)$/i);
    if (m) return m[1];
  }
  return "";
};
const sources = (facts) =>
  (facts?.sources ?? []).map((s) => (typeof s === "string" ? { url: s } : { url: s.url, label: s.label ?? s.title ?? "", accessed: s.accessed ?? s.accessed_on ?? "" })).filter((s) => /^https:\/\//.test(s.url ?? ""));
const cover = (folder, id) => [`${id}-cover.png`, "cover.png"].map((f) => `episodes/${folder}/${f}`).find((p) => existsSync(join(root, p))) ?? "";
const verdictOf = (facts, script) => {
  const v = facts?.verdict;
  return (typeof v === "object" && v ? v.value ?? v.verdict : v) ?? beat(script, "verdict")?.verdict ?? null;
};
const reasonOf = (facts) => {
  const v = facts?.verdict;
  return str(facts?.verdict_reason ?? facts?.verdict_reasons ?? (typeof v === "object" && v ? v.reason ?? v.reasons : ""));
};

const entryFor = (id) => {
  const folder = readdirSync(join(root, "episodes")).find((d) => d.toUpperCase().startsWith(`${id}-`));
  if (!folder) throw new Error(`${id}: no folder episodes/${id}-*`);
  const dir = join(root, "episodes", folder);
  const brief = readJson(join(dir, "brief.json"));
  const facts = readJson(join(dir, "facts.json"));
  const script = readJson(join(dir, "script.json"));
  if (!brief) throw new Error(`${id}: brief.json missing`);
  if (!facts) throw new Error(`${id}: facts.json missing (Playbook R)`);
  if (!script) throw new Error(`${id}: script.json missing (Playbook V)`);
  const code = script.code ?? brief.code;
  if (!code || code === "TBD") throw new Error(`${id}: no code assigned yet`);
  // facts.disclosure = the relationship today (set by /affiliate after a video is out); the video keeps its own label.
  const disclosure = facts.disclosure ?? script.disclosure ?? brief.disclosure;
  const composition = script.composition ?? brief.composition;
  const common = {
    code,
    episode: id,
    pillar: brief.pillar,
    series: brief.series,
    tested_on: facts.tested_on ?? facts.captured_on ?? brief.date,
    hook_lines: firstLines(script),
    disclosure,
    cover: cover(folder, id),
    links: { youtube: "", instagram: "", x: "" },
  };
  if (GROUP_KIND[composition]) {
    const kind = GROUP_KIND[composition];
    let members = [];
    if (kind === "Plate") members = (script.specimens ?? []).map((s) => ({ code: /^\d{3}$/.test(s.code ?? "") ? s.code : undefined, tool: s.tool, rank: s.rank, note: s.flaw?.text }));
    if (kind === "Dissection") members = (script.stages ?? []).map((s, i) => ({ tool: s.tool, rank: i + 1, note: [s.seconds && `${s.seconds} s`, s.cost && `cost ${s.cost}`].filter(Boolean).join(", ") }));
    if (kind === "Mimicry") members = [{ tool: script.tool ?? brief.tools?.[0], note: script.ai ? `Side ${String(script.ai).toUpperCase()} was AI` : "" }];
    if (kind === "Drawer") members = (script.codes ?? []).map((c) => ({ code: c }));
    if (kind === "Extinction Watch") members = (script.successors ?? []).map((s) => ({ tool: s.tool ?? s.name, note: str(s.line ?? s.free_tier) }));
    const flaw = facts.flaw?.text ?? (typeof facts.flaw === "string" ? facts.flaw : script.flaw?.text ?? beat(script, "flaw")?.text ?? "");
    return {
      group: true,
      ...common,
      kind,
      title: (brief.title ?? brief.youtube_title_draft ?? brief.tools_raw ?? code).split(" | ")[0],
      members: members.map((m) => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined && v !== ""))),
      flaw,
      verdict: kind === "Dissection" ? verdictOf(facts, script) ?? undefined : undefined,
    };
  }
  const notesBeat = beat(script, "notes");
  const condBeat = beat(script, "conditions");
  const flaw = facts.flaw?.text ?? (typeof facts.flaw === "string" ? facts.flaw : notesBeat?.rows?.[notesBeat.flaw_row]?.value ?? "");
  const notes = notesBeat?.rows?.length
    ? notesBeat.rows.map((r) => ({ key: r.key, value: r.value }))
    : [
        { key: "Works in", value: orNP(facts.habitat) },
        { key: "You give it", value: orNP(facts.feeds_on) },
        { key: "Free plan", value: orNP(facts.free_tier) },
        { key: "Paid", value: orNP(facts.paid_from) },
        ...(facts.licence_note ? [{ key: "Licence", value: str(facts.licence_note) }] : []),
      ];
  if (!notes.some((r) => r.key === "Weakness" || r.key === "The catch")) notes.push({ key: "The catch", value: flaw });
  const seconds = facts.seconds_to_result ?? beat(script, "observation")?.seconds_to_result;
  const conditions = Array.isArray(facts.conditions) && facts.conditions.length
    ? facts.conditions.map((r) => ({ key: r.key, value: str(r.value) }))
    : condBeat?.rows?.length
    ? condBeat.rows.map((r) => ({ key: r.key, value: r.value }))
    : (script.mode ?? brief.mode) === "Field sketch"
      ? []
      : [
          { key: "Test", value: brief.the_test },
          { key: "Plan", value: str(facts.plan) || "Free tier" },
          { key: "Attempts", value: str(facts.attempts ?? 1) },
        ];
  if (seconds && !conditions.some((r) => /seconds/i.test(r.key)) && conditions.length) conditions.push({ key: "Seconds to result", value: `${seconds} s` });
  if (facts.auto_captured && !conditions.some((r) => r.key === "Recording")) conditions.push({ key: "Recording", value: "Screen-recorded by us on the free demo page" });
  const first = sources(facts)[0]?.url;
  const homepage = facts.homepage ?? facts.url ?? (first ? `${new URL(first).origin}/` : "");
  return {
    ...common,
    tool: facts.tool ?? script.tool ?? brief.tools?.[0],
    genus: facts.genus ?? script.genus ?? "",
    mode: (script.mode ?? brief.mode) === "Field sketch" ? "Field sketch" : "Live specimen",
    verdict: verdictOf(facts, script),
    verdict_reason: reasonOf(facts),
    flaw,
    flaw_caption: flawCaption(script),
    flaw_source: facts.flaw_source ?? (facts.flaw?.source === "research" ? "research" : "observed"),
    flaw_at: str(facts.flaw?.timestamp),
    free_tier: orNP(facts.free_tier),
    paid_from: orNP(facts.paid_from),
    seconds_to_result: seconds ?? undefined,
    conditions,
    field_notes: notes,
    homepage: /^https:\/\//.test(homepage) ? homepage : "",
    sources: sources(facts),
    credits: str(facts.credits),
    score: facts.score?.total !== undefined ? { total: facts.score.total, parts: facts.score.parts ?? [] } : undefined,
    use_for: str(facts.use_for),
    skip_if: str(facts.skip_if),
    lesson: str(facts.lesson),
    affiliate_url: "",
  };
};

let changed = 0;
for (const id of ids) {
  const { group, ...fresh } = entryFor(id);
  for (const k of Object.keys(fresh)) if (fresh[k] === undefined) delete fresh[k];
  const list = group ? catalog.groups : catalog.specimens;
  const all = [...catalog.specimens, ...catalog.groups];
  const byCode = all.find((e) => e.code === fresh.code);
  const byEpisode = all.find((e) => e.episode === id);
  if (byCode && byCode.episode !== id) throw new Error(`${id}: code ${fresh.code} already belongs to ${byCode.episode}. Catalog numbers are never reused.`);
  if (byEpisode && byEpisode.code !== fresh.code) throw new Error(`${id}: already catalogued as ${byEpisode.code}. Catalog numbers are never renumbered.`);
  const old = list.find((e) => e.code === fresh.code);
  const merged = { ...fresh };
  if (old) for (const k of HUMAN) if (old[k] !== undefined && old[k] !== "") merged[k] = old[k];
  if (old) {
    merged.updated_on = new Date().toISOString().slice(0, 10);
    list[list.indexOf(old)] = merged;
  } else list.push(merged);
  changed++;
  if (flag("--dry-run")) console.log(JSON.stringify(merged, null, 2));
}
catalog.specimens.sort((a, b) => a.code.localeCompare(b.code));
catalog.groups.sort((a, b) => a.code.localeCompare(b.code));
if (!flag("--dry-run")) {
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`${changed} entr${changed === 1 ? "y" : "ies"} synced into data/catalog.json`);
}
