# AdSpark AI

An AI ad-creative SaaS **and** done-for-you ad-management service. Self-serve users generate
platform-native ad copy + AI images; managed clients get their ads run end-to-end — flat price,
no spend fees. Standalone Next.js 14 app.

**Stack:** Next.js 14 (App Router) · Firebase Auth + Firestore + Storage · Claude
(`claude-opus-4-8`) for copy · OpenAI `gpt-image-1` for images · Stripe (billing) · Resend (email)
· native Meta / Google Ads / TikTok adapters.

## The model — "C anchored on A"
A done-for-you ad **service** is the business; the self-serve tool is the **funnel**. Full strategy
in **[STRATEGY.md](STRATEGY.md)**.

## What's here
- **Funnel:** landing, self-serve generator (copy + AI images + **AI video** (avatar/UGC + cinematic),
  **URL→brief import**, **image enhancer**, auto-tagged, quota-enforced), Stripe billing, accounts.
- **Service:** `/done-for-you` + lead capture, `/admin` operator console (leads → clients →
  campaigns → results → reports), native ad-platform deployment, client `/portal`, automated
  weekly reports.
- **Moat:** a creative-performance database — every asset tagged by vertical/hook/format/offer,
  results attributed to tags, "what converts" insights.
- **Cross-cutting:** transactional email, AI-disclosure compliance, rate limiting, first-party
  analytics, SEO, legal pages.

## Run locally
1. `npm install`
2. `cp .env.local.example .env.local` and fill it in (see **[RUNBOOK.md](RUNBOOK.md)**).
3. `npm run dev` → http://localhost:3000
4. Operator console at `/admin` (set `ADMIN_EMAILS` to your login email).

## Going live
Everything is built and deploys green; live API keys + a few console steps are all that's left.
Follow **[RUNBOOK.md](RUNBOOK.md)** top to bottom.

## Docs
- **[ACCOMPLISHMENTS.md](ACCOMPLISHMENTS.md)** — everything built, by section.
- **[STRATEGY.md](STRATEGY.md)** — positioning, pricing, moat, roadmap.
- **[RUNBOOK.md](RUNBOOK.md)** — activation steps (keys, deploy, platforms).
- **[COMPLIANCE.md](COMPLIANCE.md)** — AI-disclosure policy + follow-ups.

## Architecture notes
- All data access is **server-side via the Firebase Admin SDK**; the client uses Firebase for Auth
  only. Firestore/Storage rules are deny-all — deploy them with
  `firebase deploy --only firestore:rules,storage`.
- Integrations are **env-gated and no-op until configured** — the app builds and runs without any
  third-party keys; each capability lights up when its keys are added.
- Image generation is behind a **model-router** (`IMAGE_ENGINE`) — `gpt-image-1` sunsets
  2026-10-23; swapping engines is a config change.

© 2026 AdSpark AI · AI ad creative, on autopilot.
