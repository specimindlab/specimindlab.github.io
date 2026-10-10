# E010 · LightOnOCR-3 · research (accessed 2026-10-10)

Calendar row R059 ("pick a launch under 7 days old with a free tier; one try"): LightOn published the LightOnOCR-3 models on 6-7 Oct 2026 and the official free demo on 8 Oct 2026.

## What it is
- LightOnOCR-3 turns a page photo or PDF into Markdown ("Page to Markdown with tables, math and reading order"); with "grounding" each block comes back with a label and a box. [https://huggingface.co/spaces/lightonai/LightOnOCR-3-Demo, accessed 2026-10-10]
- LightOnOCR-3-4B is the "largest and most accurate model of the LightOnOCR-3 family"; also 1B and 0.8B. Apache License 2.0, "for research and commercial use". Self-hosted with vLLM, SGLang or Docker; no hosted price listed. [https://huggingface.co/lightonai/LightOnOCR-3-4B, accessed 2026-10-10]
- Model pages created 6-7 Oct 2026; demo created 8 Oct 2026. [https://huggingface.co/api/models?search=LightOnOCR-3 and https://huggingface.co/api/spaces/lightonai/LightOnOCR-3-Demo, accessed 2026-10-10]
- LightOn's own benchmark claims (olmOCR-bench overall 86.3, ParseBench mean 75.1) are listed on the model card, not tested by us. [https://huggingface.co/lightonai/LightOnOCR-3-4B, accessed 2026-10-10]

## Free / paid
- Free: the official demo page, no account, no published limit; weights free to download. Paid: no price published.

## Our test
- One photo of a handwritten note (Annie Spratt, Unsplash; `raw/input/SOURCES.md`, with our own transcription written before the test). Demo defaults (4B, Grounding, 2048 px), one try. 42 of 46 words right; three misreads change the meaning: "Mum" → "My own", "Butch" → "Butel", "Ginger Tom." → "thing. Love". [raw/auto/run.json]
