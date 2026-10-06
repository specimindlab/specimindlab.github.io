import React from "react";
import { z } from "zod";
import { BANDS } from "../brand";
import { media, Media, Plate, PLATE_W, region, Stamp, Tray } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, framed, seriesProps, seriesScript, timeline } from "./common";

// 7. Dissection (DS): a workflow of 2-3 tools. The finished thing -> the empty tray with numbered
// wells and tool tags -> each stage fills its well with its own seconds, joined by ink arrows ->
// the weakest stage circled -> the verdict on the whole chain, with total time and cost.

const stage = z.object({ tool: z.string().min(1), media, seconds: z.number().positive(), cost: z.string().min(1) });

const output = beat("output", { lines: caption, media });
const tray = beat("tray", { lines: caption });
const observation = beat("observation", { lines: caption });
const flaw = beat("flaw", { lines: caption, stage: z.number().int().min(0), region });
const verdict = beat("verdict", { verdict: z.enum(["Captured", "Released"]), total_cost: z.string().min(1) });

export const dissectionScript = seriesScript(
  "Dissection",
  { stages: z.array(stage).min(2).max(3) },
  z.discriminatedUnion("type", [output, tray, observation, flaw, verdict]),
  /^output tray( observation){2,3} flaw verdict$/,
  "output, tray, observation x stages, flaw, verdict",
).refine((s) => s.beats.filter((b) => b.type === "observation").length === s.stages.length, {
  message: "one observation beat per stage",
  path: ["beats"],
});
export const dissectionProps = seriesProps(dissectionScript);
export type DissectionProps = z.infer<typeof dissectionProps>;

const CAP = 340;

const DissectionBody: React.FC<DissectionProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  const ctaLines = ctaFor(script.cta, platform);
  const obs = t.filter((b) => b.type === "observation");
  const trayBeat = t.find((b) => b.type === "tray");
  const flawBeat = t.find((b) => b.type === "flaw");
  const verdictBeat = t.find((b) => b.type === "verdict");
  const totalSeconds = script.stages.reduce((a, s) => a + s.seconds, 0);
  const tallest = Math.max(...t.filter((b) => b.type !== "output").map((b) => captionBox("lines" in b ? b.lines : ctaLines, CAP).layout.height));
  const bottom = BANDS.captionBottom - tallest - BANDS.gap;
  const flawSpec = flawBeat && flawBeat.type === "flaw" ? { stage: flawBeat.stage, at: flawBeat.from + 8, region: flawBeat.region } : undefined;
  return (
    <>
      {/* The tray persists from its beat to the end (global frames). */}
      {trayBeat ? (
        <Beat t={{ ...trayBeat, dur: 100000 }}>
          <Tray
            stages={script.stages}
            y={CONTENT_TOP}
            h={bottom - CONTENT_TOP}
            fillAt={script.stages.map((_, i) => (obs[i] ? obs[i].from - trayBeat.from + 6 : Infinity))}
            flaw={flawSpec ? { ...flawSpec, at: flawSpec.at - trayBeat.from } : undefined}
            totals={verdictBeat && verdictBeat.type === "verdict" ? { at: verdictBeat.from - trayBeat.from + 2, seconds: totalSeconds, cost: verdictBeat.total_cost } : undefined}
          />
        </Beat>
      ) : null}
      {t.map((b) => {
        if (b.type === "output") {
          const box = captionBox(b.lines, CAP);
          const h = box.contentBottom - CONTENT_TOP;
          return (
            <Beat key={b.index} t={b}>
              <Plate y={CONTENT_TOP} h={h}>
                <Media spec={b.media} width={PLATE_W} height={h} />
              </Plate>
              <Caption lines={b.lines} maxHeight={CAP} />
            </Beat>
          );
        }
        return (
          <Beat key={b.index} t={b}>
            {b.type === "verdict" ? <Stamp word={b.verdict} x={808} y={CONTENT_TOP + 62} width={220} start={14} /> : null}
            <Caption lines={"lines" in b ? b.lines : ctaLines} maxHeight={CAP} />
          </Beat>
        );
      })}
    </>
  );
};


export const Dissection = framed(DissectionBody);
