// app/api/admin/creatives/route.ts — the creative library. Admin-gated.
// Promote a generation into a tracked creative (inherits its vertical/hook/format/offer
// tags), or create one manually. Logging results against a creative is what attributes
// performance to what converts (see /api/admin/results + /api/admin/overview insights).
//   GET                                              → recent creatives
//   POST { fromGenerationId, variationIndex?, clientId?, campaignId? }  → from a generation
//   POST { type?, assetUrl?, copy?, tags?, clientId?, campaignId? }     → manual
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const snap = await adminDb().collection(COL.creatives).limit(100).get();
  const creatives = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return NextResponse.json({ ok: true, creatives });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const b = await req.json().catch(() => ({}));
    const db = adminDb();
    const now = Date.now();
    const fromGenerationId = String(b.fromGenerationId || "");

    let doc: any;
    if (fromGenerationId) {
      const g = await db.collection(COL.generations).doc(fromGenerationId).get();
      if (!g.exists) return NextResponse.json({ ok: false, error: "Generation not found." }, { status: 404 });
      const gen: any = g.data();
      const idx = Math.max(0, Number(b.variationIndex || 0));
      doc = {
        clientId: b.clientId || null, campaignId: b.campaignId || null, generationId: fromGenerationId,
        type: "image", assetUrl: (gen.images && gen.images[0]) || null, copy: (gen.variations && gen.variations[idx]) || null,
        tags: gen.tags || {}, aiDisclosed: false, status: "draft", createdAt: now,
      };
    } else {
      doc = {
        clientId: b.clientId || null, campaignId: b.campaignId || null, generationId: null,
        type: String(b.type || "image"), assetUrl: b.assetUrl || null, copy: b.copy || null,
        tags: b.tags || {}, aiDisclosed: false, status: "draft", createdAt: now,
      };
    }

    const ref = await db.collection(COL.creatives).add(doc);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
