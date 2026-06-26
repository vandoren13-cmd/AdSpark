# AdSpark AI

AI ad-creative SaaS — generates platform-native ad copy, captions, hashtags, CTAs, and AI ad images. Standalone Next.js app (sibling to VanDoren-EMPIRE).

**Stack:** Next.js 14 · Firebase Auth + Firestore · Claude (`claude-opus-4-8`) for copy · OpenAI `gpt-image-1` for images · Stripe (subscriptions — Phase 3).

## Setup
1. `npm install`
2. `cp .env.local.example .env.local` and fill it in:
   - **Firebase WEB config** (`NEXT_PUBLIC_FIREBASE_*`) — reuse the `ai-empire-a9da3` project (Firebase console → Project settings → Your apps → Web app config) or a new project.
   - **Firebase ADMIN** (`FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`) — Project settings → Service accounts → Generate new private key.
   - **`ANTHROPIC_API_KEY`** (ad copy) and **`OPENAI_API_KEY`** (ad images).
3. In Firebase console → **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
4. `npm run dev` → http://localhost:3000

## Status
- ✅ **Phase 1** — public app, customer auth (email + Google), account section, data model.
- ✅ **Phase 2** — generation engine (copy + AI images), quota enforcement, history.
- ⏳ **Phase 3** — Stripe subscriptions (Starter/Pro/Agency). Add `STRIPE_*` env + price IDs, then wire `/api/checkout` + webhook.
- ⏳ **Phase 4** — image persistence to Firebase Storage, landing polish, deploy.

## Data model (Firestore)
- `adspark_users/{uid}` — `{ plan, periodKey, used, email, stripeCustomerId? }`
- `adspark_generations/{id}` — `{ uid, brief, variations, creativeBrief, imagePrompt, imageCount, createdAt }`

## Plans (`lib/plans.ts`)
Free (5) · Starter $15 (50) · Pro $49 (300) · Agency $199 (2000) — monthly generation quotas.
