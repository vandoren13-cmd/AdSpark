// app/api/video/route.ts - start an AI video ad (avatar/UGC via HeyGen, or cinematic via
// fal). Async: creates the provider job, stores a "processing" doc, returns an id the client
// polls at /api/video/[id]. Avatar videos auto-write a script from the brief.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { planFor } from "@/lib/plans";
import { AdBrief, generateVideoScript } from "@/lib/ai";
import { createVideo, videoReady, type VideoKind } from "@/lib/video";
import { rateLimit } from "@/lib/ratelimit";
import { logEvent } from "@/lib/events";
import { COL } from "@/lib/collections";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const maxDuration = 60;

const periodKey = () => new Date().toISOString().slice(0, 7);

export async function GET(req: NextRequest) {
  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  const gs = await adminDb().collection(COL.videos).where("uid", "==", uid).limit(50).get();
  const videos = gs.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 20);
  return NextResponse.json({ ok: true, videos });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const rl = await rateLimit(`video:${uid}`, 10, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests - give it a moment." }, { status: 429 });

    const b = await req.json().catch(() => ({}));
    const kind: VideoKind = b.kind === "product" ? "product" : "avatar";
    if (!videoReady(kind)) {
      return NextResponse.json({ ok: false, error: kind === "avatar" ? "Avatar video isn't configured yet (add HEYGEN_API_KEY)." : "Cinematic video isn't configured yet (add FAL_KEY)." }, { status: 503 });
    }

    const db = adminDb();
    const userRef = db.collection(COL.users).doc(uid);
    const snap = await userRef.get();
    const u: any = snap.exists ? snap.data() : {};
    const plan = planFor(u.plan);
    const pk = periodKey();
    const videosUsed = u.videoPeriodKey === pk ? (u.videosUsed || 0) : 0;
    if (videosUsed >= plan.videos) {
      return NextResponse.json({ ok: false, error: `You've used all ${plan.videos} videos on the ${plan.name} plan this month. Upgrade for more.`, remaining: 0 }, { status: 402 });
    }

    const brief: AdBrief = {
      brand: String(b.brand || "").slice(0, 200), product: String(b.product || "").slice(0, 800),
      goal: String(b.goal || "drive conversions").slice(0, 200), platform: String(b.platform || "Instagram").slice(0, 40),
      tone: String(b.tone || "bold & punchy").slice(0, 80), audience: String(b.audience || "").slice(0, 300),
    };
    if (!brief.product.trim()) return NextResponse.json({ ok: false, error: "Describe your product/offer." }, { status: 400 });

    let opts: any; let script: any = null; let prompt = "";
    if (kind === "avatar") {
      script = await generateVideoScript(brief, Number(b.seconds) || 20);
      opts = { script: script.voiceover || script.hook, aspectRatio: b.aspectRatio || "9:16" };
    } else {
      prompt = String(b.prompt || "").trim() || `${brief.product}. ${brief.tone} ${brief.platform} product ad - cinematic, high-contrast, scroll-stopping. No on-screen text, no logos.`;
      opts = { prompt, imageUrl: b.imageUrl || undefined, aspectRatio: b.aspectRatio || "9:16", duration: b.duration || "8s" };
    }

    const job = await createVideo(kind, opts);
    if (!job) return NextResponse.json({ ok: false, error: "Video engine unavailable." }, { status: 503 });

    const now = Date.now();
    const ref = db.collection(COL.videos).doc();
    await ref.set({ uid, kind, brief, script, prompt, provider: job.provider, jobId: job.jobId, status: "processing", url: null, error: null, createdAt: now, updatedAt: now });

    await userRef.set({ videoPeriodKey: pk, videosUsed: (u.videoPeriodKey === pk ? FieldValue.increment(1) : 1), updatedAt: now, createdAt: u.createdAt || now }, { merge: true });
    await logEvent("video_created", { uid, props: { kind, plan: plan.id } });

    return NextResponse.json({ ok: true, id: ref.id, status: "processing", script });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Video generation failed." }, { status: 500 });
  }
}
