import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import { BANDS, COLORS } from "../brand";
import {
  Card,
  CatalogEntry,
  CreditCounter,
  Drawer,
  EpisodeAssets,
  ExtinctLabel,
  FitStack,
  FontGate,
  InkMark,
  layoutStack,
  Media,
  MediaSpec,
  Paper,
  Plate,
  ScaleBar,
  Sketch,
  SpecimenLabel,
  SplitAB,
  Stamp,
  Tray,
  Triptych,
} from "../system";
import { Guides } from "./Guides";

// One scene per component, SCENE frames each. Render a still at scene * SCENE + SETTLE to see
// every component after its entrance. Fixture text mirrors brand/reference/storyboard-episode-001.

export const SCENE = 60;
export const SETTLE = 50;

export const systemTestSchema = z.object({ guides: z.boolean() });

const photo: MediaSpec = { kind: "image", src: "@/test/mug-photo.svg", fit: "contain" };
const mesh: MediaSpec = { kind: "image", src: "@/test/mug-mesh.svg", fit: "contain" };
const glb: MediaSpec = { kind: "glb", src: "@/test/mug.glb" };

// Fixture catalog for the drawer scene only (the real one is data/catalog.json).
const FIXTURE_CATALOG: CatalogEntry[] = [
  { code: "041", tool: "Fixture A", verdict: "Captured" },
  { code: "042", tool: "Fixture B", verdict: "Captured" },
  { code: "043", tool: "Fixture C", verdict: "Released" },
  { code: "044", tool: "Fixture D", verdict: "Watch" },
  { code: "045", tool: "Fixture E", verdict: "Captured" },
  { code: "046", tool: "Fixture F", verdict: "Captured" },
];

const Header: React.FC<{ mode?: "Live specimen" | "Field sketch"; disclosure?: "Affiliate" | "Unpaid"; emphasis?: boolean; code?: string }> = ({
  mode = "Live specimen",
  disclosure = "Affiliate",
  emphasis,
  code = "001",
}) => <SpecimenLabel code={code} tool="Tripo" genus="3D generator" disclosure={disclosure} mode={mode} modeEmphasis={emphasis} />;

/** Caption at the bottom; returns its top so the scene can size the content above it. */
const captionTop = (lines: string[]) => BANDS.captionBottom - layoutStack(lines, { maxHeight: 600 }).height;

