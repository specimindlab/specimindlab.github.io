import React from "react";
import { Img, interpolate, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS } from "../brand";
import { CATALOG, CatalogEntry, Drawer, drawerSize, PinnedTag, Plate, Sfx, Stamp, AXES, Line, useAsset } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, framed, seriesProps, seriesScript, timeline } from "./common";
import { ctaBox, CtaCaption } from "./endcard";
import { CARD, LABEL, tagText, VERDICT_WORD } from "../vocab";

// 8. The Drawer (DR): the Sunday recap, built only from data/catalog.json. The drawer slides open
// -> roll call: each label lights up, its verdict mini-stamp lands and its flaw note appears ->
// the tally per verdict -> next week's covered label -> the drawer slides shut.
// The Drawer never invents a verdict: every code must exist in the catalog.

const open = beat("drawer-open", { lines: caption });
const rollCall = beat("roll-call", {});
const tally = beat("tally", { lines: caption });
const cta = beat("cta", {});

export const drawerScript = seriesScript(
  "Drawer",
  {
    week: z.number().int().positive(),
    codes: z.array(z.string().regex(/^\d{3}$/)).min(2).max(10),
    /** Show each specimen's real cover (staged by scripts/stage_drawer_covers.py). Fixtures: false. */
    covers: z.boolean().default(true),
  },
  z.discriminatedUnion("type", [open, rollCall, tally, cta]),
  /^drawer-open roll-call tally cta$/,
  "drawer-open, roll-call, tally, cta",
);
export const drawerProps = seriesProps(drawerScript);
export type DrawerSeriesProps = z.infer<typeof drawerProps>;

const CAP = 380;
const VERDICTS = ["Captured", "Released", "Watch"] as const;

const DrawerSeriesBody: React.FC<DrawerSeriesProps> = ({ script, platform, catalog = CATALOG }) => {
  const byCode = new Map(catalog.map((e) => [e.code, e]));
  const entries = script.codes.map((c) => {
    const e = byCode.get(c);
    if (!e) throw new Error(`Drawer ${script.code}: specimen ${c} is not in data/catalog.json. The Drawer only shows published specimens.`);
    return e;
  });
  const t = timeline(script.beats);
  const ctaLines = ctaFor(script.cta, platform);
  const roll = t.find((b) => b.type === "roll-call");
  const total = t.reduce((a, b) => a + b.dur, 0);
  const per = roll ? roll.dur / entries.length : 0;
  const litAt = Object.fromEntries(entries.map((e, i) => [e.code, (roll?.from ?? 0) + Math.round(i * per)]));
  const rows = Math.ceil(entries.length / 5);
  const ds = drawerSize(5, rows);
  const dx = 70 + (860 - ds.width) / 2;
  const dy = CONTENT_TOP + 50;
  return (
    <>
      <ShutClip total={total} y={dy - 50} h={ds.height + 60}>
        <Drawer highlight="" codes={script.codes} cols={5} rows={rows} x={dx} y={dy} start={script.covers ? (t[0]?.dur ?? 0) : -30} catalog={catalog} lit={litAt} heading={`Roundup #${script.week}`} />
      </ShutClip>
      {t.map((b) => (
        <Beat key={b.index} t={b}>
          {b.type === "drawer-open" && script.covers ? (
            <CoverRow entries={entries} top={CONTENT_TOP} bottom={captionBox(b.lines, CAP).contentBottom - 20} />
          ) : null}
          {b.type === "roll-call" ? <RollCall entries={entries} per={per} top={dy + ds.height + 70} covers={script.covers} /> : null}
          {b.type === "tally" ? <Tally entries={entries} y={dy + ds.height + 70} /> : null}
          {b.type === "cta" ? <Teaser y={Math.min(dy + ds.height + 120, ctaBox(ctaLines, CAP).contentBottom - 200)} /> : null}
          {"lines" in b ? <Caption lines={b.lines} maxHeight={CAP} /> : null}
          {b.type === "cta" ? <CtaCaption lines={ctaLines} code={script.code} maxHeight={CAP} /> : null}
        </Beat>
      ))}
    </>
  );
};

/** Clips the drawer so it can slide shut (down, out of its opening) over the last 14 frames. */
const ShutClip: React.FC<{ total: number; y: number; h: number; children: React.ReactNode }> = ({ total, y, h, children }) => {
  const frame = useCurrentFrame();
  const shut = interpolate(frame, [total - 14, total - 1], [0, h], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: -y + shut, width: 1080, height: 1920 }}>{children}</div>
    </div>
  );
};

