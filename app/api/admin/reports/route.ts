// app/api/admin/reports/route.ts — client performance reports (the retention engine).
// Admin-gated.
//   GET                              → recent reports
//   POST { clientId, email? }        → build a 30-day report, store it with a share token,
//                                      optionally email the client a link.
// Reports are viewable (no login) at /r/{id}?t={token} via /api/report/[id].
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";
import { sendEmail } from "@/lib/email";
import { reportReadyEmail } from "@/lib/emails";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const snap = await adminDb().collection(COL.reports).limit(100).get();
  const reports = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return NextResponse.json({ ok: true, reports });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const b = await req.json().catch(() => ({}));
    const clientId = String(b.clientId || "");
    if (!clientId) return NextResponse.json({ ok: false, error: "Client id required." }, { status: 400 });

    const db = adminDb();
    const clientSnap = await db.collection(COL.clients).doc(clientId).get();
    if (!clientSnap.exists) return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    const client: any = clientSnap.data();

    const now = Date.now();
    const since = now - 30 * 86400000;
    const rs = await db.collection(COL.results).where("clientId", "==", clientId).limit(1000).get();
    const results = rs.docs.map(d => d.data() as any).filter(r => (r.ingestedAt || 0) >= since);

    const sum = (f: string) => results.reduce((s, r) => s + (Number(r[f]) || 0), 0);
    const spend = sum("spendUsd"), revenue = sum("revenueUsd"), conversions = sum("conversions");
    const impressions = sum("impressions"), clicks = sum("clicks");
    const metrics = {
      spendUsd: Math.round(spend), revenueUsd: Math.round(revenue), conversions,
      impressions, clicks,
      roas: spend ? +(revenue / spend).toFixed(2) : 0,
      ctr: impressions ? +((clicks / impressions) * 100).toFixed(2) : 0,
      cpaUsd: conversions ? +(spend / conversions).toFixed(2) : 0,
    };

    // Top-performing angle (by hook) for the narrative.
    const byHook: Record<string, { spend: number; rev: number }> = {};
    for (const r of results) { const k = r.tags?.hook; if (!k) continue; const x = byHook[k] || (byHook[k] = { spend: 0, rev: 0 }); x.spend += r.spendUsd || 0; x.rev += r.revenueUsd || 0; }
    const topHook = Object.entries(byHook).map(([k, v]) => ({ hook: k, roas: v.spend ? +(v.rev / v.spend).toFixed(2) : 0 })).sort((a, b) => b.roas - a.roas)[0];

    const campSnap = await db.collection(COL.campaigns).where("clientId", "==", clientId).limit(50).get();
    const campaigns = campSnap.docs.map(d => { const c: any = d.data(); return { name: c.name, platform: c.platform, status: c.status, lastResults: c.lastResults || null }; });

    const clientName = client.company || client.name || "your brand";
    const summary = results.length
      ? `Over the last 30 days we ran $${metrics.spendUsd.toLocaleString()} in ad spend for ${clientName} across ${campaigns.length} campaign(s), driving ${conversions} conversions at a ${metrics.roas}x ROAS${topHook ? ` — your best-performing angle was "${topHook.hook}"` : ""}.`
      : `We're setting up ${clientName}'s campaigns. Your first performance report will populate here as results come in.`;

    const token = randomUUID();
    const periodStart = new Date(since).toISOString().slice(0, 10);
    const periodEnd = new Date(now).toISOString().slice(0, 10);
    const reportDoc = { clientId, clientName, periodStart, periodEnd, metrics, campaigns, summary, token, sentAt: null as number | null, createdAt: now };
    const ref = await db.collection(COL.reports).add(reportDoc);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}/r/${ref.id}?t=${token}`;

    if (b.email && client.email) {
      const e = reportReadyEmail(clientName, url, summary);
      await sendEmail({ to: client.email, subject: e.subject, html: e.html });
      await ref.set({ sentAt: Date.now() }, { merge: true });
    }

    return NextResponse.json({ ok: true, id: ref.id, token, url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
