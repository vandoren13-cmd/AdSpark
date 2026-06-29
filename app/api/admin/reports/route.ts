// app/api/admin/reports/route.ts - client performance reports (the retention engine).
// Admin-gated.
//   GET                              → recent reports
//   POST { clientId, email? }        → build a 30-day report, store it with a share token,
//                                      optionally email the client a link.
// Reports are viewable (no login) at /r/{id}?t={token} via /api/report/[id].
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";
import { buildAndStoreReport } from "@/lib/report";

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

    const r = await buildAndStoreReport(clientId, { email: !!b.email });
    if (!r) return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });

    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
