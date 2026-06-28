# AdSpark AI — Strategy

**Decision (updated June 2026): self-serve-first; full suite as an opt-in, observable option.**
AdSpark leads with the **self-serve product** — a complete creative studio (platform-native
copy, AI images, **AI video**, paste-a-URL brief import, one-click image enhancer) that stands
on its own. The **done-for-you "full suite"** (managed, end-to-end ad service) is no longer the
headline pitch: it's an **option users switch on from their account** ("Turn it on →"), it runs
in the **background**, and stays **observable** via the client `/portal`. Self-serve is the front
door and the growth engine; the full suite is the high-margin upsell for those who'd rather not DIY.

> Earlier framing was "C anchored on A" (service-led, tool as funnel). Now that the self-serve
> product is genuinely deep — video included — we lead with it and make the service the selectable
> background upgrade, not the anchor. Mechanics: `serviceStatus` on the user (none → requested →
> active), set via `/api/service-request` from the account page; operator works the lead in `/admin`
> and the client observes progress in `/portal`.

Full reasoning: see the research dossier (AI Advertising Landscape). This file is the
operating decision derived from it.

## Positioning

> **AdSpark runs your ads end-to-end with AI-built creative and human strategy — flat
> monthly price, no spend fees, no surprises. You never touch the ad account.**

Every clause is a wedge against **Zeely.ai** (our reference competitor), whose weaknesses
are trust and model, not tech:

| Zeely weakness | AdSpark wedge | Status |
|---|---|---|
| #1 complaint: billing trap + surprise 12% ad-spend fee | Flat price, **no spend fee**, easy cancel | ✅ structural — free to us |
| Still DIY (user picks creative, sets budget, reads results) | **Truly done-for-you — you never touch the account** | 🔜 needs campaign deployment |
| 12% fee punishes scale | Flat retainer is cheaper for anyone spending >$7.5K/mo | ✅ structural |

## The two products

**1. Self-serve tool (funnel).** The existing Next.js app — describe a product, get copy +
AI images. Tiers: Free / Starter / Pro (`lib/plans.ts`). Purpose: capture emails, prove we
can make ads, and feed qualified leads into the service. Pricing is cost-modeled for healthy
margin (see below). The old money-losing "Agency" quota tier was removed — that customer is
the service customer.

**2. Done-for-you service (anchor).** Flat retainers, no % of ad spend (`SERVICE_TIERS` in
`lib/plans.ts`, surfaced at `/done-for-you`):

| Tier | Price/mo | Scope | Target |
|---|---|---|---|
| Spark | $997 | 1 platform, 6–8 creatives/mo, weekly report | $500–$2K/mo ad spend |
| Blaze | $1,997 | 2 platforms, 12–15 creatives, A/B + call | $2K–$8K/mo ad spend |
| Inferno | $3,500 | All platforms, unlimited creative, strategist | $8K+/mo ad spend |

Leads are captured via `/api/lead` → Firestore `adspark_leads`.

## Self-serve pricing (cost-modeled)

COGS per generation ≈ Claude copy (~$0.02–0.04) + images (gpt-image-1 medium = $0.042 ea).
Images dominate cost. Quotas right-sized for ~50–80% gross margin:

| Plan | Price | Quota/mo | Variations | Images | Quality | Max COGS | Margin |
|---|---|---|---|---|---|---|---|
| Free | $0 | 5 | 3 | 1 | medium | $0.32 | loss leader (CAC) |
| Starter | $15 | 50 | 3 | 1 | medium | ~$3.15 | ~79% |
| Pro | $49 | 200 | 5 | 2 | medium | ~$23 | ~53% |

"high" image quality is reserved as a managed-service perk.

## The moat — creative-performance database

Generation alone is a commodity. The defensible asset is a **performance database**: every
asset we ship tagged with vertical / hook / format / offer / platform **and its result**
(CTR, CPA, ROAS, hold-rate). After 100–500 campaigns we own *"what converts for [niche] on
Meta right now"* — which no tool or foundation model has, and which compounds.

We already persist every generation to Firestore `adspark_generations`
(`app/api/generate/route.ts`). That is the **seed**. The moat appears when we add a `results`
field fed back from the Meta Marketing API. Start tagging from client #1.

## Engine principle — orchestrate, don't train; never hard-wire a vendor

We rent the best models behind a **model-router** so we can swap as price/quality/availability
change. `lib/ai.ts` routes image generation via the `IMAGE_ENGINE` env var.
⚠️ `gpt-image-1` deprecates **2026-10-23** — the router exists so that's a config change, not a
rewrite. Add FLUX / Ideogram / Bria engines to the registry as needed.

Recommended stack: copy → Claude Opus 4.8; static → Ideogram/FLUX/gpt-image; product video →
Veo 3.1 / Kling; UGC → HeyGen + ElevenLabs; IP-clean mode → Bria (licensed + indemnified).
**Avoid Sora 2** (API sunsets 2026-09-24).

## Roadmap

1. ✅ **Model-router abstraction** (`lib/ai.ts`) — done; engines pluggable; quality per plan.
2. ✅ **Pricing realigned** — funnel tiers cost-modeled; service tiers defined; lead capture live.
3. ✅ **Backend foundations** — data model (`lib/collections.ts`), deny-all Firestore/Storage
   rules, image persistence to Storage.
4. ✅ **Billing** — Stripe checkout + portal + webhook sync (`/api/checkout|portal|stripe/webhook`).
   Activate with `STRIPE_*` env.
5. ✅ **Operator console** — `/admin` (lead pipeline, clients, campaigns, generations);
   gated by `ADMIN_EMAILS` / user `admin` flag.
6. 🟡 **Campaign deployment** — Meta adapter + admin launch built (`lib/platforms/meta.ts`,
   `/api/admin/campaigns`). Needs a Meta app + `META_ACCESS_TOKEN` + ad account to go live;
   until then campaigns save as drafts.
7. 🟡 **Results ingestion → performance DB (the moat)** — built (`/api/admin/results`: manual
   entry now, Meta insight sync when configured; `results` collection). Remaining: tag
   `creatives` (vertical/hook/format/offer) so results attribute to *what* converts.
8. 🔜 **AI-disclosure compliance** — auto-label AI creative (FTC ~$53K/violation; TikTok strictest).
9. 🔜 **Pick one vertical** (e.g. Shopify DTC <$1M, med-spas, home services) and own it.

## Non-negotiables (from the dossier)

- Run our own ads as the primary acquisition channel and live demo.
- Flat pricing, no spend fee — lead with "no surprises" against Zeely.
- Volume creative (10–20 variants/client/mo) — "creative is the new targeting."
- Proactive weekly reporting — churn is a communication failure, not a results failure.
- Multi-platform from day one; no client or platform >30% of revenue.
