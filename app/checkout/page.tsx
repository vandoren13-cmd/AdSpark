"use client";
// app/checkout/page.tsx - on-site EMBEDDED Stripe Checkout. The user never leaves
// ad-spark.net; Stripe's secure card iframe mounts inside this page. On completion
// Stripe returns them to /account?checkout=success (same domain). The subscription
// itself is synced to the user by the webhook (/api/stripe/webhook).
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useAuth } from "@/lib/AuthProvider";
import { planFor } from "@/lib/plans";

// Load Stripe.js once, at module scope (recommended). Safe to expose the publishable key.
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

function CheckoutInner() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("plan") || "";
  const plan = planFor(planId);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);

  const fetchClientSecret = useCallback(async () => {
    const t = await getToken();
    if (!t) throw new Error("Please sign in.");
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const j = await r.json();
    if (!j.clientSecret) throw new Error(j.error || "Could not start checkout.");
    return j.clientSecret as string;
  }, [getToken, planId]);

  if (loading || !user) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>;

  if (!pk) return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ padding: 24, maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Checkout isn't configured yet</div>
        <div style={{ fontSize: 13.5, color: "#9aa6c2" }}>The Stripe publishable key is missing. Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and redeploy.</div>
      </div>
    </main>
  );

  if (!plan.priceUsd) return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ padding: 24, maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Pick a paid plan</div>
        <div style={{ fontSize: 13.5, color: "#9aa6c2", marginBottom: 14 }}>The {plan.name} plan is free - no checkout needed.</div>
        <a href="/account" className="btn">Back to account</a>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh" }}>
      <div className="aurora" aria-hidden="true" />
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1c2238" }}>
        <a href="/account" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18 }}>
          <span style={{ background: "linear-gradient(135deg,#8b5cff,#4f8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AdSpark AI</span>
        </a>
        <a href="/account" className="btn-ghost btn" style={{ padding: "7px 12px", fontSize: 13 }}>← Cancel</a>
      </header>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "28px 18px 60px" }}>
        <div style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Secure checkout</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px" }}>Upgrade to {plan.name}</h1>
          <div style={{ color: "#9aa6c2", fontSize: 14 }}>${plan.priceUsd}/mo · {plan.quota.toLocaleString()} generations, {plan.videos} videos/mo · cancel anytime</div>
        </div>

        {err && <div style={{ color: "#ff6b6b", marginBottom: 12 }}>{err}</div>}

        <div className="gborder" style={{ borderRadius: 16, padding: 1 }}>
          <div style={{ borderRadius: 16, background: "#fff", padding: 4, overflow: "hidden" }}>
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#6b7690", marginTop: 14, textAlign: "center" }}>🔒 Payments processed securely by Stripe. Your card details never touch our servers.</div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#8b97b3" }}>Loading…</main>}>
      <CheckoutInner />
    </Suspense>
  );
}
