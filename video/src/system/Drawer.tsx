import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, DERIVED, FONT_FAMILY, variation } from "../brand";
import { CATALOG, CatalogEntry, codeNumber, pad3 } from "./catalog";
import { paperSlide, pinDrop, pinPush, PIN } from "./motion";
import { rand } from "./noise";
import { PinnedTag } from "./PinnedTag";
import { Sfx } from "./Sfx";

// The specimen drawer (brand/vectors/vector-drawer.svg, storyboard-5): a grid of cells, each
// specimen a small tag on a pin. Cells have fixed positions, like a real cabinet: specimen n
// always sits in drawer ceil(n / cells) at the same cell, so the drawer reads as one growing
// collection. Earlier specimens come from data/catalog.json; a released specimen leaves only
// its pin and the dashed outline of where its label was. The new one drops in red.

export const CELL = 150;
export const CELL_GAP = 14;

export type DrawerProps = {
  /** The new specimen's code ("047"). */
  highlight: string;
  /** Cells in the drawer (cols x rows). */
  cols?: number;
  rows?: number;
  x: number;
  y: number;
  cell?: number;
  start?: number;
  /** Frame the red tag drops (default: after the drawer has slid in). */
  dropAt?: number;
  catalog?: CatalogEntry[];
  /** Explicit cells in order (Drawer series: the week's specimens). Overrides cabinet paging. */
  codes?: string[];
  /** Hide the drawer heading. */
  heading?: string;
  /** Codes to light up (Drawer series roll call): code -> frame it lights. */
  lit?: Record<string, number>;
  sfx?: boolean;
};

export const drawerSize = (cols = 5, rows = 2, cell = CELL) => ({
  width: cols * cell + (cols - 1) * CELL_GAP,
  height: rows * cell + (rows - 1) * CELL_GAP,
});

export const drawerCellOrigin = (index: number, x: number, y: number, cols = 5, cell = CELL) => ({
  x: x + (index % cols) * (cell + CELL_GAP),
  y: y + Math.floor(index / cols) * (cell + CELL_GAP),
});

export const Drawer: React.FC<DrawerProps> = ({
  highlight,
  cols = 5,
  rows = 2,
  x,
  y,
  cell = CELL,
  start = 0,
  dropAt,
  catalog = CATALOG,
  lit,
  codes,
  heading,
  sfx = true,
}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const n = codeNumber(highlight) ?? Infinity;
  const cells = cols * rows;
  const page = Number.isFinite(n) ? Math.floor((n - 1) / cells) : 0;
  const cellCode = (i: number) => (codes ? codes[i] : pad3(page * cells + i + 1));
  const slide = paperSlide(frame, start, 120);
  const drop = dropAt ?? start + 14;
  const k = cell / 150;
  const tagW = 93 * k;
  const tagH = 46.5 * k;
  const byCode = new Map(catalog.map((e) => [e.code, e]));
  return (
    <div style={{ position: "absolute", left: 0, top: slide, width: 1, height: 1 }}>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {Array.from({ length: cells }, (_, i) => {
          const o = drawerCellOrigin(i, x, y, cols, cell);
          return (
            <rect key={i} x={o.x} y={o.y} width={cell} height={cell} fill={DERIVED.cell} stroke={DERIVED.cellStroke} strokeWidth={1.5} />
          );
        })}
        <text
          x={x}
          y={y - 18}
          fill={COLORS.steel}
          fontFamily={FONT_FAMILY}
          fontSize={24}
          style={{ fontVariationSettings: variation({ wdth: 85, wght: 700 }) }}
        >
          {heading ?? `Drawer ${String(page + 1).padStart(2, "0")} · ${pad3(page * cells + 1)}–${pad3((page + 1) * cells)}`}
        </text>
      </svg>
      {Array.from({ length: cells }, (_, i) => {
        const code = cellCode(i);
        if (!code) return null;
        const num = codes ? (code === highlight ? n : -1) : page * cells + i + 1;
        const o = drawerCellOrigin(i, x, y, cols, cell);
        const tx = o.x + 28.5 * k;
        const ty = o.y + 59.25 * k;
        if (num === n) {
          if (frame < drop - 1) return null;
          return (
            <PinnedTag
              key={code}
              x={tx}
              y={ty}
              w={tagW}
              h={tagH}
              rotate={-6}
              tone="red"
              text={code}
              headR={0.07 * tagW}
              dy={pinDrop(frame, drop, 60)}
              push={pinPush(frame, drop, 12)}
            />
          );
        }
        if (!codes && num > n) return null;
        const entry = byCode.get(code);
        if (!entry) return null; // not in the catalog: the cell stays empty, never invented
        const litAt = lit?.[code];
        const isLit = litAt !== undefined && frame >= litAt;
        const tone = entry.verdict === "Released" ? "outline" : isLit ? "red" : entry.verdict === "Watch" ? "steel" : "ink";
        return (
          <PinnedTag
            key={code}
            x={tx}
            y={ty}
            w={tagW}
            h={tagH}
            rotate={rand(`drawer-${code}`, -2.5, 2.5)}
            tone={tone}
            text={code}
            headR={0.07 * tagW}
          />
        );
      })}
      {sfx ? <Sfx name="drawer" at={start} /> : null}
      {sfx ? <Sfx name="pin-tick" at={drop + PIN.drop} /> : null}
    </div>
  );
};
