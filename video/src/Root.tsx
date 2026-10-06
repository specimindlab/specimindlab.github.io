import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { PipelineCheck } from "./PipelineCheck";
import { EpisodeProps, episodeProps, totalFrames } from "./schema";

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
      {/* Series compositions (FieldSpecimen, FreeRange, RareSighting, Plate, FieldSketch,
          Mimicry, Dissection, Drawer, ExtinctionWatch) are registered here by prompt S2. */}
    </>
  );
};
