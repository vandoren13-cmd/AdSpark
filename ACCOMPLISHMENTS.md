# AdSpark AI - Build Session Accomplishments

**Session date:** 2026-06-27
**Outcome:** AdSpark went from a thin self-serve ad-copy generator to a complete, deployable,
two-sided AI ad business - a self-serve funnel **and** a done-for-you managed-service back office,
with a proprietary performance-data moat, native multi-platform ad integrations, billing, email,
reporting, a client portal, compliance, security, and analytics.

Everything below is **built, type-checked (`npm run build` green at every step), committed, and
pushed to `main`** (`vandoren13-cmd/AdSpark`). What remains is human-only input - live API keys,
platform developer apps, domain, legal review - all documented in [RUNBOOK.md](RUNBOOK.md).

---

## 1. Strategy & positioning
- Locked the business model to **"C anchored on A"**: a done-for-you ad **service** is the
  business; the self-serve tool is the **funnel/lead magnet**. ([STRATEGY.md](STRATEGY.md))
- Positioning wedge against **Zeely.ai**: flat price, **no % of ad spend**, truly done-for-you,
  no surprises - attacking Zeely's #1 complaint (billing/spend-fee) head-on.
- Repriced the self-serve tiers to be **cost-modeled** (dropped the money-losing "Agency" quota
  tier; Free/Starter/Pro now carry healthy margins) and defined **service tiers**
  (Spark $997 / Blaze $1,997 / Inferno $3,500, flat retainers).

## 2. Customer-facing front of house
- **Landing page** ([app/page.tsx](app/page.tsx)): hero, done-for-you anchor band, self-serve
  pricing reframed as DIY, **FAQ**, legal footer.
- **Done-for-you page + lead capture** ([app/done-for-you/page.tsx](app/done-for-you/page.tsx),
  [/api/lead](app/api/lead/route.ts)): service tiers + "free teardown" application form →
  `adspark_leads`.
- **Self-serve generator** ([app/app/page.tsx](app/app/page.tsx)): copy + AI images, now with a
  visible **"AI-generated"** compliance label.
- **Account page** ([app/account/page.tsx](app/account/page.tsx)): live Upgrade/Manage-billing,
  plan/usage, history, portal + done-for-you links.
- **SEO/polish**: full metadata (OpenGraph/Twitter/keywords), branded favicon
  ([app/icon.svg](app/icon.svg)), [robots.ts](app/robots.ts) + [sitemap.ts](app/sitemap.ts),
  [Terms](app/terms/page.tsx) + [Privacy](app/privacy/page.tsx) templates.

## 3. Backend foundations
- **Central data model** ([lib/collections.ts](lib/collections.ts)): typed schema for 11
  collections (users, generations, leads, clients, campaigns, creatives, results, reports,
  invoices, events, ratelimits).
- **Security rules**: deny-all client access to Firestore + Storage
  ([firestore.rules](firestore.rules), [storage.rules](storage.rules)) - everything goes through
  the Admin SDK. Firebase config ([firebase.json](firebase.json), [.firebaserc](.firebaserc)).
- **Image persistence** ([lib/storage.ts](lib/storage.ts)): generated images upload to Firebase
  Storage with tokenized URLs (survive refresh; power history/portal/library).

## 4. Billing (Stripe)
- [lib/stripe.ts](lib/stripe.ts) + [/api/checkout](app/api/checkout/route.ts) +
  [/api/portal](app/api/portal/route.ts) + [/api/stripe/webhook](app/api/stripe/webhook/route.ts):
  subscription checkout, self-service billing portal, signature-verified webhook that syncs
  plan/subscription state onto the user. Lazy/no-op until keys are set.

