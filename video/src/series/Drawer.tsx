import React from "react";
import { interpolate, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS } from "../brand";
import { CATALOG, CatalogEntry, Drawer, drawerSize, PinnedTag, Sfx, Stamp, AXES, Line } from "../system";
import { Beat, beat, caption, Caption, CONTENT_TOP, ctaFor, framed, seriesProps, seriesScript, timeline } from "./common";

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
  { week: z.number().int().positive(), codes: z.array(z.string().regex(/^\d{3}$/)).min(2).max(10) },
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
        <Drawer highlight="" codes={script.codes} cols={5} rows={rows} x={dx} y={dy} start={0} catalog={catalog} lit={litAt} heading={`Week ${script.week}`} />
      </ShutClip>
      {t.map((b) => (
        <Beat key={b.index} t={b}>
          {b.type === "roll-call" ? <RollCall entries={entries} per={per} top={dy + ds.height + 70} /> : null}
          {b.type === "tally" ? <Tally entries={entries} y={dy + ds.height + 70} /> : null}
          {b.type === "cta" ? <Teaser y={dy + ds.height + 120} /> : null}
          {"lines" in b ? <Caption lines={b.lines} maxHeight={CAP} /> : null}
          {b.type === "cta" ? <Caption lines={ctaLines} maxHeight={CAP} /> : null}
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

const RollCall: React.FC<{ entries: CatalogEntry[]; per: number; top: number }> = ({ entries, per, top }) => {
  const frame = useCurrentFrame();
  const i = Math.min(entries.length - 1, Math.floor(frame / per));
  const e = entries[i];
  const local = Math.round(i * per);
  return (
    <>
      <Line text={`${e.code} · ${e.tool}`} x={70} baseline={top + 50} maxWidth={860} size={56} axes={AXES.tool} />
      <Stamp key={e.code} word={e.verdict} x={300} y={top + 170} width={420} start={local + 4} />
      {frame >= local + 12 && e.flaw ? (
        <>
          <Line text="Flaw" x={560} baseline={top + 150} maxWidth={360} size={26} axes={AXES.key} color={COLORS.steel} />
          <Line text={e.flaw} x={560} baseline={top + 196} maxWidth={370} size={40} axes={AXES.note} color={COLORS.red} />
        </>
      ) : null}
    </>
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
            <Line text={v} x={cx} baseline={y + 166} maxWidth={colW - 20} size={32} axes={AXES.tool} />
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
    <Line text="Next week" x={430} baseline={y + 96} maxWidth={170} size={34} axes={AXES.tool} />
  </>
);

export const DrawerSeries = framed(DrawerSeriesBody);