const Scenes: React.FC = () => {
  const s = (i: number, node: React.ReactNode, name: string) => (
    <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} name={name}>
      <AbsoluteFill>{node}</AbsoluteFill>
    </Sequence>
  );
  const hook = ["This mug was", "a phone photo", "40 seconds ago."];
  const rules = ["One photo.", "One try."];
  const watch = ["Watch the handle."];
  const flaw = ["Honest flaw:", "the handle fused."];
  const cta = ["Comment 001", "for the link."];
  const stress = ["Gigantic jpeg typography", "quickly, happily", "jumpy ghost"];
  return (
    <>
      {s(
        0,
        <>
          <Header />
          <Plate y={430} h={captionTop(hook) - BANDS.gap - 430}>
            <Media spec={mesh} width={884} height={captionTop(hook) - BANDS.gap - 430} />
          </Plate>
          <FitStack lines={hook} maxHeight={600} />
        </>,
        "cold open: Label + Plate(image) + FitStack",
      )}
      {s(
        1,
        <>
          <Header />
          <Card
            title="Collection conditions"
            y={430}
            maxHeight={captionTop(rules) - BANDS.gap - 430}
            rows={[
              { key: "Input", value: "1 phone photo" },
              { key: "Plan", value: "Free tier" },
              { key: "Attempts", value: "1" },
              { key: "Retries", value: "0" },
              { key: "Edited", value: "No" },
            ]}
          />
          <FitStack lines={rules} maxHeight={600} />
        </>,
        "Card: conditions",
      )}
      {s(
        2,
        <>
          <Header />
          <Plate y={430} h={500}>
            <div style={{ position: "absolute", left: 30, top: 30, width: 330, height: 440, borderRadius: 34, border: `3px solid ${COLORS.ink}`, overflow: "hidden", background: "#E9ECE2" }}>
              <Media spec={photo} width={330} height={440} />
            </div>
            <div style={{ position: "absolute", left: 470, top: 40 }}>
              <Media spec={mesh} width={390} height={420} />
            </div>
          </Plate>
          <InkMark shape="arrow" from={{ x: 470, y: 680 }} to={{ x: 560, y: 680 }} start={0} seed="obs" />
          <ScaleBar seconds={38} max={42} x={98} y={990} width={832} start={4} duration={30} />
          <FitStack lines={watch} maxHeight={600} />
        </>,
        "Observation: inset + arrow + ScaleBar",
      )}
      {s(
        3,
        <>
          <Header />
          <Card
            title="Field notes"
            y={430}
            maxHeight={captionTop(flaw) - BANDS.gap - 430}
            rows={[
              { key: "Habitat", value: "Browser" },
              { key: "Feeds on", value: "Photo, text, sketch" },
              { key: "Free tier", value: "200 credits a month" },
              { key: "Best for", value: "Toys, props, prints" },
              { key: "Weakness", value: "Thin parts fuse" },
            ]}
            mark={{ row: 4, start: 20 }}
          />
          <FitStack lines={flaw} maxHeight={600} />
        </>,
        "Card: notes + InkMark ellipse",
      )}
      {s(
        4,
        <>
          <Header />
          <Stamp word="Captured" x={430} y={540} width={600} start={0} />
          <Drawer highlight="001" x={110} y={760} start={8} />
          <FitStack lines={cta} maxHeight={420} y={BANDS.captionBottom - 50} />
        </>,
        "Verdict: Stamp + Drawer (real catalog)",
      )}
      {s(
        5,
        <>
          <Header />
          <Plate y={430} h={720}>
            <Media spec={glb} width={884} height={720} />
          </Plate>
          <FitStack lines={["Turntable, own materials."]} maxHeight={300} />
        </>,
        "Turntable (materials)",
      )}
      {s(
        6,
        <>
          <Header />
          <Plate y={430} h={720}>
            <Media spec={{ ...glb, clay: true }} width={884} height={720} />
          </Plate>
          <InkMark shape="underline" target={{ x: 140, y: 1180, w: 300, h: 40 }} start={0} seed="u" />
          <InkMark shape="strike" target={{ x: 560, y: 1170, w: 300, h: 60 }} start={4} seed="s" />
          <FitStack lines={["Clay override on."]} maxHeight={200} />
        </>,
        "Turntable (clay) + underline/strike",
      )}
      {s(
        7,
        <>
          <Header />
          <Stamp word="Captured" x={500} y={520} width={560} start={0} />
          <Stamp word="Released" x={500} y={720} width={560} start={4} />
          <Stamp word="Rare sighting" x={500} y={920} width={600} start={8} />
          <Stamp word="Watch" x={340} y={1120} width={420} start={12} />
          <Stamp word="Unpaid" x={500} y={1320} width={420} start={16} rotate={-5} />
        </>,
        "Stamps: all five",
      )}
      {s(
        8,
        <>
          <Header code="047" />
          <Drawer highlight="047" rows={3} x={110} y={480} start={0} catalog={FIXTURE_CATALOG} />
          <FitStack lines={["Drawer 04, fixture data."]} maxHeight={300} />
        </>,
        "Drawer with fixture catalog",
      )}
      {s(
        9,
        <>
          <SpecimenLabel code="P01" tool="Tripo · Meshy · Rodin" genus="3D generators" disclosure="Affiliate" mode="Live specimen" />
          <Triptych
            input={photo}
            inputLabel="1 phone photo"
            y={430}
            h={captionTop(["Same photo.", "Three tools."]) - BANDS.gap - 430}
            fillAt={[0, 4, 8]}
            flawAt={12}
            rankAt={20}
            specimens={[
              { code: "001", tool: "Tripo", media: mesh, seconds: 38, rank: 1, flaw: { text: "Handle fused", region: { x: 0.68, y: 0.35, w: 0.25, h: 0.3 } } },
              { code: "011", tool: "Meshy", media: mesh, seconds: 61, rank: 2, flaw: { text: "Rim melted", region: { x: 0.25, y: 0.18, w: 0.5, h: 0.2 } } },
              { code: "019", tool: "Rodin Gen-2", media: mesh, seconds: 95, rank: 3, flaw: { text: "No handle", region: { x: 0.6, y: 0.35, w: 0.3, h: 0.3 } } },
            ]}
          />
          <FitStack lines={["Same photo.", "Three tools."]} maxHeight={600} />
        </>,
        "Triptych",
      )}
      {s(
        10,
        <>
          <SpecimenLabel code="M01" tool="Photoroom" genus="Product photo AI" disclosure="Unpaid" mode="Live specimen" />
          <SplitAB a={photo} b={mesh} y={430} h={640} reveal={{ at: 0, ai: "B", code: "M01", flaw: { x: 0.6, y: 0.4, w: 0.35, h: 0.3 } }} />
          <FitStack lines={["B was the AI.", "Look at the handle."]} maxHeight={420} />
        </>,
        "SplitAB revealed",
      )}
      {s(
        11,
        <>
          <SpecimenLabel code="D01" tool="Photo to printed mug" genus="3-tool workflow" disclosure="Unpaid" mode="Live specimen" />
          <Tray
            y={430}
            h={captionTop(["Three tools.", "One printable mug."]) - BANDS.gap - 430}
            fillAt={[0, 6, 12]}
            flaw={{ stage: 1, at: 24, region: { x: 0.55, y: 0.3, w: 0.35, h: 0.4 } }}
            totals={{ at: 18, seconds: 152, cost: "0" }}
            stages={[
              { tool: "Photoroom", media: photo, seconds: 9, cost: "0" },
              { tool: "Tripo", media: mesh, seconds: 38, cost: "0" },
              { tool: "Bambu Studio", media: mesh, seconds: 105, cost: "0" },
            ]}
          />
          <FitStack lines={["Three tools.", "One printable mug."]} maxHeight={420} />
        </>,
        "Tray",
      )}
      {s(
        12,
        <>
          <SpecimenLabel code="002" tool="Hunyuan3D" genus="3D generator" disclosure="Unpaid" mode="Live specimen" />
          <CreditCounter total={20} used={3} prevUsed={2} changeAt={10} unit="Generations" period="per day" y={430} />
          <CreditCounter total={200} used={130} prevUsed={100} changeAt={10} unit="Credits" period="per month" y={800} compact />
          <FitStack lines={["20 free a day.", "We used 3."]} maxHeight={380} />
        </>,
        "CreditCounter",
      )}
      {s(
        13,
        <>
          <SpecimenLabel code="X01" tool="Fixture Studio" genus="Video generator" disclosure="Unpaid" mode="Field sketch" />
          <ExtinctLabel
            name="Fixture Studio"
            note="Shut down 30 Sep 2026"
            y={420}
            h={captionTop(["Gone on 30 Sep.", "Three replacements."]) - BANDS.gap - 420}
            strikeAt={0}
            successorsAt={[6, 12, 18]}
            pick={{ index: 0, at: 30 }}
            successors={[
              { tool: "Successor One", free_tier: "66 credits a day", line: "Closest match for short clips" },
              { tool: "Successor Two", free_tier: "Free, 720p", line: "Open weights, runs locally" },
              { tool: "Successor Three", free_tier: "Not published", line: "Waitlist only" },
            ]}
          />
          <FitStack lines={["Gone on 30 Sep.", "Three replacements."]} maxHeight={420} />
        </>,
        "ExtinctLabel",
      )}
      {s(
        14,
        <>
          <Header mode="Field sketch" disclosure="Unpaid" emphasis />
          <Plate y={430} h={680}>
            {null}
          </Plate>
          <Sketch inputs={["Photo", "Text prompt"]} tool="Image to 3D model" outputs={["GLB mesh", "Textures"]} x={98} y={430} w={884} h={680} start={0} step={3} />
          <FitStack lines={["Redrawn from", "the public docs."]} maxHeight={420} />
        </>,
        "Sketch",
      )}
      {s(
        15,
        <>
          <Header />
          <FitStack lines={stress} y={430} anchor="top" />
          <FitStack lines={["Typography gyp,", "Jjqy pgy jpg"]} maxHeight={600} />
        </>,
        "FitStack stress: descenders",
      )}
    </>
  );
};

export const SCENE_COUNT = 16;

export const SystemTest: React.FC<z.infer<typeof systemTestSchema>> = ({ guides }) => (
  <FontGate>
    <EpisodeAssets id="E000">
      <Paper />
      <Scenes />
      {guides ? <Guides /> : null}
    </EpisodeAssets>
  </FontGate>
);
