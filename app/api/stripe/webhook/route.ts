// app/api/stripe/webhook/route.ts — Stripe → AdSpark sync. Verifies the signature
// against STRIPE_WEBHOOK_SECRET, then mirrors subscription state onto the user doc
// (plan / subStatus / ids). Point a Stripe webhook endpoint at /api/stripe/webhook
// for: customer.subscription.created, .updated, .deleted.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";
import { stripe, planForPriceId } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text(); // raw body required for signature verification

  let event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e: any) {
    return NextResponse.json({ error: `Invalid signature: ${e?.message}` }, { status: 400 });
  }

  const db = adminDb();
  // Update by metadata uid when present, else look the user up by Stripe customer id.
  async function updateUser(uid: string | null | undefined, customerId: string | null | undefined, fields: any) {
    let ref: any = null;
    if (uid) ref = db.collection(COL.users).doc(uid);
    else if (customerId) {
      const q = await db.collection(COL.users).where("stripeCustomerId", "==", customerId).limit(1).get();
      if (!q.empty) ref = q.docs[0].ref;
    }
    if (ref) await ref.set({ ...fields, updatedAt: Date.now() }, { merge: true });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const active = sub.status === "active" || sub.status === "trialing";
        await updateUser(sub.metadata?.uid, sub.customer, {
          plan: active ? planForPriceId(priceId) : "free",
          stripeSubId: sub.id,
          subStatus: sub.status,
          stripeCustomerId: sub.customer,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        await updateUser(sub.metadata?.uid, sub.customer, { plan: "free", subStatus: "canceled" });
        break;
      }
      default:
        break;
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
