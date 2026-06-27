// app/api/generate/route.ts — the AdSpark generation endpoint.
// Verifies the user → enforces monthly quota → generates copy + images → saves
// history → decrements quota. Returns the ad set + remaining quota.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { planFor } from "@/lib/plans";
import { generateAdSet, AdBrief } from "@/lib/ai";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const maxDuration = 120; // image gen can take a while

const periodKey = () => new Date().toISOString().slice(0, 7); // "YYYY-MM"

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const db = adminDb();
    const userRef = db.collection("adspark_users").doc(uid);
    const snap = await userRef.get();
    const u: any = snap.exists ? snap.data() : {};
    const plan = planFor(u.plan);

    // Monthly quota window — reset the counter when the period rolls over.
    const pk = periodKey();
    const used = u.periodKey === pk ? (u.used || 0) : 0;
    if (used >= plan.quota) {
      return NextResponse.json({ ok: false, error: `You've used all ${plan.quota} generations on the ${plan.name} plan this month. Upgrade for more.`, remaining: 0, plan: plan.id }, { status: 402 });
    }

    const b = await req.json().catch(() => ({}));
    const brief: AdBrief = {
      brand: String(b.brand || "").slice(0, 200),
      product: String(b.product || "").slice(0, 800),
      goal: String(b.goal || "drive conversions").slice(0, 200),
      platform: String(b.platform || "Instagram").slice(0, 40),
      tone: String(b.tone || "bold & punchy").slice(0, 80),
      audience: String(b.audience || "").slice(0, 300),
    };
    if (!brief.product.trim()) return NextResponse.json({ ok: false, error: "Describe your product/offer." }, { status: 400 });

    const adSet = await generateAdSet(brief, plan.variants, plan.images, plan.imageQuality);
    if (!adSet.variations.length) return NextResponse.json({ ok: false, error: "Generation failed — please try again." }, { status: 502 });

    // Persist history (text only — images are returned to the client; Storage upload TBD).
    const now = Date.now();
    const genRef = db.collection("adspark_generations").doc();
    await genRef.set({
      uid, brief, variations: adSet.variations, creativeBrief: adSet.creativeBrief,
      imagePrompt: adSet.imagePrompt, imageCount: adSet.images.length, createdAt: now,
    });

    // Decrement quota (atomic).
    await userRef.set({
      plan: plan.id, periodKey: pk, used: (u.periodKey === pk ? FieldValue.increment(1) : 1),
      email: u.email || null, updatedAt: now, createdAt: u.createdAt || now,
    }, { merge: true });

    return NextResponse.json({
      ok: true, id: genRef.id, adSet,
      plan: plan.id, remaining: Math.max(0, plan.quota - used - 1), quota: plan.quota,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Generation failed" }, { status: 500 });
  }
}
