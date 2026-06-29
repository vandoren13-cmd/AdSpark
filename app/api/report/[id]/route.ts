// app/api/report/[id]/route.ts - PUBLIC report fetch (no login). Token-gated: the caller
// must present the share token (?t=) that matches the report. Returns only client-safe fields.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = new URL(req.url).searchParams.get("t") || "";
    const snap = await adminDb().collection(COL.reports).doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Report not found." }, { status: 404 });
    const r: any = snap.data();
    if (!token || token !== r.token) return NextResponse.json({ ok: false, error: "Invalid or missing report link." }, { status: 403 });

    return NextResponse.json({
      ok: true,
      report: {
        clientName: r.clientName, periodStart: r.periodStart, periodEnd: r.periodEnd,
        metrics: r.metrics, campaigns: r.campaigns, summary: r.summary, createdAt: r.createdAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
