// app/api/cron/weekly-reports/route.ts — generate + email a 30-day report for every active
// client. Designed for Vercel Cron (which sends Authorization: Bearer ${CRON_SECRET}).
// Also accepts ?secret= for manual runs. No-ops safely if CRON_SECRET is unset.
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";
import { buildAndStoreReport } from "@/lib/report";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const provided = new URL(req.url).searchParams.get("secret") || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!secret || provided !== secret) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const snap = await adminDb().collection(COL.clients).where("status", "==", "active").limit(200).get();
  let sent = 0;
  for (const d of snap.docs) {
    try { await buildAndStoreReport(d.id, { email: true }); sent++; } catch { /* skip a failing client, continue */ }
  }
  return NextResponse.json({ ok: true, activeClients: snap.size, reportsSent: sent });
}
