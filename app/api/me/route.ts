// app/api/me/route.ts — the signed-in user's plan, usage, and recent generations.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb } from "@/lib/firebaseAdmin";
import { planFor } from "@/lib/plans";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";
const periodKey = () => new Date().toISOString().slice(0, 7);

export async function GET(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
    const db = adminDb();
    const u: any = (await db.collection(COL.users).doc(uid).get()).data() || {};
    const plan = planFor(u.plan);
    const used = u.periodKey === periodKey() ? (u.used || 0) : 0;

    // Recent history (single-field query → no composite index needed).
    let history: any[] = [];
    try {
      const gs = await db.collection(COL.generations).where("uid", "==", uid).limit(50).get();
      history = gs.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 20);
    } catch { /* index/empty */ }

    return NextResponse.json({
      ok: true,
      plan: { id: plan.id, name: plan.name, quota: plan.quota, priceUsd: plan.priceUsd },
      used, remaining: Math.max(0, plan.quota - used),
      serviceStatus: u.serviceStatus || "none",
      history,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
