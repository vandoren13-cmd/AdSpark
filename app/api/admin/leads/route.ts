// app/api/admin/leads/route.ts - work the lead pipeline. Admin-gated.
//   POST { id, status }            → update lead status (new|contacted|won|lost)
//   POST { id, action: "convert" } → create a client from the lead, mark it won
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";

export const runtime = "nodejs";

const STATUSES = ["new", "contacted", "won", "lost"];

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const { id, status, action } = await req.json().catch(() => ({}));
    if (!id) return NextResponse.json({ ok: false, error: "Lead id required." }, { status: 400 });

    const db = adminDb();
    const leadRef = db.collection(COL.leads).doc(String(id));
    const snap = await leadRef.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
    const lead: any = snap.data();

    if (action === "convert") {
      const now = Date.now();
      const client = {
        leadId: String(id), ownerUid: lead.uid || null,
        name: lead.name || "", company: lead.company || "", email: lead.email || "",
        serviceTier: lead.tier || "", mrrUsd: 0,
        platforms: [] as string[], adAccounts: {}, status: "active",
        notes: lead.message || "", startedAt: now, updatedAt: now,
      };
      const ref = await db.collection(COL.clients).add(client);
      await leadRef.set({ status: "won" }, { merge: true });
      return NextResponse.json({ ok: true, clientId: ref.id });
    }

    if (status && STATUSES.includes(status)) {
      await leadRef.set({ status }, { merge: true });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Provide a valid status or action." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
