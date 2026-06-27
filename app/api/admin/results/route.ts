// app/api/admin/results/route.ts — the performance-database pipeline (the moat).
// Admin-gated. Writes a results row for a campaign and rolls a summary onto it.
//   POST { campaignId, action: "sync" }                         → pull from the platform (Meta)
//   POST { campaignId, impressions, clicks, spend, conversions, revenue }  → manual entry
// Manual entry means the moat can start accumulating from client #1, before any
// platform API is wired.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";
import { metaReady, metaGetInsights } from "@/lib/platforms/meta";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const b = await req.json().catch(() => ({}));
    const campaignId = String(b.campaignId || "");
    if (!campaignId) return NextResponse.json({ ok: false, error: "Campaign id required." }, { status: 400 });

    const db = adminDb();
    const cRef = db.collection(COL.campaigns).doc(campaignId);
    const cSnap = await cRef.get();
    if (!cSnap.exists) return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });
    const camp: any = cSnap.data();

    const now = Date.now();
    let m: { impressions: number; clicks: number; spend: number; conversions: number; revenue: number };

    if (b.action === "sync") {
      if (!camp.externalId) return NextResponse.json({ ok: false, error: "Campaign isn't launched on a platform yet." }, { status: 400 });
      if (camp.platform === "meta") {
        if (!metaReady()) return NextResponse.json({ ok: false, error: "Meta isn't configured." }, { status: 400 });
        m = await metaGetInsights(camp.externalId);
      } else {
        return NextResponse.json({ ok: false, error: `Result sync for "${camp.platform}" isn't wired yet.` }, { status: 400 });
      }
    } else {
      m = {
        impressions: Number(b.impressions || 0), clicks: Number(b.clicks || 0),
        spend: Number(b.spend || 0), conversions: Number(b.conversions || 0), revenue: Number(b.revenue || 0),
      };
    }

    const ctr = m.impressions ? m.clicks / m.impressions : 0;
    const cpaUsd = m.conversions ? m.spend / m.conversions : 0;
    const roas = m.spend ? m.revenue / m.spend : 0;
    const date = new Date(now).toISOString().slice(0, 10);

    const result = {
      creativeId: String(b.creativeId || ""), campaignId, clientId: camp.clientId, platform: camp.platform,
      date, impressions: m.impressions, clicks: m.clicks, spendUsd: m.spend, conversions: m.conversions,
      revenueUsd: m.revenue, ctr, cpaUsd, roas, ingestedAt: now,
    };
    await db.collection(COL.results).add(result);
    await cRef.set({ lastResults: { spendUsd: m.spend, roas, conversions: m.conversions, ctr, date }, updatedAt: now }, { merge: true });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
