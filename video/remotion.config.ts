/**
 * Applies to the CLI only (npx remotion render / still / studio).
 * Delivery flags (crf, colour space, audio) are passed explicitly by scripts/render_batch.sh
 * so the spec lives in one place.
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
