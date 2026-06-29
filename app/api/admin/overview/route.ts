// app/api/admin/overview/route.ts - back-office dashboard data: headline stats plus
// recent leads, clients, and global generation activity. Admin-gated.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

const byNewest = (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0);

export async function GET(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const db = adminDb();
    const d30 = Date.now() - 30 * 86400000;

    const [usersC, leadsNewC, clientsC, creativesC, gensTotalC, gens30dC, events30dC] = await Promise.all([
      db.collection(COL.users).count().get(),
      db.collection(COL.leads).where("status", "==", "new").count().get(),
      db.collection(COL.clients).count().get(),
      db.collection(COL.creatives).count().get(),
      db.collection(COL.generations).count().get(),
      db.collection(COL.generations).where("createdAt", ">=", d30).count().get(),
      db.collection(COL.events).where("createdAt", ">=", d30).count().get(),
    ]);

    const [leadsSnap, clientsSnap, campaignsSnap, creativesSnap, resultsSnap, reportsSnap, eventsSnap, gensSnap] = await Promise.all([
      db.collection(COL.leads).limit(100).get(),
      db.collection(COL.clients).limit(100).get(),
      db.collection(COL.campaigns).limit(100).get(),
      db.collection(COL.creatives).limit(100).get(),
      db.collection(COL.results).limit(500).get(),
      db.collection(COL.reports).limit(50).get(),
      db.collection(COL.events).limit(1000).get(),
      db.collection(COL.generations).limit(60).get(),
    ]);

    // Funnel: top events by volume (last 1000).
    const events = eventsSnap.docs.map(d => d.data() as any);
    const evCounts: Record<string, number> = {};
    for (const e of events) evCounts[e.name] = (evCounts[e.name] || 0) + 1;
    const funnel = Object.entries(evCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const leads = leadsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest).slice(0, 30);
    const clients = clientsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest);
    const campaigns = campaignsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest).slice(0, 40);
    const creatives = creativesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest).slice(0, 40);
    const reports = reportsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest).slice(0, 20);
    const generations = gensSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort(byNewest).slice(0, 15);
    const mrr = clients.reduce((s, c: any) => s + (c.status === "active" ? (c.mrrUsd || 0) : 0), 0);

    // The moat readout: aggregate results by what converts. Group by a tag dimension
    // (hook/format/vertical) or by platform, returning ROAS/CPA/spend per bucket.
    const results = resultsSnap.docs.map(d => d.data() as any);
    const agg = (dim: "hook" | "format" | "vertical" | "platform") => {
      const m: Record<string, { count: number; spend: number; rev: number; conv: number }> = {};
      for (const r of results) {
        const key = dim === "platform" ? (r.platform || "") : (r.tags?.[dim] || "");
        if (!key) continue;
        const b = m[key] || (m[key] = { count: 0, spend: 0, rev: 0, conv: 0 });
        b.count++; b.spend += r.spendUsd || 0; b.rev += r.revenueUsd || 0; b.conv += r.conversions || 0;
      }
      return Object.entries(m).map(([key, v]) => ({
        key, count: v.count, spendUsd: Math.round(v.spend),
        roas: v.spend ? +(v.rev / v.spend).toFixed(2) : 0,
        cpaUsd: v.conv ? +(v.spend / v.conv).toFixed(2) : 0,
      })).sort((a, b) => b.roas - a.roas).slice(0, 6);
    };
    const totSpend = results.reduce((s, r) => s + (r.spendUsd || 0), 0);
    const totRev = results.reduce((s, r) => s + (r.revenueUsd || 0), 0);
    const insights = {
      byHook: agg("hook"), byFormat: agg("format"), byVertical: agg("vertical"), byPlatform: agg("platform"),
      totals: { spendUsd: Math.round(totSpend), revenueUsd: Math.round(totRev), roas: totSpend ? +(totRev / totSpend).toFixed(2) : 0, results: results.length },
    };

    return NextResponse.json({
      ok: true,
      stats: {
        users: usersC.data().count,
        leadsNew: leadsNewC.data().count,
        clients: clientsC.data().count,
        creatives: creativesC.data().count,
        gensTotal: gensTotalC.data().count,
        gens30d: gens30dC.data().count,
        events30d: events30dC.data().count,
        mrr,
      },
      insights, funnel, leads, clients, campaigns, creatives, reports, generations,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to load." }, { status: 500 });
  }
}
