// lib/stripe.ts - SERVER ONLY. Stripe client + plan↔price mapping.
// Lazily constructed so the app builds/runs without billing configured; handlers
// surface a clean "billing not configured" error until STRIPE_* env is set.
import Stripe from "stripe";
import { PLANS, PLAN_LIST } from "@/lib/plans";

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Billing is not configured (STRIPE_SECRET_KEY missing).");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const billingReady = () => !!process.env.STRIPE_SECRET_KEY;

// plan id -> Stripe price id (resolved from env via plans.ts → stripePriceEnv)
export function priceIdForPlan(planId: string): string | null {
  const p = (PLANS as any)[planId];
  if (!p?.stripePriceEnv) return null;
  return process.env[p.stripePriceEnv] || null;
}

// Stripe price id -> plan id (reverse lookup, for the webhook)
export function planForPriceId(priceId?: string | null): string {
  if (!priceId) return "free";
  for (const p of PLAN_LIST) {
    if (p.stripePriceEnv && process.env[p.stripePriceEnv] === priceId) return p.id;
  }
  return "free";
}
