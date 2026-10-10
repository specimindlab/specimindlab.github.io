# E007 · Liquid AI d1 (Quick Draw) · research (accessed 2026-10-10)

Calendar row R066 ("pick a launch under 7 days old with a free tier; one try"): Liquid AI released the open d1 models on 7 Oct 2026 and their free demo page, System One Arcade, the same week.

## What it is
- d1-3B is "a 3B parameter decision model built on LFM2.5-VL-3B": it answers typed questions about an image "in one forward pass"; it "is not a chat model and does not write text". [https://huggingface.co/LiquidAI/d1-3B, accessed 2026-10-10]
- Speed claim: "8 ms a decision on an NVIDIA RTX 4090" (16 ms without compile). [https://huggingface.co/LiquidAI/d1-3B, accessed 2026-10-10]
- Released with d1-omni-600M as open-weight models on 7 Oct 2026; a hosted d1 API came a few days earlier. [https://runtimewire.com/article/liquid-ai-open-d1-decision-models-edge, accessed 2026-10-10] The model page was created 5 Oct 2026. [https://huggingface.co/api/models/LiquidAI/d1-3B, accessed 2026-10-10]
- System One Arcade: "Eleven demos of a 3B vision-language model", including Quick Draw: "Draw the word. The model guesses among 16 words while you draw." Runs in the browser, no account. [https://huggingface.co/spaces/LiquidAI/system-one-arcade, accessed 2026-10-10]

## Quick Draw rules (from the demo's own code, draw.js)
- A round is 6 random words out of 16 (cat, house, tree, car, fish, sun, bicycle, clock, star, umbrella, airplane, flower, guitar, apple, snowman, eyeglasses), 20 seconds each.
- A guess only counts when a stroke ends and the model is at least 85% sure ("SURE = 0.85"); the authors report it accepts the right word in 205 of 240 drawings at that bar. [https://liquidai-system-one-arcade.hf.space/draw.js, accessed 2026-10-10]

## Free / paid
- Free: the demo page, no account, no published limit. The model weights are free to download (licence "lfm1.0"). [https://huggingface.co/LiquidAI/d1-3B, accessed 2026-10-10] Third-party coverage describes the LFM Open License as free for commercial use below $10M annual revenue. [https://aiweekly.co/alerts/liquid-ai-opens-d1-3b-and-d1-omni-600m-decision-models, accessed 2026-10-10]
- Paid: no consumer plan; the hosted API's price is not published on the pages we could fetch (OpenRouter listing returned 404). Shown as "not published".

## Limitations
- Picks from fixed options (16 words here); it cannot name something outside the list. [draw.js above]
- No independent replication of the "Decision Index" claims. [https://aiweekly.co/alerts/liquid-ai-opens-d1-3b-and-d1-omni-600m-decision-models, accessed 2026-10-10]
