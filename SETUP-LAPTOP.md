# Set up AdSpark on another machine (laptop / new PC)

Everything is on GitHub except `.env.local` (gitignored - it holds your secrets). So you
clone the repo, reinstall packages, and carry that one file over by hand.

## 1. Install prerequisites
- **Git** - https://git-scm.com
- **Node.js** - v20 or v22 LTS (anything 18+ works) - https://nodejs.org
- **VS Code** - https://code.visualstudio.com

## 2. Clone the repo
```bash
git clone https://github.com/vandoren13-cmd/AdSpark.git
cd AdSpark
npm install
```
The first `git` operation will open a browser to sign in to GitHub (Git Credential Manager).

## 3. Bring over `.env.local` (the only manual step)
This file is **not** in GitHub on purpose - it contains live secrets (Firebase admin key,
Anthropic/OpenAI keys, etc.).

- On the original machine it lives at: `c:\Users\Patrick\Desktop\adspark-ai\.env.local`
- Move it **securely** - USB drive, a cloud folder you control (OneDrive/Drive), or a
  password manager. **Do not email it or paste it anywhere public.**
- Drop it into the cloned `AdSpark` folder.

Alternative (rebuild it): `cp .env.local.example .env.local` then paste each key. See
[RUNBOOK.md](RUNBOOK.md) for what every key is and where to get it.

## 4. Open in VS Code & run
```bash
code .
npm run dev      # → http://localhost:3000
npm run build    # production build / type-check
```

## 5. Continue with Claude (optional)
Install the **Claude Code** extension from the VS Code marketplace and sign in.
The chat history doesn't sync between machines, but the full project context is captured in
[ACCOMPLISHMENTS.md](ACCOMPLISHMENTS.md), [STRATEGY.md](STRATEGY.md), [RUNBOOK.md](RUNBOOK.md),
and [COMPLIANCE.md](COMPLIANCE.md) - point a fresh session at those and it's caught up.

## 6. Keep machines in sync
Whichever machine you work on:
```bash
git pull     # before you start
# ...work, commit...
git push     # when you finish
```
This prevents the two copies from diverging. `.env.local` stays local on each machine.

---
*Stack: Next.js 14 · Firebase · Stripe · Resend · native Meta/Google/TikTok + HeyGen/fal adapters.*
