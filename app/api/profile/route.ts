// app/api/profile/route.ts - save the signed-in user's display name + brand kit.
// The brand kit is applied to every generation (see /api/generate + lib/ai.ts) so
// output stays on-brand. Password/email changes happen client-side via Firebase Auth.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

const clip = (v: any, n: number) => String(v ?? "").slice(0, n);

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const patch: any = { updatedAt: Date.now() };

    if (typeof b.displayName === "string") patch.displayName = clip(b.displayName, 80);

    if (b.brandKit && typeof b.brandKit === "object") {
      patch.brandKit = {
        name: clip(b.brandKit.name, 120),
        voice: clip(b.brandKit.voice, 300),
        benefits: clip(b.brandKit.benefits, 800),
        avoid: clip(b.brandKit.avoid, 400),
        audience: clip(b.brandKit.audience, 300),
        platform: clip(b.brandKit.platform, 40),
      };
    }

    await adminDb().collection(COL.users).doc(uid).set(patch, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to save." }, { status: 500 });
  }
}
