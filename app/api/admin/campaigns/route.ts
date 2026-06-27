// app/api/admin/campaigns/route.ts — manage client campaigns. Admin-gated.
//   GET                                  → recent campaigns
//   POST { clientId, name, platform?, objective?, dailyBudgetUsd?, goLive? }
//        → create a campaign doc; if goLive + platform meta + Meta configured + the
//          client has a Meta ad account, also create it (PAUSED) on Meta and store
//          the external id. Otherwise it's saved as a draft with a reason.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";
import { platformReady, createCampaign } from "@/lib/platforms";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const snap = await adminDb().collection(COL.campaigns).limit(100).get();
  const campaigns = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const b = await req.json().catch(() => ({}));
    const clientId = String(b.clientId || "");
    const name = String(b.name || "").slice(0, 200).trim();
    if (!clientId || !name) return NextResponse.json({ ok: false, error: "Client and campaign name are required." }, { status: 400 });

    const platform = String(b.platform || "meta");
    const objective = String(b.objective || "traffic");
    const dailyBudgetUsd = Number(b.dailyBudgetUsd || 0) || null;
    const goLive = !!b.goLive;

    const db = adminDb();
    const clientSnap = await db.collection(COL.clients).doc(clientId).get();
    if (!clientSnap.exists) return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    const client: any = clientSnap.data();

    const now = Date.now();
    let externalId: string | null = null;
    let externalAccountId: string | null = null;
    let status = "draft";
    let warn: string | undefined;

    if (goLive) {
      if (!platformReady(platform)) {
        warn = `Saved as draft — ${platform} isn't configured (add its API keys to go live).`;
      } else {
        const adAccount = client.adAccounts?.[platform] || (platform === "meta" ? process.env.META_AD_ACCOUNT_ID || "" : "");
        try {
          const r = await createCampaign(platform, adAccount, { name, objective });
          externalId = r.id; externalAccountId = r.accountId; status = "paused"; // created PAUSED for review
        } catch (e: any) { warn = `Saved as draft — ${platform} launch failed: ${e.message}`; }
      }
    }

    const doc = { clientId, platform, externalId, externalAccountId, name, objective, status, dailyBudgetUsd, createdAt: now, updatedAt: now };
    const ref = await db.collection(COL.campaigns).add(doc);
    return NextResponse.json({ ok: true, id: ref.id, externalId, status, warn });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
