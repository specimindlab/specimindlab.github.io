# Series compositions

One Remotion composition per series in `data/series.md`. Each takes `{ script, platform }`, where
`script` is the episode's `script.json`, validated by that series' zod schema. Duration is the sum of
the beat `seconds` (same rule as `scripts/episode_frames.mjs`): 18-40 s enforced, 20-30 s the target,
and every beat's `seconds` is a multiple of 0.5 (one beat at 120 bpm, so cuts land on the music).
The beat ORDER is enforced per series, so a script written for one series fails validation in any
other (CLAUDE.md: never reuse one series' structure for another). Working examples:
`fixtures/<Composition>.json` (design fixtures, not research). `DrawerFixture` is a Studio-only
copy of `Drawer` that reads `fixtures/catalog.fixture.json`; the real `Drawer` always reads
`data/catalog.json` and fails loudly if a code is missing.

Common fields (every series): `id` (E###), `code`, `composition`, `series`, `mode`
("Live specimen" | "Field sketch"), `disclosure` ("Affiliate" | "Unpaid"), `tool`, `genus`,
`music` ("music.wav", composed by `scripts/make_music.py`) and `groove` (1-6, never the previous
upload's), or the legacy `bed`; `cta: { yt, ig, x }` (the end card's ask on each platform's video,
"\n" forces a line break; the hub URL is printed under it automatically), `cover`, `beats[]`.
Every caption line carries 1-6 words, 1-3 lines per beat. The first beat's lines are all on screen
on frame 0; later lines pop in on the cut.

Score and decision (Live specimens): FieldSpecimen, FreeRange and RareSighting take an optional
`score` beat `{ total, parts[1-4]: { key, value, max } }` (parts must add up to total; never in Field
sketch mode) and the verdict takes optional `use_for` / `skip_if` (max 40 characters each). The
verdict beat renders the shared end card (`endcard.tsx`): stamp, score, the "Field verdict" card,
the series' signature if there is room, then the CTA.

Media (`media`): `{ kind: "image" | "video" | "glb", src, fit?, clay?, start_at?, sound?, crop? }`.
`src` is relative to the episode folder (staged to `public/episodes/<id>/` by the render scripts);
`@/...` means `video/public/...`. Regions (`region`) are 0..1 fractions of the media frame.

| Composition | Beat order | Series-level fields | Ends on |
| --- | --- | --- | --- |
| `FieldSpecimen` | output · conditions · observation · notes · score? · verdict | — | end card + drawer cell of this code |
| `FreeRange` | counter · observation ×2-3 with one flaw after its observation · price-math · score? · verdict | — | end card + frozen counter |
| `RareSighting` | stamp-open · output · observation · notes (3 rows) · score? · verdict | — | end card + "Spotted" date |
| `Plate` | triptych · triptych-fill · flaw · verdict · cta | `input`, `input_label`, `specimens[3]` (each with an optional `score`) | ranked triptych with scores |
| `FieldSketch` | sketch · notes · price-math · flaw · verdict | — (mode must be Field sketch) | Watch stamp over the sketch |
| `Mimicry` | split · details · countdown · reveal · cta | `a`, `b`, `ai`, `flaw` | revealed split (loops) |
| `Dissection` | output · tray · observation ×stages · flaw · verdict | `stages[2-3]` | full tray with totals |
| `Drawer` | drawer-open · roll-call · tally · cta | `week`, `codes[]` (must exist in data/catalog.json) | drawer sliding shut |
| `ExtinctionWatch` | extinct · timeline · successors · flaw · verdict | `extinct_name`, `extinct_note`, `successors[3]`, `pick` (mode must be Field sketch) | extinct label + successors |

Beat payloads (beyond `type`, `seconds`, `lines`):

- FieldSpecimen: output `media`, `before?` (input photo: frame 0 shows before -> after); conditions `rows[]` (must include Attempts); observation `input`,
  `result`, `seconds_to_result`, `scale_max?`; notes `rows[]` (must include Free tier and Paid from),
  `flaw_row`; verdict `verdict` (Captured | Released, no `lines`: the CTA is the caption).
- FreeRange: counter `total`, `unit`, `period`, `media?`, `before?`; observation `result`, `seconds_to_result`,
  `used_after` (cumulative); price-math `rows[]`, `result`; flaw `result_index`, `region`, `note`;
  verdict `verdict`.
- RareSighting: stamp-open `launched`, `crop` (media with a crop); output `media`; observation `input`,
  `result`, `seconds_to_result`; notes `rows[3]`, `flaw`; verdict `verdict`, `spotted`
  (Watch only, and always, in Field sketch mode).
- Plate: `specimens[]` = `{ code, tool, media, seconds, flaw: { text, region }, rank }`, ranks 1-3 once each.
- FieldSketch: sketch `inputs[]`, `process`, `outputs[]`; notes `rows[]`; price-math `rows[]`, `result`;
  flaw `text`, `source`, `flaw_source: "research"`.
- Mimicry: details `crops[]` = `{ a: region, b: region }`.
- Dissection: `stages[]` = `{ tool, media, seconds, cost }`; flaw `stage`, `region`; verdict `verdict`,
  `total_cost`.
- ExtinctionWatch: timeline `rows[]` (key = date); flaw `text`.

Layout contract (all series): the pinned label + disclosure + mode sit at the top for the whole video;
content starts at y 430; the caption stack's lowest descender sits on y 1440; nothing is drawn below
1440 or right of x 1010, and no text right of x 930. QA: `scripts/render_series_test.sh`,
`scripts/render_system_test.sh`, then `scripts/check_safe_zones.py` on the stills.
