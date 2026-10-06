import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { PipelineCheck } from "./PipelineCheck";
import { EpisodeProps, episodeProps, totalFrames } from "./schema";
import { SeriesCompositions } from "./series";
import { SOUND_TEST_SECONDS, SoundTest, soundTestSchema } from "./test/SoundTest";
import { SCENE, SCENE_COUNT, SystemTest, systemTestSchema } from "./test/SystemTest";

// Every episode composition takes { script, platform } and derives its length from the beats.
const fromScript: CalculateMetadataFunction<EpisodeProps> = ({ props }) => ({
  durationInFrames: totalFrames(props.script),
});

const pipelineDefaults: EpisodeProps = {
  platform: "yt",
  script: {
    id: "E000",
    code: "000",
    composition: "PipelineCheck",
    series: "Pipeline check",
    mode: "Live specimen",
    disclosure: "Unpaid",
    tool: "Pipeline",
    genus: "Render check",
    beats: [
      { type: "output", seconds: 10, lines: ["Pipeline check."] },
      { type: "observation", seconds: 10, lines: ["Every beat renders."] },
      { type: "cta", seconds: 10 },
    ],
    cta: { yt: "specimindlab.github.io/000", ig: "Comment 000", x: "specimindlab.github.io/000" },
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PipelineCheck"
        component={PipelineCheck}
        schema={episodeProps}
        defaultProps={pipelineDefaults}
        calculateMetadata={fromScript}
        durationInFrames={totalFrames(pipelineDefaults.script)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SystemTest"
        component={SystemTest}
        schema={systemTestSchema}
        defaultProps={{ guides: false }}
        durationInFrames={SCENE * SCENE_COUNT}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SoundTest"
        component={SoundTest}
        schema={soundTestSchema}
        defaultProps={{ bed: "sfx/bed-1.wav" }}
        durationInFrames={SOUND_TEST_SECONDS * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/* FieldSpecimen, FreeRange, RareSighting, Plate, FieldSketch, Mimicry, Dissection, Drawer,
          ExtinctionWatch: one per series, see src/series/index.tsx and data/series.md. */}
      <SeriesCompositions />
    </>
  );
};
