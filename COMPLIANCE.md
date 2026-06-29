# AdSpark - AI Disclosure Compliance

> Engineering/product reference, not legal advice. Platform policy pages change often - > re-verify on a schedule and version the ruleset (see policy #8 below).

## The landscape (2026)

- **FTC (US):** No law requires a generic "this is AI" label. The violations are *deception* - fake reviewers/testimonials, AI personas posing as **real** customers, fabricated endorsements,
  unsupported claims. Governing rules: Endorsement Guides (16 CFR 255), **Consumer Reviews &
  Testimonials Rule (16 CFR 465** - explicitly covers AI; the "exists" prong bans AI personas
  presented as real customers), Impersonation Rule (16 CFR 461). Penalty exposure: **$53,088 per
  violation** (held for 2026), compounding per ad/dissemination. Dec 2025 Rytr set-aside shifted
  enforcement toward the deceptive **advertiser**, not the tool provider - but the rules stand.
- **Platforms (strictest → most permissive): TikTok > Meta > Google/YouTube.** All auto-label AI
  content via provenance metadata (C2PA / IPTC). TikTok additionally **bans** some categories even
  when labeled (private-person likeness without consent; fabricated public-figure endorsements).

## What AdSpark ships today (the record + disclosure layer)

- **Per-asset compliance record** - `lib/compliance.ts` attaches `{ aiGenerated, copyModel,
  imageEngine, disclosure, policyVersion }` to every generation (`adspark_generations.compliance`).
  This is the audit trail / FTC substantiation seed.
- **Visible "AI-generated" label** on output images in the generator, plus a "labeled for platform
  compliance" note. Promoted creatives are flagged `aiDisclosed: true`.
- **Policy versioning** - `COMPLIANCE_POLICY_VERSION` stamps which ruleset applied at generation time.

## Keys/setup-required follow-ups (the auto-label triggers)

These need an image library + a trust-listed C2PA signing certificate, so they're documented here
rather than half-built:

1. **IPTC `DigitalSourceType` metadata** written into the PNG
   (`...digitalsourcetype/trainedAlgorithmicMedia` for fully-AI, `compositeWith...` for AI-edited).
   This is the single highest-leverage move - it's what makes Meta/TikTok/Google **auto-label** the
   asset. Tooling: ExifTool or Adobe XMP SDK.
2. **C2PA Content Credentials** - a signed provenance manifest embedding the AI + IPTC assertions.
   Libraries: `c2pa-node` / `c2patool` (MIT/Apache). Production needs a trust-listed signing cert
   (self-signed is test-only).
3. **Product guardrails to enforce** (block, not just warn): no generating identifiable **real**
   people without an uploaded consent record; no AI personas presented as real named customers/
   reviewers; no fabricated celebrity/public-figure endorsements. Allow clearly-fictional, disclosed
   virtual spokespeople with a "Dramatization - AI-generated, not a real customer" label.

## "Compliance-by-default" - the sellable policy

1. Provenance on every asset (IPTC + signed C2PA) - the signals platforms auto-label on. *(follow-up)*
2. Visible "AI-generated" badge, on by default for photorealistic creative. *(shipped)*
3. No fake humans - block real-person likeness w/o consent + AI-as-real-customer + fake endorsements. *(guardrail - follow-up)*
4. Disclosed dramatizations only - fictional spokespeople auto-labeled + material-connection line.
5. Platform-aware checklist at export (Meta SIEP self-disclosure, TikTok AIGC + paid-partnership,
   Google "Altered or synthetic content").
6. Substantiation prompt - objective claims trigger an evidence-capture step.
7. Immutable per-asset compliance record (hash, model, prompt, labels, consent, attestation, policy
   version). *(record shipped; expand fields with the follow-ups)*
8. Policy auto-updates - track FTC + platform pages; version the ruleset per asset.

> **Marketing honesty:** position as "built to meet current platform & FTC disclosure requirements,"
> never "guarantees you won't be penalized" - the latter is itself an FTC-actionable claim.
