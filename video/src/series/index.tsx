import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { z } from "zod";
import { FPS, HEIGHT, WIDTH } from "../brand";
import { catalogSchema } from "../system";
import { totalFramesOf } from "./common";
import { Dissection, dissectionProps } from "./Dissection";
import { DrawerSeries, drawerProps } from "./Drawer";
import { ExtinctionWatch, extinctionProps } from "./ExtinctionWatch";
import { FieldSketch, fieldSketchProps } from "./FieldSketch";
import { FieldSpecimen, fieldSpecimenProps } from "./FieldSpecimen";
import { FreeRange, freeRangeProps } from "./FreeRange";
import { Mimicry, mimicryProps } from "./Mimicry";
import { PlateSeries, plateProps } from "./Plate";
import { RareSighting, rareSightingProps } from "./RareSighting";
import fxCatalog from "./fixtures/catalog.fixture.json";
import fxDissection from "./fixtures/Dissection.json";
import fxDrawer from "./fixtures/Drawer.json";
import fxExtinction from "./fixtures/ExtinctionWatch.json";
import fxFieldSketch from "./fixtures/FieldSketch.json";
import fxFieldSpecimen from "./fixtures/FieldSpecimen.json";
import fxFreeRange from "./fixtures/FreeRange.json";
import fxMimicry from "./fixtures/Mimicry.json";
import fxPlate from "./fixtures/Plate.json";
import fxRareSighting from "./fixtures/RareSighting.json";

// One composition per series (data/series.md). Each takes { script, platform } where script is the
// episode's script.json, validated by the series' own zod schema; duration = sum of beat seconds.

type AnyProps = { script: { beats: { seconds: number }[] }; platform: "yt" | "ig" | "x" };

// The CLI does not enforce `schema` on renders (only the Studio does), so every render validates
// here: a script written for another series, a bad beat order or a length outside 28-40 s fails the
// render with the reason instead of producing a templated or broken video.
const fromScript =
  (id: string, schema: z.ZodTypeAny): CalculateMetadataFunction<AnyProps> =>
  ({ props }) => {
    const parsed = schema.safeParse(props);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join(" | ");
      throw new Error(`script.json is not a valid ${id} script. ${issues}`);
    }
    const valid = parsed.data as AnyProps;
    return { durationInFrames: totalFramesOf(valid.script.beats), props: valid };
  };

type Entry = {
  id: string;
  component: React.FC<never>;
  schema: z.ZodTypeAny;
  fixture: { beats: { seconds: number }[] };
  catalog?: boolean;
};

export const SERIES: Entry[] = [
  { id: "FieldSpecimen", component: FieldSpecimen as React.FC<never>, schema: fieldSpecimenProps, fixture: fxFieldSpecimen },
  { id: "FreeRange", component: FreeRange as React.FC<never>, schema: freeRangeProps, fixture: fxFreeRange },
  { id: "RareSighting", component: RareSighting as React.FC<never>, schema: rareSightingProps, fixture: fxRareSighting },
  { id: "Plate", component: PlateSeries as React.FC<never>, schema: plateProps, fixture: fxPlate },
  { id: "FieldSketch", component: FieldSketch as React.FC<never>, schema: fieldSketchProps, fixture: fxFieldSketch },
  { id: "Mimicry", component: Mimicry as React.FC<never>, schema: mimicryProps, fixture: fxMimicry },
  { id: "Dissection", component: Dissection as React.FC<never>, schema: dissectionProps, fixture: fxDissection },
  { id: "Drawer", component: DrawerSeries as React.FC<never>, schema: drawerProps, fixture: fxDrawer },
  // Studio preview only: the same composition with the fixture catalog. Never render it for an
  // episode. (CLI input props are merged over defaultProps, so the real "Drawer" must not carry a
  // catalog default or fixture specimens could leak into a published recap.)
  { id: "DrawerFixture", component: DrawerSeries as React.FC<never>, schema: drawerProps, fixture: fxDrawer, catalog: true },
  { id: "ExtinctionWatch", component: ExtinctionWatch as React.FC<never>, schema: extinctionProps, fixture: fxExtinction },
];

const FIXTURE_CATALOG = catalogSchema.parse(fxCatalog);

export const SeriesCompositions: React.FC = () => (
  <>
    {SERIES.map((s) => (
      <Composition
        key={s.id}
        id={s.id}
        component={s.component as React.FC<AnyProps>}
        schema={s.schema as unknown as z.ZodType<AnyProps>}
        defaultProps={{ script: s.fixture, platform: "ig", ...(s.catalog ? { catalog: FIXTURE_CATALOG } : {}) } as AnyProps}
        calculateMetadata={fromScript(s.id, s.schema)}
        durationInFrames={totalFramesOf(s.fixture.beats)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
  </>
);
