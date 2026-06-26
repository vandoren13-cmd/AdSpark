// lib/plans.ts — subscription tiers + monthly generation quotas. The Stripe price
// IDs (set in env) map a checkout to a plan; the webhook writes plan+quota to the user.

export type PlanId = "free" | "starter" | "pro" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  priceUsd: number;        // monthly
  quota: number;           // generations per month (a generation = a set of ad variations + image)
  variants: number;        // ad-copy variations produced per generation
  images: number;          // AI images produced per generation
  stripePriceEnv?: string; // env var holding the Stripe price id
  blurb: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free:    { id: "free",    name: "Free Trial", priceUsd: 0,   quota: 5,    variants: 3, images: 1, blurb: "Try it — 5 generations, no card." },
  starter: { id: "starter", name: "Starter",    priceUsd: 15,  quota: 50,   variants: 3, images: 1, stripePriceEnv: "STRIPE_PRICE_STARTER", blurb: "Solo creators & small campaigns." },
  pro:     { id: "pro",     name: "Pro",        priceUsd: 49,  quota: 300,  variants: 5, images: 2, stripePriceEnv: "STRIPE_PRICE_PRO",     blurb: "Growing brands running ads weekly." },
  agency:  { id: "agency",  name: "Agency",     priceUsd: 199, quota: 2000, variants: 8, images: 3, stripePriceEnv: "STRIPE_PRICE_AGENCY",  blurb: "Agencies & high-volume teams." },
};

export const PLAN_LIST = Object.values(PLANS);
export const planFor = (id?: string): Plan => PLANS[(id as PlanId)] || PLANS.free;