## 5. Operator console (the back office) - `/admin`
- [app/admin/page.tsx](app/admin/page.tsx), gated by `ADMIN_EMAILS`/`admin` flag
  ([lib/admin.ts](lib/admin.ts)). One screen to run the whole business:
  - **Stats**: MRR, blended ROAS, new leads, clients, creatives, users, generations, events.
  - **What's converting** insights, **lead pipeline** (contact/convert/lost),
    **clients** (+ generate report), **client reports**, **campaigns** (create/go-live + sync/log
    results), **creatives library**, recent generations.

## 6. The moat - performance database
- **Auto-tagging** ([lib/ai.ts](lib/ai.ts)): every generation is classified by
  **vertical/hook/format/offer** in the *same* Claude call (zero extra cost).
- **Creative library** ([/api/admin/creatives](app/api/admin/creatives/route.ts)) + **results
  attribution** ([/api/admin/results](app/api/admin/results/route.ts)) → results carry tags.
- **"What converts" insights** ([/api/admin/overview](app/api/admin/overview/route.ts)): ROAS/CPA/
  spend aggregated by hook, format, vertical, platform. This is the compounding, un-copyable asset.

## 7. Native ad-platform integrations (built from scratch, no connectors)
- **Meta** ([lib/platforms/meta.ts](lib/platforms/meta.ts)), **Google Ads**
  ([lib/platforms/google.ts](lib/platforms/google.ts)), **TikTok**
  ([lib/platforms/tiktok.ts](lib/platforms/tiktok.ts)) - campaign create + insights, behind a
  single **dispatcher** ([lib/platforms/index.ts](lib/platforms/index.ts)). Each env-gated;
  campaigns launch PAUSED for review. Drafts/manual until keys added.

## 8. Client reporting + portal (retention)
- **Reports** ([lib/report.ts](lib/report.ts), [/api/admin/reports](app/api/admin/reports/route.ts)):
  one-click 30-day report (spend/revenue/ROAS/CTR/CPA + campaigns + best angle), stored with a
  share token, optionally emailed.
- **Public shareable report** ([/r/[id]](app/r/[id]/page.tsx), token-gated
  [/api/report/[id]](app/api/report/[id]/route.ts)).
- **Client portal** ([/portal](app/portal/page.tsx), [/api/client](app/api/client/route.ts)):
  managed clients log in to see campaigns, blended performance, and reports.
- **Automated weekly reports** ([/api/cron/weekly-reports](app/api/cron/weekly-reports/route.ts) +
  [vercel.json](vercel.json)): emails every active client a fresh report on a schedule.

## 9. Email / notifications
- [lib/email.ts](lib/email.ts) (Resend HTTP, no SDK, no-op until keyed) + branded templates
  ([lib/emails.ts](lib/emails.ts)): welcome, new-lead, lead-ack, report-ready. Wired into
  signup/lead/report flows.

## 10. AI-disclosure compliance
- [lib/compliance.ts](lib/compliance.ts): per-asset compliance record + visible "AI-generated"
  label; [COMPLIANCE.md](COMPLIANCE.md) documents the 2026 FTC/Meta/TikTok/Google landscape, the
  shipped record+label layer, the keys-required follow-ups (IPTC + signed C2PA auto-label triggers,
  real-person guardrails), and a sellable "compliance-by-default" policy.

## 11. Security & analytics
- **Rate limiting** ([lib/ratelimit.ts](lib/ratelimit.ts)): native Firestore fixed-window limiter
  (no Redis), fails open. 20/min per user on generate, 5/hr per IP on lead, 120/min on events.
- **First-party analytics** ([lib/events.ts](lib/events.ts), [lib/PageView.tsx](lib/PageView.tsx),
  [/api/event](app/api/event/route.ts)): page views + funnel events (lead_created, signup,
  generation_created), surfaced in the /admin funnel readout. No third-party connector.

---

