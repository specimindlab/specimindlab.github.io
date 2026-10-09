import { z } from "zod";
import data from "../../../data/catalog.json";

// The real collection (data/catalog.json). The Drawer and the Drawer series read it so the
// drawer on screen always matches what has actually been published. Never invent entries.

export const verdict = z.enum(["Captured", "Released", "Watch"]);
export type Verdict = z.infer<typeof verdict>;

export const catalogEntry = z
  .object({
    code: z.string(),
    tool: z.string(),
    verdict,
    flaw: z.string().optional(),
    pillar: z.string().optional(),
    tested_on: z.string().optional(),
    score: z.object({ total: z.number() }).passthrough().optional(),
  })
  .passthrough();
export type CatalogEntry = z.infer<typeof catalogEntry>;

export const catalogSchema = z.array(catalogEntry);

export const CATALOG: CatalogEntry[] = catalogSchema.parse((data as { specimens: unknown[] }).specimens);

export const codeNumber = (code: string) => (/^\d{3}$/.test(code) ? parseInt(code, 10) : null);
export const pad3 = (n: number) => String(n).padStart(3, "0");
