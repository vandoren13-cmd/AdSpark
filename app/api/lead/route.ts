// app/api/lead/route.ts — captures "done-for-you" service inquiries (the funnel → service
// hand-off). Writes to Firestore `adspark_leads`. Accepts anonymous or signed-in submissions
// (if a valid token is present we attach the uid). No quota, no auth required.
import { NextRequest, NextResponse } from "next/server";
import { adminDb, uidFromRequest } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  try {
    const uid = await uidFromRequest(req); // null if not signed in — that's fine
    const b = await req.json().catch(() => ({}));

    const email = String(b.email || "").trim().slice(0, 200);
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
    }

    const lead = {
      uid: uid || null,
      name: String(b.name || "").slice(0, 200),
      email,
      company: String(b.company || "").slice(0, 200),
      website: String(b.website || "").slice(0, 300),
      monthlySpend: String(b.monthlySpend || "").slice(0, 60),
      tier: String(b.tier || "").slice(0, 40),
      message: String(b.message || "").slice(0, 2000),
      source: String(b.source || "done-for-you").slice(0, 60),
      status: "new",
      createdAt: Date.now(),
    };

    await adminDb().collection(COL.leads).add(lead);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to submit." }, { status: 500 });
  }
}
