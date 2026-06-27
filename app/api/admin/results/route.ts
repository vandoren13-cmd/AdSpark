// app/api/admin/results/route.ts — the performance-database pipeline (the moat).
// Admin-gated. Attributes a results row to a CREATIVE (preferred — carries the
// vertical/hook/format/offer tags that power insights) or to a CAMPAIGN.
//   POST { creativeId, impressions, clicks, spend, conversions, revenue } → per-creative (tagged)
//   POST { campaignId, ...metrics }                                       → per-campaign
//   POST { campaignId, action: "sync" }                                   → pull from Meta
// Manual entry means the moat accumulates from client #1, before any platform API.
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
    const db = adminDb();
    const now = Date.now();

    let creativeId = String(b.creativeId || "");
    let campaignId = String(b.campaignId || "");
    let clientId = "";
    let platform = String(b.platform || "");
    let externalId: string | null = null;
    let tags: any = null;

    if (creativeId) {
      const cr = await db.collection(COL.creatives).doc(creativeId).get();
      if (!cr.exists) return NextResponse.json({ ok: false, error: "Creative not found." }, { status: 404 });
      const c: any = cr.data();
      tags = c.tags || null;
      clientId = c.clientId || "";
      campaignId = campaignId || c.campaignId || "";
    }
    if (campaignId) {
      const cp = await db.collection(COL.campaigns).doc(campaignId).get();
      if (cp.exists) { const c: any = cp.data(); clientId = clientId || c.clientId || ""; platform = platform || c.platform || ""; externalId = c.externalId || null; }
    }
    if (!creativeId && !campaignId) {
      return NextResponse.json({ ok: false, error: "Provide a creativeId or campaignId." }, { status: 400 });
    }

    let m: { impressions: number; clicks: number; spend: number; conversions: number; revenue: number };
    if (b.action === "sync") {
      if (!externalId) return NextResponse.json({ ok: false, error: "Campaign isn't launched on a platform yet." }, { status: 400 });
      if (platform === "meta") {
        if (!metaReady()) return NextResponse.json({ ok: false, error: "Meta isn't configured." }, { status: 400 });
        m = await metaGetInsights(externalId);
      } else {
        return NextResponse.json({ ok: false, error: `Result sync for "${platform}" isn't wired yet.` }, { status: 400 });
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

    const result: any = {
      creativeId: creativeId || "", campaignId: campaignId || "", clientId, platform,
      date, impressions: m.impressions, clicks: m.clicks, spendUsd: m.spend, conversions: m.conversions,
      revenueUsd: m.revenue, ctr, cpaUsd, roas, ingestedAt: now,
    };
    if (tags) result.tags = tags; // attribute performance to what converts

    await db.collection(COL.results).add(result);
    if (campaignId) {
      await db.collection(COL.campaigns).doc(campaignId).set(
        { lastResults: { spendUsd: m.spend, roas, conversions: m.conversions, ctr, date }, updatedAt: now },
        { merge: true },
      );
    }
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
