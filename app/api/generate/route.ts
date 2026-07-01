// app/api/generate/route.ts - the AdSpark generation endpoint.
// Verifies the user → enforces monthly quota → generates copy + images → saves
// history → decrements quota. Returns the ad set + remaining quota.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { planFor } from "@/lib/plans";
import { generateAdSet, AdBrief } from "@/lib/ai";
import { uploadPng } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { welcomeEmail, quotaWarningEmail } from "@/lib/emails";
import { complianceRecord } from "@/lib/compliance";
import { rateLimit } from "@/lib/ratelimit";
import { logEvent } from "@/lib/events";
import { COL } from "@/lib/collections";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const maxDuration = 120; // image gen can take a while

const periodKey = () => new Date().toISOString().slice(0, 7); // "YYYY-MM"

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    // Burst protection (plan quota is monthly; this caps abuse/cost spikes per minute).
    const rl = await rateLimit(`gen:${uid}`, 20, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests - give it a moment and try again." }, { status: 429 });

    const db = adminDb();
    const userRef = db.collection(COL.users).doc(uid);
    const snap = await userRef.get();
    const u: any = snap.exists ? snap.data() : {};
    const isNewUser = !snap.exists;
    const plan = planFor(u.plan);

    // Monthly quota window - reset the counter when the period rolls over.
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

    const adSet = await generateAdSet(brief, plan.variants, plan.images, plan.imageQuality, u.brandKit);
    if (!adSet.variations.length) return NextResponse.json({ ok: false, error: "Generation failed - please try again." }, { status: 502 });

    // Persist images to Firebase Storage so they survive refresh and power history,
    // the client portal, and the creative library. Falls back to the inline data URL
    // if an upload fails, so a Storage hiccup never loses a paid generation.
    const now = Date.now();
    const genRef = db.collection(COL.generations).doc();
    const storedImages: string[] = [];
    for (let i = 0; i < adSet.images.length; i++) {
      try { storedImages.push(await uploadPng(`generations/${uid}/${genRef.id}/${i}.png`, adSet.images[i])); }
      catch { storedImages.push(adSet.images[i]); }
    }
    await genRef.set({
      uid, brief, variations: adSet.variations, creativeBrief: adSet.creativeBrief,
      imagePrompt: adSet.imagePrompt, images: storedImages, imageCount: storedImages.length,
      tags: adSet.tags, quality: plan.imageQuality,
      compliance: complianceRecord({ images: storedImages.length }),
      createdAt: now,
    });
    const responseSet = { ...adSet, images: storedImages };

    // Decrement quota (atomic).
    await userRef.set({
      plan: plan.id, periodKey: pk, used: (u.periodKey === pk ? FieldValue.increment(1) : 1),
      email: u.email || null, updatedAt: now, createdAt: u.createdAt || now,
    }, { merge: true });

    // Low-quota warning: once per period, when they cross 80% (but aren't fully out).
    const newUsed = used + 1;
    if (newUsed >= Math.ceil(plan.quota * 0.8) && newUsed < plan.quota && u.quotaWarnedPeriod !== pk) {
      try {
        const email = u.email || (await adminAuth().getUser(uid)).email;
        if (email) {
          const w = quotaWarningEmail(plan.name, newUsed, plan.quota);
          await sendEmail({ to: email, subject: w.subject, html: w.html, idempotencyKey: `quota:${uid}:${pk}` });
          await userRef.set({ quotaWarnedPeriod: pk }, { merge: true });
        }
      } catch { /* best-effort */ }
    }

    // Welcome the user on their first generation (best-effort; no-ops until email configured).
    if (isNewUser) {
      try {
        const email = u.email || (await adminAuth().getUser(uid)).email;
        if (email) { const w = welcomeEmail(); await sendEmail({ to: email, subject: w.subject, html: w.html, idempotencyKey: `welcome:${uid}` }); }
      } catch { /* */ }
      await logEvent("signup", { uid });
    }
    await logEvent("generation_created", { uid, props: { platform: brief.platform, plan: plan.id } });

    return NextResponse.json({
      ok: true, id: genRef.id, adSet: responseSet,
      plan: plan.id, remaining: Math.max(0, plan.quota - used - 1), quota: plan.quota,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Generation failed" }, { status: 500 });
  }
}
