// app/api/portal/route.ts — open the Stripe Billing Portal so a customer can manage
// or cancel their subscription and update payment details.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const u: any = (await adminDb().collection(COL.users).doc(uid).get()).data() || {};
    if (!u.stripeCustomerId) {
      return NextResponse.json({ ok: false, error: "No billing account yet — upgrade to a paid plan first." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe().billingPortal.sessions.create({
      customer: u.stripeCustomerId,
      return_url: `${appUrl}/account`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Could not open billing portal." }, { status: 500 });
  }
}
