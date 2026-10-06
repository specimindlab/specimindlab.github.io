# Series compositions

One Remotion composition per series in `data/series.md`. Each takes `{ script, platform }`, where
`script` is the episode's `script.json`, validated by that series' zod schema. Duration is the sum of
the beat `seconds` (same rule as `scripts/episode_frames.mjs`) and must land between 28 and 40 s.
The beat ORDER is enforced per series, so a script written for one series fails validation in any
other (CLAUDE.md: never reuse one series' structure for another). Working examples:
`fixtures/<Composition>.json` (design fixtures, not research). `DrawerFixture` is a Studio-only
copy of `Drawer` that reads `fixtures/catalog.fixture.json`; the real `Drawer` always reads
`data/catalog.json` and fails loudly if a code is missing.

Common fields (every series): `id` (E###), `code`, `composition`, `series`, `mode`
("Live specimen" | "Field sketch"), `disclosure` ("Affiliate" | "Unpaid"), `tool`, `genus`, `bed`
(`"sfx/bed-<1-6>.wav"`, a different bed from the previous upload; the motif is added on the last beat automatically), `cta: { yt, ig, x }` (the last beat's caption; "\n" forces a line break),
`beats[]`. Every caption line carries 2-6 words, 1-3 lines per beat.

Media (`media`): `{ kind: "image" | "video" | "glb", src, fit?, clay?, start_at?, sound?, crop? }`.
`src` is relative to the episode folder (staged to `public/episodes/<id>/` by the render scripts);
`@/...` means `video/public/...`. Regions (`region`) are 0..1 fractions of the media frame.

| Composition | Beat order | Series-level fields | Ends on |
| --- | --- | --- | --- |
| `FieldSpecimen` | output · conditions · observation · notes · verdict | — | drawer cell of this code |
| `FreeRange` | counter · observation ×2-3 · price-math · flaw · verdict | — | counter, frozen |
| `RareSighting` | stamp-open · output · observation · notes (3 rows) · verdict | — | "Spotted" date under the stamp |
| `Plate` | triptych · triptych-fill · flaw · verdict · cta | `input`, `input_label`, `specimens[3]` | ranked triptych |
| `FieldSketch` | sketch · notes · price-math · flaw · verdict | — (mode must be Field sketch) | Watch stamp over the sketch |
| `Mimicry` | split · details · countdown · reveal · cta | `a`, `b`, `ai`, `flaw` | revealed split (loops) |
| `Dissection` | output · tray · observation ×stages · flaw · verdict | `stages[2-3]` | full tray with totals |
| `Drawer` | drawer-open · roll-call · tally · cta | `week`, `codes[]` (must exist in data/catalog.json) | drawer sliding shut |
| `ExtinctionWatch` | extinct · timeline · successors · flaw · verdict | `extinct_name`, `extinct_note`, `successors[3]`, `pick` (mode must be Field sketch) | extinct label + successors |

Beat payloads (beyond `type`, `seconds`, `lines`):

- FieldSpecimen: output `media`; conditions `rows[]` (must include Attempts); observation `input`,
  `result`, `seconds_to_result`, `scale_max?`; notes `rows[]` (must include Free tier and Paid from),
  `flaw_row`; verdict `verdict` (Captured | Released, no `lines`: the CTA is the caption).
- FreeRange: counter `total`, `unit`, `period`; observation `result`, `seconds_to_result`,
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