/** Frame 0 of a Drawer: the week's real covers in a row, each with its score (or "Watch"). */
export const CoverRow: React.FC<{ entries: CatalogEntry[]; top: number; bottom: number }> = ({ entries, top, bottom }) => {
  const asset = useAsset();
  const gap = 24;
  const h = Math.max(160, bottom - top);
  const w = Math.min((860 - gap * (entries.length - 1)) / entries.length, (h * 9) / 16);
  const x0 = 70 + (860 - (w * entries.length + gap * (entries.length - 1))) / 2;
  return (
    <>
      {entries.map((e, i) => {
        const x = x0 + i * (w + gap);
        const tag = e.score ? `${e.score.total}` : VERDICT_WORD[e.verdict] ?? e.verdict;
        return (
          <React.Fragment key={e.code}>
            <Plate x={x} y={top} w={w} h={(w * 16) / 9} crosses={false} border={3}>
              <Img src={asset(`covers/${e.code}.png`)} style={{ width: w, height: (w * 16) / 9, display: "block" }} />
            </Plate>
            <div style={{ position: "absolute", left: x + w - 150, top: top + (w * 16) / 9 - 92, width: 136, height: 76, background: COLORS.label, border: `3px solid ${COLORS.ink}` }} />
            <Line text={tag} x={x + w - 82} baseline={top + (w * 16) / 9 - 32} maxWidth={120} size={e.score ? 60 : 30} axes={AXES.digits} anchor="middle" color={e.score ? COLORS.red : COLORS.ink} />
          </React.Fragment>
        );
      })}
    </>
  );
};

const RollCall: React.FC<{ entries: CatalogEntry[]; per: number; top: number; covers: boolean }> = ({ entries, per, top, covers }) => {
  const frame = useCurrentFrame();
  const asset = useAsset();
  const i = Math.min(entries.length - 1, Math.floor(frame / per));
  const e = entries[i];
  const local = Math.round(i * per);
  // With covers: the episode's real cover on the left (9:16), the facts on the right.
  const cw = covers ? 380 : 0;
  const tx = covers ? 70 + cw + 36 : 70;
  const tw = 930 - tx;
  const sx = tx + tw / 2;
  // The layout is drawn for ~700 px; a two-row drawer leaves less, so scale it into what is left
  // above the caption band (y 1440).
  const k = Math.min(1, (1430 - top) / (covers ? (cw * 16) / 9 : 660));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: k < 1 ? `scale(${k})` : undefined, transformOrigin: `70px ${top}px` }}>
      {covers ? (
        <Plate key={`c${e.code}`} x={70} y={top} w={cw} h={(cw * 16) / 9} border={3}>
          <Img src={asset(`covers/${e.code}.png`)} style={{ width: cw, height: (cw * 16) / 9, display: "block" }} />
        </Plate>
      ) : null}
      <Line text={tagText(e.code)} x={tx} baseline={top + 50} maxWidth={tw} size={46} axes={AXES.digits} color={COLORS.steel} />
      <Line text={e.tool} x={tx} baseline={top + 140} maxWidth={tw} size={80} axes={AXES.tool} />
      {e.score ? (
        <Line text={`${e.score.total}/100`} x={tx} baseline={top + 300} maxWidth={tw} size={130} axes={AXES.digits} color={COLORS.red} />
      ) : (
        <Line text={LABEL.noScore} x={tx} baseline={top + 260} maxWidth={tw} size={40} axes={AXES.key} color={COLORS.steel} />
      )}
      <Stamp key={e.code} word={e.verdict} x={covers ? sx : 300} y={top + 430} width={Math.min(440, tw - 20)} start={local + 4} />
      {frame >= local + 12 && e.flaw ? (
        <>
          <Line text={CARD.catch} x={tx} baseline={top + 570} maxWidth={tw} size={30} axes={AXES.key} color={COLORS.steel} />
          <Line text={e.flaw} x={tx} baseline={top + 626} maxWidth={tw} size={46} axes={AXES.note} color={COLORS.red} />
        </>
      ) : null}
    </div>
  );
};

const Tally: React.FC<{ entries: CatalogEntry[]; y: number }> = ({ entries, y }) => {
  const colW = 860 / 3;
  return (
    <>
      {VERDICTS.map((v, i) => {
        const n = entries.filter((e) => e.verdict === v).length;
        const cx = 70 + i * colW;
        return (
          <React.Fragment key={v}>
            <Line text={String(n)} x={cx} baseline={y + 120} maxWidth={colW - 20} size={140} axes={AXES.digits} color={v === "Captured" ? COLORS.red : COLORS.ink} />
            <Line text={VERDICT_WORD[v] ?? v} x={cx} baseline={y + 166} maxWidth={colW - 20} size={32} axes={AXES.tool} />
          </React.Fragment>
        );
      })}
      <Sfx name="ui-click" at={0} />
    </>
  );
};

const Teaser: React.FC<{ y: number }> = ({ y }) => (
  <>
    <PinnedTag x={300} y={y} w={300} h={146} rotate={-4} tone="red" text="?" textSpan={[0.4, 0.7]} />
    {/* A paper slip covers half the label: next week's specimen stays a secret. */}
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <rect x={420} y={y - 20} width={190} height={200} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={3} transform={`rotate(6 515 ${y + 80})`} />
    </svg>
    <Line text={LABEL.nextUp} x={430} baseline={y + 96} maxWidth={170} size={34} axes={AXES.tool} />
  </>
);

export const DrawerSeries = framed(DrawerSeriesBody);
