// app/api/admin/support/route.ts - customer-service agent works tickets here (admin-gated).
//   GET  → all tickets (newest first)
//   POST { id, reply }   → append an agent reply + email the customer, set status "pending"
//   POST { id, status }  → set status (open|pending|resolved)
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { COL } from "@/lib/collections";
import { sendEmail } from "@/lib/email";
import { supportReplyEmail } from "@/lib/emails";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
const STATUSES = ["open", "pending", "resolved"];

export async function GET(req: NextRequest) {
  const uid = await requireAdmin(req);
  if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  const gs = await adminDb().collection(COL.support).limit(200).get();
  const tickets = gs.docs.map(d => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  return NextResponse.json({ ok: true, tickets });
}

export async function POST(req: NextRequest) {
  try {
    const uid = await requireAdmin(req);
    if (!uid) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });

    const { id, reply, status } = await req.json().catch(() => ({}));
    if (!id) return NextResponse.json({ ok: false, error: "Ticket id required." }, { status: 400 });

    const ref = adminDb().collection(COL.support).doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    const t: any = snap.data();

    if (typeof reply === "string" && reply.trim()) {
      const text = reply.slice(0, 4000).trim();
      await ref.set({ replies: FieldValue.arrayUnion({ from: "agent", text, at: Date.now() }), status: "pending", updatedAt: Date.now() }, { merge: true });
      try { if (t.email) { const m = supportReplyEmail(t.subject, text); await sendEmail({ to: t.email, subject: m.subject, html: m.html }); } } catch { /* */ }
      return NextResponse.json({ ok: true });
    }

    if (status && STATUSES.includes(status)) {
      await ref.set({ status, updatedAt: Date.now() }, { merge: true });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Provide a reply or a valid status." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed." }, { status: 500 });
  }
}