## 12. Zeely feature-parity push (video + ingestion)
After comparing AdSpark to Zeely's live product, closed the four product gaps:
- **🎬 AI video** ([lib/video.ts](lib/video.ts), [/api/video](app/api/video/route.ts) +
  [poll](app/api/video/[id]/route.ts)): avatar/UGC/talking-head via **HeyGen** and cinematic
  product video via **fal.ai** (Veo/Kling/Seedance), async job→poll, result re-hosted to Storage,
  per-plan video quota, **🎬 Video** mode in the generator. (Built from API research.)
- **🔗 URL → brief ingestion** ([lib/scrape.ts](lib/scrape.ts), [/api/scrape](app/api/scrape/route.ts)):
  paste a product/Shopify URL → SSRF-guarded scrape → Claude-cleaned brief auto-fills the form.
- **📝 AI ad-script generator** ([lib/ai.ts](lib/ai.ts) `generateVideoScript`): hook/scenes/
  voiceover/CTA; powers avatar video and stands alone.
- **✨ AI image enhancer** ([lib/enhance.ts](lib/enhance.ts), [/api/enhance](app/api/enhance/route.ts)):
  one-click upscale via fal.ai.

We now match Zeely's product surface (copy, static, **video**, avatars, URL-to-ad, enhancer)
while keeping the edges Zeely lacks (done-for-you service, flat/no-spend-fee pricing,
multi-platform native launch, the performance-data moat, portal + auto reports, compliance).

## Best-in-class research conducted (4 parallel agents, ~110 sources)
1. **Google Ads + TikTok APIs** - exact OAuth, endpoints, micros/code-envelope gotchas → built the
   adapters directly from it.
2. **Transactional email (2026)** - Resend recommended; HTTP shape + SPF/DKIM/DMARC → built the email layer.
3. **AI-disclosure rules (FTC/Meta/TikTok/Google)** - IPTC/C2PA provenance, $53,088/violation,
   guardrails → built the compliance layer + policy.
4. **Video generation APIs (HeyGen + fal.ai)** - async create/poll, model selection, cost →
   built the video router + image enhancer.

## Commit log (this session)
```
08d42cf Automated weekly reports via Vercel Cron
849e622 Analytics: first-party funnel event tracking
e15f7ae Security: native Firestore rate limiter
f97487a Front-end polish: SEO, favicon, FAQ, legal, sitemap
34e59db AI-disclosure compliance
7045f22 Client portal
2c32da3 Client reporting + shareable report page
c30b20d Native Google Ads + TikTok adapters + dispatcher
84eda80 Transactional email (Resend)
c7a3bd9 Moat: auto-tagging + creative library + insights
1923d1b Service delivery: campaign deployment + results ingestion
28b12b5 Operator console (/admin)
f4bb403 Stripe billing
b954c67 Backend foundations: data model, security rules, image persistence
d34aaa4 Reposition as done-for-you service + self-serve funnel
```
65 tracked files · 30 routes · 20 lib modules.

---

## What's live now vs. needs your input
**Works today (no keys):** funnel, lead capture + pipeline, operator console, draft campaigns,
manual result logging, insights, reporting + portal, analytics, rate limiting, compliance labels.

**Needs your input (all documented in [RUNBOOK.md](RUNBOOK.md)):** deploy to Vercel + custom domain;
`firebase deploy` the security rules; enable Firebase Auth methods + Storage; Stripe products +
webhook; confirm Anthropic/OpenAI billing; Resend domain + DNS; Meta/Google/TikTok developer apps;
`CRON_SECRET`; legal review of Terms/Privacy.

## Recommended next moves (post-activation)
1. Pick **one vertical** and tailor templates/benchmarks to it.
2. Run your own ads to `/done-for-you` (your live demo + lead source).
3. Land 1 - 3 service clients, run their ads, let the weekly-report + insights flywheel compound.
4. Build the IPTC/C2PA auto-label embedding (needs an image lib + signing cert - see COMPLIANCE.md).
5. Publish a "State of [Niche] Ads" report from your insights data - moat *and* lead magnet.
