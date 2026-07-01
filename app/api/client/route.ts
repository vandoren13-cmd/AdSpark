// app/api/client/route.ts - data + actions for the managed-client portal.
//   GET  → the client's campaigns, performance, reports, creative approvals, messages
//   POST → client actions: approve / request_changes on a creative, or send a message
// Resolves the client by ownerUid, else by matching the signed-in user's email.
import { NextRequest, NextResponse } from "next/server";
import { uidFromRequest, adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

// Resolve the signed-in user to their managed client (and link ownerUid on first match).
async function resolveClient(uid: string): Promise<{ clientId: string; client: any } | null> {
  const db = adminDb();
  const byOwner = await db.collection(COL.clients).where("ownerUid", "==", uid).limit(1).get();
  if (!byOwner.empty) return { clientId: byOwner.docs[0].id, client: byOwner.docs[0].data() };
  let email = "";
  try { email = (await adminAuth().getUser(uid)).email || ""; } catch { /* */ }
  if (email) {
    const byEmail = await db.collection(COL.clients).where("email", "==", email).limit(1).get();
    if (!byEmail.empty) {
      await byEmail.docs[0].ref.set({ ownerUid: uid }, { merge: true });
      return { clientId: byEmail.docs[0].id, client: byEmail.docs[0].data() };
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const db = adminDb();
    const resolved = await resolveClient(uid);
    if (!resolved) return NextResponse.json({ ok: true, client: null });
    const { clientId, client } = resolved;

    const [campSnap, repSnap, resSnap, creSnap, msgSnap] = await Promise.all([
      db.collection(COL.campaigns).where("clientId", "==", clientId).limit(50).get(),
      db.collection(COL.reports).where("clientId", "==", clientId).limit(20).get(),
      db.collection(COL.results).where("clientId", "==", clientId).limit(500).get(),
      db.collection(COL.creatives).where("clientId", "==", clientId).limit(100).get(),
      db.collection(COL.messages).where("clientId", "==", clientId).limit(100).get(),
    ]);

    const campaigns = campSnap.docs.map(d => { const c: any = d.data(); return { name: c.name, platform: c.platform, status: c.status, lastResults: c.lastResults || null }; });
    const reports = repSnap.docs.map(d => { const r: any = d.data(); return { id: d.id, token: r.token, periodStart: r.periodStart, periodEnd: r.periodEnd, roas: r.metrics?.roas || 0, spendUsd: r.metrics?.spendUsd || 0, createdAt: r.createdAt }; }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const results = resSnap.docs.map(d => d.data() as any);
    const spend = results.reduce((s, r) => s + (r.spendUsd || 0), 0);
    const revenue = results.reduce((s, r) => s + (r.revenueUsd || 0), 0);
    const conversions = results.reduce((s, r) => s + (r.conversions || 0), 0);

    // Creatives awaiting the client's decision (+ recently decided, for context).
    const creatives = creSnap.docs
      .map(d => { const c: any = d.data(); return { id: d.id, type: c.type, assetUrl: c.assetUrl || null, copy: c.copy || null, approvalStatus: c.approvalStatus || "none", clientNote: c.clientNote || null, createdAt: c.createdAt || 0 }; })
      .filter(c => c.approvalStatus && c.approvalStatus !== "none")
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const messages = msgSnap.docs.map(d => { const m: any = d.data(); return { id: d.id, from: m.from, text: m.text, createdAt: m.createdAt || 0 }; }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return NextResponse.json({
      ok: true,
      client: { name: client.company || client.name, serviceTier: client.serviceTier, status: client.status, platforms: client.platforms || [], mrrUsd: client.mrrUsd || 0 },
      totals: { spendUsd: Math.round(spend), revenueUsd: Math.round(revenue), conversions, roas: spend ? +(revenue / spend).toFixed(2) : 0 },
      campaigns, reports, creatives, messages,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });

    const db = adminDb();
    const resolved = await resolveClient(uid);
    if (!resolved) return NextResponse.json({ ok: false, error: "No managed account found." }, { status: 404 });
    const { clientId } = resolved;

    const b = await req.json().catch(() => ({}));
    const action = String(b.action || "");

    if (action === "message") {
      const text = String(b.text || "").slice(0, 2000).trim();
      if (!text) return NextResponse.json({ ok: false, error: "Message is empty." }, { status: 400 });
      await db.collection(COL.messages).add({ clientId, from: "client", uid, text, readByOperator: false, readByClient: true, createdAt: Date.now() });
      return NextResponse.json({ ok: true });
    }

    if (action === "approve" || action === "request_changes") {
      const creativeId = String(b.creativeId || "");
      if (!creativeId) return NextResponse.json({ ok: false, error: "creativeId required." }, { status: 400 });
      const ref = db.collection(COL.creatives).doc(creativeId);
      const snap = await ref.get();
      if (!snap.exists || (snap.data() as any).clientId !== clientId) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
      await ref.set({
        approvalStatus: action === "approve" ? "approved" : "changes_requested",
        clientNote: action === "request_changes" ? String(b.note || "").slice(0, 1000) : null,
        decidedAt: Date.now(),
      }, { merge: true });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
