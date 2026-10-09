import React from "react";
import { z } from "zod";
import { Card, cardLayout, cardValueBox, ExtinctLabel, InkMark, Stamp } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, row, framed, seriesProps, seriesScript, timeline } from "./common";
import { ctaBox, CtaCaption } from "./endcard";

// 9. Extinction Watch (EX): a tool that died or changed. The ink-black label and its red strike ->
// a timeline card (launch -> change -> closure) -> three successors pin in beside it -> the catch
// they share, circled -> Watch on the best successor; ends on the label with its successors.

const successor = z.object({ tool: z.string().min(1), free_tier: z.string().min(1), line: z.string().min(1), code: z.string().optional() });

const extinct = beat("extinct", { lines: caption });
const timelineBeat = beat("timeline", { lines: caption, rows: z.array(row).min(2).max(4) });
const successors = beat("successors", { lines: caption });
const flaw = beat("flaw", { lines: caption, text: z.string().min(1) });
const verdict = beat("verdict", {});

export const extinctionScript = seriesScript(
  "ExtinctionWatch",
  {
    extinct_name: z.string().min(1),
    extinct_note: z.string().min(1), // "Shut down 30 Sep 2026"
    successors: z.array(successor).length(3),
    pick: z.number().int().min(0).max(2),
  },
  z.discriminatedUnion("type", [extinct, timelineBeat, successors, flaw, verdict]),
  /^extinct timeline successors flaw verdict$/,
  "extinct, timeline, successors, flaw, verdict",
).refine((s) => s.mode === "Field sketch", { message: "Extinction Watch is always mode 'Field sketch'", path: ["mode"] });
export const extinctionProps = seriesProps(extinctionScript);
export type ExtinctionWatchProps = z.infer<typeof extinctionProps>;

const CAP = 340;

const ExtinctionWatchBody: React.FC<ExtinctionWatchProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  const ctaLines = ctaFor(script.cta, platform);
  return (
    <>
      {t.map((b) => {
        const lines = "lines" in b ? b.lines : ctaLines;
        const box = "lines" in b ? captionBox(lines, CAP) : ctaBox(lines, CAP);
        const h = box.contentBottom - CONTENT_TOP;
        const label = (strikeAt: number, successorsAt: number[], pick?: { index: number; at: number }) => (
          <ExtinctLabel
            name={script.extinct_name}
            note={script.extinct_note}
            y={CONTENT_TOP - 10}
            h={h + 10}
            strikeAt={strikeAt}
            successors={successorsAt.length ? script.successors : []}
            successorsAt={successorsAt}
            pick={pick}
          />
        );
        return (
          <Beat key={b.index} t={b}>
            {b.type === "extinct" ? label(10, []) : null}
            {b.type === "timeline" ? <Card title="Timeline" rows={b.rows} y={CONTENT_TOP} maxHeight={h} /> : null}
            {b.type === "successors" ? label(-100, [10, 10 + Math.round(b.dur / 4), 10 + Math.round(b.dur / 2)]) : null}
            {b.type === "flaw" ? (
              (() => {
                const rows = [{ key: "All three", value: b.text }];
                const l = cardLayout({ title: "The catch", rows, y: CONTENT_TOP });
                return (
                  <>
                    <Card title="The catch" rows={rows} y={CONTENT_TOP} />
                    <InkMark shape="ellipse" target={cardValueBox(l, 0)} start={16} seed="ex-flaw" pad={14} />
                  </>
                );
              })()
            ) : null}
            {b.type === "verdict" ? (
              <>
                {label(-100, [-100, -100, -100], { index: script.pick, at: 4 })}
                <Stamp word="Watch" x={745} y={CONTENT_TOP + 110} width={250} start={10} rotate={-9} />
              </>
            ) : null}
            {"lines" in b ? <Caption lines={lines} maxHeight={CAP} /> : <CtaCaption lines={lines} code={script.code} maxHeight={CAP} />}
          </Beat>
        );
      })}
    </>
  );
};

export const ExtinctionWatch = framed(ExtinctionWatchBody);
