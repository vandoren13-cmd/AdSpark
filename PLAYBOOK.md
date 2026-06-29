# AdSpark - Operator Playbook (how to run the business)

How to actually operate AdSpark day to day and make money, tied to what is built and where
to click. Companion docs: [RUNBOOK.md](RUNBOOK.md) (go-live), [STRATEGY.md](STRATEGY.md)
(positioning), [ACCOMPLISHMENTS.md](ACCOMPLISHMENTS.md) (everything built).

## The model in one line
Two revenue engines on one platform: a **self-serve tool** (low-touch, scalable, lower margin)
that is the front door and growth engine, and a **done-for-you service** (high-touch, high-margin)
that self-serve users switch on as a background upgrade. Self-serve fills the funnel; the service
is where the real money is.

---

## 1. Get it live (one-time)
Follow [RUNBOOK.md](RUNBOOK.md) top to bottom. Minimum to start taking money:
1. Deploy to Vercel and add env vars (builds without them, but does not function until set).
2. `firebase deploy --only firestore:rules,storage` (locks the database).
3. Enable Firebase Auth (Email + Google) and Storage.
4. Confirm Anthropic and OpenAI billing is active.
5. Stripe: create Starter and Pro prices, set keys, point a webhook at `/api/stripe/webhook`.
6. Set `ADMIN_EMAILS` to your login email so `/admin` works.
7. Optional, add as you grow: Resend (emails), Meta/Google/TikTok keys (when you land a managed
   client), `CRON_SECRET` (auto weekly reports), HeyGen/fal keys (video).

Everything switches on one key at a time. Launch self-serve first; add service plumbing when you
sign your first client.

---

## 2. Running the SELF-SERVE side (mostly automated)
A customer lands, signs up, generates ads (copy, images, video, paste-a-URL, enhance), and pays
through Stripe. Quotas and billing are enforced automatically. Your job is three things:
- **Drive traffic** to the landing page (see GTM below).
- **Watch the funnel** in `/admin` (page views, signups, generations).
- **Support** the occasional question and keep AI provider billing topped up so generations never fail.

Pricing (already set in the product):

| Plan | Price | Generations | Video / mo |
|---|---|---|---|
| Free | $0 | 5 | 1 |
| Starter | $15 | 50 | 5 |
| Pro | $49 | 200 | 30 |

Self-serve margins are roughly 50 to 80 percent after AI costs. The point of self-serve is volume
plus a steady stream of warm leads for the service.

---

## 3. Running the DONE-FOR-YOU side (where the margin is)
This is the active, high-margin part. The whole delivery loop lives in **`/admin`**.

**a. Leads come in two ways**
- From `/done-for-you` (someone applies).
- From inside the app: a self-serve user clicks "Turn it on" in their account (drops a lead in
  `/admin` and emails you).

**b. Work the lead** (`/admin` > Leads)
- Mark "Contacted," then "Convert" to turn a lead into a client. Reach out within one business day
  with a free teardown of 3 ad concepts. This is your highest-converting sales move.

**c. Set up the client** (`/admin` > Campaigns)
- Create a campaign, pick platform and objective, and "Go live." With platform keys set, it launches
  the campaign paused on Meta/Google/TikTok for your review. Without keys, it saves as a draft and
  you run it manually.

**d. Make the creative**
- Use the generator (`/app`) to produce copy, images, and video for the client. Promote the best
  generations to "Creatives" in `/admin` so they carry tags.

**e. Log or sync results** (`/admin` > Creatives or Campaigns)
- Pull results automatically (platform sync) or type them in manually. This step builds your moat,
  because every result is tagged by hook, format, and vertical.

**f. Report every week** (`/admin` > Clients > Report)
- One click generates a shareable report and emails the client. With `CRON_SECRET` set, this runs
  automatically every Monday for all active clients. The client tracks everything in their `/portal`.

**The single most important habit: communicate weekly.** Clients churn from silence, not from
results. The automated weekly report plus a short personal note is the cheapest retention you have.

Service pricing (flat, no percentage of ad spend, your wedge against Zeely):

| Tier | Price/mo | For |
|---|---|---|
| Spark | $997 | $500 to $2K/mo ad spend |
| Blaze | $1,997 | $2K to $8K/mo ad spend |
| Inferno | $3,500 | $8K+/mo ad spend |

Service gross margins run 55 to 90 percent because the AI does the production. The math: 8 clients
at $2,000 is about $192K/year; 18 clients at higher tiers can clear $800K+. One operator can handle
12 to 18 clients because the tooling automates creative and reporting.

---

## 4. Getting customers (ranked by what works)
1. **Run your own ads** to the landing page. Ads you made are your live demo, and those leads convert
   far better. Non-negotiable for an ad company.
2. **Personalized cold outreach** with a free teardown ("here are 3 creatives we would test for you").
   Payback on a $997+ client is under one month.
3. **Short-form content**: "why this ad is failing and what we would do" teardown videos. Proves
   competence and compounds into SEO.
4. **Niche communities and partnerships**: rev-share with web designers, Shopify devs, and coaches
   who serve your niche.

---

## 5. The moat (what makes you un-copyable)
Every asset is auto-tagged and every result is attributed to those tags, so `/admin` shows "what
converts" by hook, format, and vertical. After 100 to 500 campaigns you know what wins for your
niche, which no tool or competitor has. Two rules:
- **Pick one vertical first** (for example Shopify DTC under $1M, med spas, or home services) and own
  it before expanding.
- **Tag and log results on everything**, even manually, from client number one.

---

## 6. Operating rhythm
- **Daily**: check `/admin` for new leads, respond fast with a teardown; confirm AI billing is active.
- **Weekly**: send each client their report (automated) plus a one-line personal note; produce a batch
  of fresh creative variations per client (volume of creative is the biggest performance lever);
  publish one piece of content.
- **Monthly**: review "what converts" insights, prune losers, double down on winners; review margins
  and Stripe revenue; ask for referrals.

---

## 7. Metrics to watch (all in `/admin`)
- **MRR** and **blended ROAS** (top of `/admin`).
- **New leads** and lead-to-client conversion.
- **Generations (30d)** and signups (self-serve health).
- **Per-client ROAS** (are you keeping them winning).
- **Churn** (the silent killer; defend with weekly comms).

---

## 8. First 90 days
- **Days 0 to 30**: launch self-serve live, run your own ads, do everything manually, land 1 to 3
  service clients, learn the delivery loop by hand.
- **Days 30 to 60**: systematize onboarding and reporting, lean on the automation, start content.
- **Days 60 to 90**: turn on the weekly-report cron for all clients, launch a referral or partner
  program, publish your first "State of [niche] ads" insight piece from your own data (a moat and a
  lead magnet at once).

---

## 9. Risks to manage
- **Stay honest**: never claim a guaranteed result; disclaimers are in the Terms.
- **Compliance**: every asset is AI-labeled already; never present an AI persona as a real customer.
- **Platform dependency**: stay multi-platform, no single client over about 30 percent of revenue.
- **Cost control**: video is the expensive action (about $0.80 per clip); per-plan video quotas are
  your guardrail, so tune them before opening the floodgates.

---

**Bottom line:** self-serve is your automated top of funnel and a small profit center; the
done-for-you service, run through `/admin` with weekly reporting, is the real business and the
high-margin engine. Win one vertical, run your own ads to fill the pipe, and let the
tagging-plus-insights flywheel compound.
