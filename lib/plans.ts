// lib/plans.ts — pricing for both halves of the business (see STRATEGY.md):
//   • PLANS         — self-serve generation tiers (the funnel / lead magnet)
//   • SERVICE_TIERS — done-for-you managed ad service (the anchor; flat retainers)
// Self-serve quotas are cost-modeled for healthy margin; images dominate COGS
// (gpt-image-1 medium ≈ $0.042/image), so quotas — not just price — control margin.

export type PlanId = "free" | "starter" | "pro";

// Image fidelity → cost lever. low ≈ $0.011, medium ≈ $0.042, high ≈ $0.167 per image.
export type ImageQuality = "low" | "medium" | "high";

export interface Plan {
  id: PlanId;
  name: string;
  priceUsd: number;        // monthly
  quota: number;           // generations per month (a generation = a set of variations + image(s))
  variants: number;        // ad-copy variations produced per generation
  images: number;          // AI images produced per generation
  imageQuality: ImageQuality;
  stripePriceEnv?: string; // env var holding the Stripe price id
  blurb: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free:    { id: "free",    name: "Free",    priceUsd: 0,  quota: 5,   variants: 3, images: 1, imageQuality: "medium", blurb: "Try it — 5 generations, no card." },
  starter: { id: "starter", name: "Starter", priceUsd: 15, quota: 50,  variants: 3, images: 1, imageQuality: "medium", stripePriceEnv: "STRIPE_PRICE_STARTER", blurb: "Solo creators & small campaigns." },
  pro:     { id: "pro",     name: "Pro",     priceUsd: 49, quota: 200, variants: 5, images: 2, imageQuality: "medium", stripePriceEnv: "STRIPE_PRICE_PRO",     blurb: "Growing brands running ads weekly." },
};

export const PLAN_LIST = Object.values(PLANS);
export const planFor = (id?: string): Plan => PLANS[(id as PlanId)] || PLANS.free;

// ── Done-for-you managed service (the anchor) ────────────────────────────────
// Flat monthly retainer, separate from the client's ad spend — NO % of spend fee
// (this is the wedge against Zeely's hated 12% fee). Sales-led: leads captured via
// /api/lead → Firestore `adspark_leads`, not self-serve checkout.

export type ServiceTierId = "spark" | "blaze" | "inferno";

export interface ServiceTier {
  id: ServiceTierId;
  name: string;
  priceUsd: number;      // flat monthly retainer
  tagline: string;
  targetSpend: string;   // who it's for, by ad-spend size
  features: string[];
  popular?: boolean;
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: "spark", name: "Spark", priceUsd: 997,
    tagline: "We run one platform for you, end-to-end.",
    targetSpend: "$500–$2K/mo ad spend",
    features: ["1 platform (Meta or Google)", "6–8 AI creatives / mo", "Campaign setup + management", "Weekly performance report", "Flat price — no % of ad spend"],
  },
  {
    id: "blaze", name: "Blaze", priceUsd: 1997, popular: true,
    tagline: "Two platforms, continuous creative testing.",
    targetSpend: "$2K–$8K/mo ad spend",
    features: ["2 platforms", "12–15 AI creatives / mo", "A/B testing + optimization", "Bi-weekly strategy call", "Dedicated creative pipeline"],
  },
  {
    id: "inferno", name: "Inferno", priceUsd: 3500,
    tagline: "Full-funnel, every platform, a dedicated strategist.",
    targetSpend: "$8K+/mo ad spend",
    features: ["All platforms", "Unlimited creative", "Full-funnel strategy", "Dedicated strategist", "IP-clean creative option"],
  },
];
