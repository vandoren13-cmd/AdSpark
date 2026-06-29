// app/api/checkout/route.ts - start a Stripe Checkout session for a self-serve plan.
// Verifies the user, ensures a Stripe customer exists (stored on the user doc), and
// returns the hosted checkout URL for the client to redirect to.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";
import { stripe, priceIdForPlan } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const { plan } = await req.json().catch(() => ({}));
    const priceId = priceIdForPlan(String(plan || ""));
    if (!priceId) return NextResponse.json({ ok: false, error: "That plan isn't available for checkout yet." }, { status: 400 });

    const db = adminDb();
    const userRef = db.collection(COL.users).doc(uid);
    const u: any = (await userRef.get()).data() || {};

    let email: string | undefined = u.email || undefined;
    if (!email) { try { email = (await adminAuth().getUser(uid)).email || undefined; } catch { /* */ } }

    let customerId: string | undefined = u.stripeCustomerId || undefined;
    if (!customerId) {
      const c = await stripe().customers.create({ email, metadata: { uid } });
      customerId = c.id;
      await userRef.set({ stripeCustomerId: customerId, email: email || null, updatedAt: Date.now() }, { merge: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: uid,
      subscription_data: { metadata: { uid } },
      allow_promotion_codes: true,
      success_url: `${appUrl}/account?checkout=success`,
      cancel_url: `${appUrl}/account?checkout=cancel`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Checkout failed." }, { status: 500 });
  }
}
