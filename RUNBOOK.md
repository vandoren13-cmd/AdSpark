# AdSpark — Activation Runbook

Everything is **built and deploys green**. This is the exact list of human-only inputs to turn
it live and start making money. Work top to bottom; each block is independent.

Set env vars in **`.env.local`** (local) and in your **Vercel project → Settings → Environment
Variables** (production). Template: [.env.local.example](.env.local.example).

---

## 0. Deploy the app (Vercel) — do this first
1. Import the GitHub repo (`vandoren13-cmd/AdSpark`) into Vercel (Next.js auto-detected).
2. Add all env vars from `.env.local` to Vercel (Production + Preview).
3. Set `NEXT_PUBLIC_APP_URL` to your real domain (e.g. `https://adspark.ai`).
4. Deploy. Add your custom domain in Vercel → Domains.

## 1. Lock the database (security — do this before real users) ⚠️
The rules are written but inert until deployed:
```
npm i -g firebase-tools      # if needed
firebase login
firebase deploy --only firestore:rules,storage   # uses firebase.json / .firebaserc
```
Also enable **Firebase Storage** in the console (project `ad-spark-b2bb4`) if not already.
Optional: in Firestore, add a **TTL policy** on `adspark_ratelimits.exp` to auto-clean counters.

## 2. Firebase Auth sign-in methods
Firebase console → **Authentication → Sign-in method** → enable **Email/Password** and **Google**.
(Already-set keys are in `.env.local`.)

## 3. Operator access (you)
`ADMIN_EMAILS` is set to `vandoren13@gmail.com`. Make sure that's the email you log into AdSpark
with, then visit **/admin**. (Add more operators as a comma-separated list.)

## 4. Stripe billing (collect money on self-serve)
1. Stripe dashboard → create **Products/Prices** for Starter ($15/mo) and Pro ($49/mo).
2. Set env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`.
3. Stripe → Developers → **Webhooks** → add endpoint `https://YOURDOMAIN/api/stripe/webhook`,
   events: `customer.subscription.created`, `.updated`, `.deleted`. Copy the signing secret →
   `STRIPE_WEBHOOK_SECRET`.
4. Test: on `/account`, click **Upgrade** → complete Stripe checkout → plan updates via webhook.

## 5. AI provider billing
`ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are set. Confirm both accounts have **billing/credits**
enabled, or generations will fail. (gpt-image-1 sunsets 2026-10-23 — swap engines later via
`IMAGE_ENGINE` in `lib/ai.ts`.)

## 6. Email (Resend) — welcome, lead, report emails
1. Create a Resend account, verify a **sending domain** (or subdomain like `mail.adspark.ai`).
2. Add DNS records Resend gives you: **SPF, DKIM, DMARC** (start DMARC at `p=none`).
3. Set env: `RESEND_API_KEY`, `EMAIL_FROM` (an address on the verified domain), `EMAIL_REPLY_TO`.
Until set, emails safely no-op (logged).

## 7. Done-for-you ad platforms (launch real campaigns + pull results)
Each is optional and independent; until configured, campaigns save as **drafts** and results can
be entered **manually** in /admin.
- **Meta:** create a Meta app + system-user token + ad account → `META_ACCESS_TOKEN`,
  `META_AD_ACCOUNT_ID`.
- **Google Ads:** `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`,
  `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_CUSTOMER_ID`.
- **TikTok:** `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID`.
Smoke-test each with one campaign in /admin (it's created PAUSED) before relying on it.

## 8. Weekly client reports (automation)
Set `CRON_SECRET` to a long random string (Vercel + `.env.local`). `vercel.json` already schedules
`/api/cron/weekly-reports` for Mondays 14:00 UTC; Vercel Cron authenticates with `CRON_SECRET`.
Manual test: `GET /api/cron/weekly-reports?secret=YOUR_SECRET`.

## 9. Legal + compliance
- Have counsel review [/terms](app/terms/page.tsx) and [/privacy](app/privacy/page.tsx) templates.
- Compliance follow-ups (IPTC + signed C2PA auto-labels, real-person guardrails): [COMPLIANCE.md](COMPLIANCE.md).

---

## First-revenue checklist
1. Deploy (0) + lock DB (1) + auth (2) + AI billing (5). → self-serve generator works.
2. Stripe (4). → self-serve can be charged.
3. Email (6). → welcome + lead emails fire.
4. Run your own ads to your `/done-for-you` page; work leads in /admin; convert → client.
5. Configure a platform (7) + cron (8). → you run a client's ads and they get weekly reports.
