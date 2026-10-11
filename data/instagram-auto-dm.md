# Instagram: "Comment 004, get the link in your DMs"

Checked 2026-10-10/11. Every Reel ends with "Comment {code} for…"; this is how that comment turns into an automatic DM with the review link.

## Which tool

| Option | Free plan | Good for us? |
|---|---|---|
| Instagram / Meta Business Suite "Comment to message" (desktop) | free | **No.** Meta documents it in one line, its own pages disagree (keywords vs hashtags), keyword matching is exact and case-sensitive, and it waits 15 minutes. [facebook.com/business/help/395965998733706, /318238182723007, /428687951269163] |
| **Zorcha** | unlimited automations, DMs and contacts; per-Reel trigger; ignores capitals; public replies; up to 3 links per DM | **Start here.** Paid Pro $14.99/mo if ever needed. [zorcha.com/pricing, help.zorcha.com/en/articles/13924056] |
| CreatorFlow | 500 DMs a month, unlimited automations, exact-match mode | Backup. Pro $15/mo. [creatorflow.so/pricing] |
| SuperProfile (India) | one keyword per Reel, button DMs, "Sent via SuperProfile" line | Backup. [superprofile.bio/auto-dm] |
| LinkDM | 1,000 DMs a month, but the public comment reply is Pro only, branding stays | Backup. Pro $19/mo. [linkdm.com/pricing] |
| ManyChat | **only 25 contacts a month and 4 live automations since 2 Mar 2026**, "Powered by Manychat" | Move here when it pays for itself: Essential $17/mo ($14 yearly), 250 contacts, unlimited automations; best docs. [help.manychat.com Free-plan and Essential-plan articles] |

## Set it up once (15 minutes)

1. **Professional account** (Instagram app): Profile → ☰ → Settings and activity → *For professionals*: Account type and tools → **Switch to professional account** → pick a category → **Business** (keeps every option open) → connecting a Facebook Page is optional, tap Skip. [help.instagram.com/502981923235522]
2. **Connect Zorcha:** zorcha.com → sign in with Meta/Instagram → allow the permissions it asks for.
3. **Let tools send DMs:** Profile → ☰ → Messages and story replies → **Message requests** → *Connected tools* → **Allow access to messages: on**. If it isn't there: the account must be Professional, and the option often appears only after a tool is connected (step 2). Still missing → update the app, log out and in, check again; if the test DM arrives anyway, you don't need it. [help.instagram.com/791161338412168; creatorflow.so/blog/instagram-dm-automation-permissions-checklist, accessed 2026-10-11]
4. **Hidden words:** Settings → Hidden words: never add numbers; "Hide unwanted comments" can swallow short comments like "004", so check "View hidden comments" on the first Reel.

## For every Reel (2 minutes, before you post)

1. Zorcha → Automations → New automation → **DM from comments**.
2. Post: **Next post or reel** (before posting) or **A specific post or reel** (after posting).
3. Keyword: the video's code exactly as in its end card: `004`. For letter codes add the zero-as-O typo too: `X01` and `XO1`, `W02` and `WO2`. Don't add `4` alone: it would fire on "2024" or "4/10".
4. Public reply (rotate 3 versions, so it doesn't look like a bot):
   - "Sent. Check your DMs (or Message requests if you don't follow us)."
   - "Done, the link is in your DMs."
   - "On its way to your inbox."
5. DM text: paste the **"Auto-DM text"** from that episode's `meta/instagram.md` (it's in every Release zip). It already has the score, the link with `?from=ig` (so the hub counts Instagram visits) and the disclosure, e.g. for #004:
   > Goblin Tools: 94/100, free, no account. The test, the 33-step list and the score: https://specimindlab.github.io/004?from=ig (not sponsored, no affiliate link)
   If Zorcha offers a button, use the same link as a button labelled "Open the review" and keep the text.
6. **Ask to follow: off.** Opening DM: off. A follow gate adds a tap, loses people, sits close to Meta's "exchanging links for follows" spam rule, and isn't our tone.
7. Go live. Leave old Reels' automations on: Reels collect comments for months.
8. **Test** from a second account that doesn't follow us: comment the code, look in Message requests, tap the link. Instagram sends one DM per person per post, so each test account works once per Reel.

## Meta's rules that apply
- One private reply per comment, within 7 days of the comment; follow-ups only if the person replies, within 24 hours. [developers.facebook.com/docs/instagram-platform/private-replies]
- Up to 750 private replies an hour per account. [developers.facebook.com/docs/messenger-platform/overview/rate-limiting]
- Non-followers still get the DM, in Message requests.
- Disclosure: ASCI accepts "Affiliate" as the label, upfront and not buried in links; the FTC says a plain line next to the link ("we may earn a commission") is clearer than "affiliate link" alone. [ascionline.in ASCI Influencer Guidelines 2025 PDF; ftc.gov Endorsement Guides FAQ]

## If it doesn't work
| Symptom | Fix |
|---|---|
| Tester got nothing | Check Message requests (and Hidden requests/Spam); the tester may already have commented once on that Reel. |
| Tool can't connect | Professional account? "Allow access to messages" on? Reconnect in the tool. |
| Comment never triggers | It was hidden by Instagram's filters: check "View hidden comments", Hidden words. |
| Two DMs or none | Don't run Meta's own "Comment to message" and Zorcha on the same Reel. |
| Stopped mid-month | Free cap reached (ManyChat 25 contacts, CreatorFlow 500 DMs). |
