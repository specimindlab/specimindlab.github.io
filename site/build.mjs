#!/usr/bin/env node
// Builds the static catalog site into site/_site (deployed by .github/workflows/pages.yml).
// Holding version from S1: copies site/src and the brand font. Prompt S4 replaces this with
// the full drawer / specimen pages built from data/catalog.json.
import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "_site");

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "fonts"), { recursive: true });
cpSync(join(here, "src"), out, { recursive: true });
cpSync(join(root, "brand/reference/Anybody-VF.ttf"), join(out, "fonts/Anybody-VF.ttf"));
cpSync(join(root, "video/public/fonts/OFL.txt"), join(out, "fonts/OFL.txt"));
for (const f of ["logo/logo-mark.svg", "social/avatar-400.png"]) {
  const src = join(root, "brand", f);
  if (existsSync(src)) cpSync(src, join(out, f.split("/").pop()));
}
console.log(`built ${out}`);
