// app/api/client/route.ts - data for the managed-client portal. Resolves the client by
// ownerUid, else by matching the signed-in user's email (and links ownerUid on first match).
// Returns a client-safe view of their campaigns, blended performance, and reports.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const db = adminDb();
    let client: any = null;
    let clientId = "";

    const byOwner = await db.collection(COL.clients).where("ownerUid", "==", uid).limit(1).get();
    if (!byOwner.empty) { client = byOwner.docs[0].data(); clientId = byOwner.docs[0].id; }
    else {
      let email = "";
      try { email = (await adminAuth().getUser(uid)).email || ""; } catch { /* */ }
      if (email) {
        const byEmail = await db.collection(COL.clients).where("email", "==", email).limit(1).get();
        if (!byEmail.empty) {
          client = byEmail.docs[0].data(); clientId = byEmail.docs[0].id;
          await byEmail.docs[0].ref.set({ ownerUid: uid }, { merge: true });
        }
      }
    }

    if (!client) return NextResponse.json({ ok: true, client: null });

    const [campSnap, repSnap, resSnap] = await Promise.all([
      db.collection(COL.campaigns).where("clientId", "==", clientId).limit(50).get(),
      db.collection(COL.reports).where("clientId", "==", clientId).limit(20).get(),
      db.collection(COL.results).where("clientId", "==", clientId).limit(500).get(),
    ]);

    const campaigns = campSnap.docs.map(d => { const c: any = d.data(); return { name: c.name, platform: c.platform, status: c.status, lastResults: c.lastResults || null }; });
    const reports = repSnap.docs.map(d => { const r: any = d.data(); return { id: d.id, token: r.token, periodStart: r.periodStart, periodEnd: r.periodEnd, roas: r.metrics?.roas || 0, spendUsd: r.metrics?.spendUsd || 0, createdAt: r.createdAt }; }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const results = resSnap.docs.map(d => d.data() as any);
    const spend = results.reduce((s, r) => s + (r.spendUsd || 0), 0);
    const revenue = results.reduce((s, r) => s + (r.revenueUsd || 0), 0);
    const conversions = results.reduce((s, r) => s + (r.conversions || 0), 0);

    return NextResponse.json({
      ok: true,
      client: { name: client.company || client.name, serviceTier: client.serviceTier, status: client.status, platforms: client.platforms || [], mrrUsd: client.mrrUsd || 0 },
      totals: { spendUsd: Math.round(spend), revenueUsd: Math.round(revenue), conversions, roas: spend ? +(revenue / spend).toFixed(2) : 0 },
      campaigns, reports,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
