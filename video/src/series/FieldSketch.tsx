import React from "react";
import { z } from "zod";
import { COLORS } from "../brand";
import { Card, cardLayout, cardValueBox, InkMark, Plate, PLATE_W, PLATE_X, Sketch, Stamp, AXES, Line } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, row, framed, seriesProps, seriesScript, timeline } from "./common";

// 5. Field Sketch (SK): a desk study, not hands-on. The diagram draws itself from public
// information -> field notes from research.md -> price math -> the documented limitation circled
// (with its source) -> the Watch stamp over the sketch. Never shows generated output.

const sketch = beat("sketch", {
  lines: caption,
  inputs: z.array(z.string().min(1)).min(1).max(3),
  process: z.string().min(1),
  outputs: z.array(z.string().min(1)).min(1).max(3),
});
const notes = beat("notes", { lines: caption, rows: z.array(row).min(3).max(6) });
const priceMath = beat("price-math", { lines: caption, rows: z.array(row).min(1).max(4), result: row });
const flaw = beat("flaw", {
  lines: caption,
  text: z.string().min(1),
  source: z.string().min(3), // domain shown under the limitation, e.g. "docs.example.com"
  flaw_source: z.literal("research"),
});
const verdict = beat("verdict", {});

export const fieldSketchScript = seriesScript(
  "FieldSketch",
  {},
  z.discriminatedUnion("type", [sketch, notes, priceMath, flaw, verdict]),
  /^sketch notes price-math flaw verdict$/,
  "sketch, notes, price-math, flaw, verdict",
).refine((s) => s.mode === "Field sketch", { message: "Field Sketch is always mode 'Field sketch'", path: ["mode"] });
export const fieldSketchProps = seriesProps(fieldSketchScript);
export type FieldSketchProps = z.infer<typeof fieldSketchProps>;

type Bt<T extends string> = Extract<z.infer<typeof fieldSketchScript>["beats"][number], { type: T }>;

const SketchPlate: React.FC<{ b: Bt<"sketch">; y: number; h: number; start: number; step: number }> = ({ b, y, h, start, step }) => (
  <>
    <Plate y={y} h={h}>
      {null}
    </Plate>
    <Sketch inputs={b.inputs} tool={b.process} outputs={b.outputs} x={PLATE_X} y={y} w={PLATE_W} h={h} start={start} step={step} />
    <Line text="Redrawn from public information" x={PLATE_X + 24} baseline={y + h - 20} maxWidth={PLATE_W - 48} size={22} axes={AXES.key} color={COLORS.steel} />
  </>
);

const FieldSketchBody: React.FC<FieldSketchProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  const sk = script.beats.find((b): b is Bt<"sketch"> => b.type === "sketch") as Bt<"sketch">;
  const ctaLines = ctaFor(script.cta, platform);
  return (
    <>
      {t.map((b) => {
        const lines = "lines" in b ? b.lines : ctaLines;
        const box = captionBox(lines, 420);
        const h = box.contentBottom - CONTENT_TOP;
        return (
          <Beat key={b.index} t={b}>
            {b.type === "sketch" ? <SketchPlate b={b} y={CONTENT_TOP} h={h} start={4} step={Math.max(4, Math.floor((b.dur - 40) / 12))} /> : null}
            {b.type === "notes" ? <Card title="Field notes · from public docs" rows={b.rows} y={CONTENT_TOP} maxHeight={h} /> : null}
            {b.type === "price-math" ? <Card title="Cheapest way in" rows={[...b.rows, { ...b.result, emphasis: true }]} y={CONTENT_TOP} maxHeight={h} /> : null}
            {b.type === "flaw" ? (
              (() => {
                const rows = [
                  { key: "Limitation", value: b.text },
                  { key: "Source", value: b.source },
                ];
                const l = cardLayout({ title: "Documented limitation", rows, y: CONTENT_TOP });
                return (
                  <>
                    <Card title="Documented limitation" rows={rows} y={CONTENT_TOP} />
                    <InkMark shape="ellipse" target={cardValueBox(l, 0)} start={18} seed="sk-flaw" pad={14} />
                  </>
                );
              })()
            ) : null}
            {b.type === "verdict" ? (
              <>
                <div style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
                  <SketchPlate b={sk} y={CONTENT_TOP} h={h} start={-1000} step={1} />
                </div>
                <Stamp word="Watch" x={540} y={CONTENT_TOP + h / 2} width={480} start={6} backing />
              </>
            ) : null}
            <Caption lines={lines} maxHeight={420} />
          </Beat>
        );
      })}
    </>
  );
};

export const FieldSketch = framed(FieldSketchBody, { modeEmphasis: true });
